"""
Tests for services/ai-engine/main.py

All PDF fixtures are generated in-memory using PyMuPDF (fitz) — no binary
files are committed to the repository.
"""

from __future__ import annotations

import io

import fitz  # PyMuPDF
import pytest
from fastapi.testclient import TestClient

from main import MAX_FILE_SIZE, app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_pdf(
    *,
    body_text: str = "Body text line.",
    heading_text: str | None = "Big Heading",
    heading_font_size: float = 18.0,
    num_pages: int = 1,
) -> bytes:
    """Create a minimal, valid in-memory PDF using PyMuPDF."""
    doc = fitz.open()
    for _ in range(num_pages):
        page = doc.new_page(width=595, height=842)  # A4
        if heading_text:
            page.insert_text(
                (50, 80),
                heading_text,
                fontsize=heading_font_size,
                color=(0, 0, 0),
            )
        page.insert_text(
            (50, 120),
            body_text,
            fontsize=12,
            color=(0, 0, 0),
        )
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _make_pdf_with_image() -> bytes:
    """Create a PDF containing a simple red square image."""
    doc = fitz.open()
    page = doc.new_page()
    
    # Create a small 10x10 red square in memory (RGB)
    pix = fitz.Pixmap(fitz.csRGB, (0, 0, 10, 10))
    pix.clear_with(255, (255, 0, 0)) # Red
    img_bytes = pix.tobytes("png")
    
    page.insert_image(fitz.Rect(50, 50, 100, 100), stream=img_bytes)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _upload(content: bytes, filename: str = "test.pdf", content_type: str = "application/pdf") -> dict:
    """Return a ``files`` dict ready for TestClient.post()."""
    return {"file": (filename, io.BytesIO(content), content_type)}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Shared synchronous TestClient for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(scope="module")
def valid_pdf() -> bytes:
    """Well-formed PDF with a heading and body text."""
    return _make_pdf()


@pytest.fixture(scope="module")
def valid_pdf_data(client: TestClient, valid_pdf: bytes) -> dict:
    """Parsed JSON response for a valid PDF upload."""
    return client.post("/ingest", files=_upload(valid_pdf)).json()


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------


class TestHealthEndpoint:
    def test_returns_200(self, client: TestClient):
        assert client.get("/health").status_code == 200

    def test_returns_healthy_status(self, client: TestClient):
        assert client.get("/health").json() == {"status": "healthy"}

    def test_content_type_is_json(self, client: TestClient):
        assert "application/json" in client.get("/health").headers["content-type"]


# ---------------------------------------------------------------------------
# /ingest — happy path
# ---------------------------------------------------------------------------


class TestIngestHappyPath:
    def test_returns_200(self, client: TestClient, valid_pdf: bytes):
        assert client.post("/ingest", files=_upload(valid_pdf)).status_code == 200

    def test_response_has_all_required_keys(self, valid_pdf_data: dict):
        required = {
            "page_count", "metadata", "pages",
            "body_text", "headers", "images",
            "key_takeaways", "glossary", "narration_script",
        }
        assert required.issubset(valid_pdf_data.keys())

    def test_page_count_is_integer(self, valid_pdf_data: dict):
        assert isinstance(valid_pdf_data["page_count"], int)

    def test_single_page_pdf_has_page_count_one(self, valid_pdf_data: dict):
        assert valid_pdf_data["page_count"] == 1

    def test_pages_is_a_list(self, valid_pdf_data: dict):
        assert isinstance(valid_pdf_data["pages"], list)

    def test_pages_length_matches_page_count(self, valid_pdf_data: dict):
        assert len(valid_pdf_data["pages"]) == valid_pdf_data["page_count"]

    def test_page_entry_has_required_keys(self, valid_pdf_data: dict):
        page = valid_pdf_data["pages"][0]
        assert {"page_num", "text", "headings", "images"}.issubset(page.keys())

    def test_page_num_starts_at_one(self, valid_pdf_data: dict):
        assert valid_pdf_data["pages"][0]["page_num"] == 1

    def test_body_text_is_non_empty(self, valid_pdf_data: dict):
        assert len(valid_pdf_data["body_text"].strip()) > 0

    def test_metadata_is_dict(self, valid_pdf_data: dict):
        assert isinstance(valid_pdf_data["metadata"], dict)

    def test_images_is_list(self, valid_pdf_data: dict):
        assert isinstance(valid_pdf_data["images"], list)

    def test_placeholder_fields_are_empty(self, valid_pdf_data: dict):
        assert valid_pdf_data["key_takeaways"] == []
        assert valid_pdf_data["glossary"] == {}
        assert valid_pdf_data["narration_script"] == ""


# ---------------------------------------------------------------------------
# /ingest — multi-page PDFs
# ---------------------------------------------------------------------------


class TestMultiPagePDF:
    def test_three_page_pdf_has_correct_page_count(self, client: TestClient):
        pdf = _make_pdf(num_pages=3)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert data["page_count"] == 3

    def test_three_page_pdf_has_three_page_entries(self, client: TestClient):
        pdf = _make_pdf(num_pages=3)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert len(data["pages"]) == 3

    def test_page_nums_are_sequential(self, client: TestClient):
        pdf = _make_pdf(num_pages=3)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert [p["page_num"] for p in data["pages"]] == [1, 2, 3]


# ---------------------------------------------------------------------------
# /ingest — image extraction
# ---------------------------------------------------------------------------

class TestImageExtraction:
    def test_extracts_embedded_image(self, client: TestClient):
        pdf = _make_pdf_with_image()
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert len(data["images"]) == 1
        assert data["images"][0]["ext"] == "png"
        assert len(data["images"][0]["data"]) > 0


# ---------------------------------------------------------------------------
# /ingest — heading heuristic
# ---------------------------------------------------------------------------


class TestHeadingHeuristic:
    def test_large_font_text_is_a_heading(self, client: TestClient):
        heading = "Large Section Title"
        pdf = _make_pdf(heading_text=heading, heading_font_size=18.0)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert heading in data["headers"]

    def test_headers_list_is_deduplicated_across_pages(self, client: TestClient):
        """Same heading on every page must appear only once in the global list."""
        heading = "Repeated Heading"
        pdf = _make_pdf(heading_text=heading, heading_font_size=18.0, num_pages=3)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert data["headers"].count(heading) == 1


# ---------------------------------------------------------------------------
# /ingest — error handling
# ---------------------------------------------------------------------------


class TestIngestErrorHandling:
    def test_rejects_non_pdf_content_type(self, client: TestClient):
        resp = client.post("/ingest", files=_upload(b"hello", filename="doc.txt", content_type="text/plain"))
        assert resp.status_code == 400
        assert "Unsupported file type" in resp.json()["detail"]

    def test_rejects_pdf_content_type_with_wrong_extension(self, client: TestClient):
        resp = client.post("/ingest", files=_upload(b"hello", filename="test.png", content_type="application/pdf"))
        assert resp.status_code == 400
        assert "Unsupported file type" in resp.json()["detail"]

    def test_rejects_empty_file(self, client: TestClient):
        resp = client.post("/ingest", files=_upload(b"", content_type="application/pdf"))
        assert resp.status_code == 400
        assert "Empty" in resp.json()["detail"]

    def test_rejects_corrupted_bytes(self, client: TestClient):
        garbage = b"\x00\x01\x02\x03" * 256
        resp = client.post("/ingest", files=_upload(garbage, content_type="application/pdf"))
        assert resp.status_code == 400
        assert "valid PDF" in resp.json()["detail"]

    def test_rejects_file_exceeding_size_limit(self, client: TestClient):
        oversized = b"A" * (MAX_FILE_SIZE + 1)
        resp = client.post("/ingest", files=_upload(oversized, content_type="application/pdf"))
        assert resp.status_code == 413
        assert "too large" in resp.json()["detail"].lower()

    def test_error_detail_does_not_leak_stack_trace(self, client: TestClient):
        garbage = b"not a pdf at all"
        detail = client.post(
            "/ingest",
            files=_upload(garbage, content_type="application/pdf"),
        ).json().get("detail", "")
        assert "Traceback" not in detail
        assert "Exception" not in detail
        assert "fitz" not in detail.lower()
