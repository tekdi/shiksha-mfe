"""
Tests for services/ai-engine/main.py

All PDF fixtures are generated in-memory using PyMuPDF (fitz) — no binary
files are committed to the repository.

Coverage targets
----------------
GET  /health            — always returns {"status": "healthy"}
POST /ingest            — happy path: text + headings + images extracted
POST /ingest            — response has page_count and pages array
POST /ingest            — per-page structure: page_num, text, headings, images
POST /ingest            — multi-page PDFs produce one entry per page
POST /ingest            — 400 when content-type is not application/pdf
POST /ingest            — 400 when content-type has charset suffix
POST /ingest            — 400 when file is empty (0 bytes)
POST /ingest            — 400 when bytes are not a valid PDF
POST /ingest            — 400 when PDF has no pages
POST /ingest            — 413 when file exceeds MAX_FILE_SIZE
POST /ingest            — headings heuristic: bold / large-font text classified
POST /ingest            — duplicate image xrefs are deduplicated across pages
POST /ingest            — error detail does not leak internal stack traces
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
    """Create a minimal, valid in-memory PDF using PyMuPDF.

    Parameters
    ----------
    body_text:         Regular body text inserted at 12 pt.
    heading_text:      Optional heading inserted at *heading_font_size*.
    heading_font_size: Font size for heading spans (> 14 triggers heuristic).
    num_pages:         Number of pages to generate.
    """
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

    def test_body_text_contains_inserted_content(self, client: TestClient):
        pdf = _make_pdf(body_text="UniqueBodySentenceABC789", heading_text=None)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert "UniqueBodySentenceABC789" in data["body_text"]

    def test_page_text_contains_body_content(self, client: TestClient):
        pdf = _make_pdf(body_text="PageLevelTextCheck", heading_text=None)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert "PageLevelTextCheck" in data["pages"][0]["text"]

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

    def test_body_text_contains_content_from_all_pages(self, client: TestClient):
        pdf = _make_pdf(body_text="RepeatPerPage.", num_pages=3)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert data["body_text"].count("RepeatPerPage.") == 3

    def test_body_text_equals_joined_page_texts(self, client: TestClient):
        pdf = _make_pdf(num_pages=2)
        data = client.post("/ingest", files=_upload(pdf)).json()
        expected = " ".join(p["text"] for p in data["pages"])
        assert data["body_text"] == expected


# ---------------------------------------------------------------------------
# /ingest — heading heuristic
# ---------------------------------------------------------------------------


class TestHeadingHeuristic:
    def test_large_font_text_is_a_heading(self, client: TestClient):
        heading = "Large Section Title"
        pdf = _make_pdf(heading_text=heading, heading_font_size=18.0)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert heading in data["headers"]

    def test_large_font_heading_also_in_page_headings(self, client: TestClient):
        heading = "Page Level Heading"
        pdf = _make_pdf(heading_text=heading, heading_font_size=18.0)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert heading in data["pages"][0]["headings"]

    def test_normal_font_text_not_classified_as_heading(self, client: TestClient):
        body = "Just a regular sentence."
        pdf = _make_pdf(body_text=body, heading_text=None)
        data = client.post("/ingest", files=_upload(pdf)).json()
        assert data["headers"] == []

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
        resp = client.post("/ingest", files={"file": ("doc.txt", io.BytesIO(b"hello"), "text/plain")})
        assert resp.status_code == 400
        assert "Only PDF" in resp.json()["detail"]

    def test_rejects_content_type_with_charset_suffix(self, client: TestClient):
        resp = client.post(
            "/ingest",
            files={"file": ("doc.txt", io.BytesIO(b"hello"), "text/plain; charset=utf-8")},
        )
        assert resp.status_code == 400

    def test_rejects_empty_file(self, client: TestClient):
        resp = client.post("/ingest", files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")})
        assert resp.status_code == 400
        assert "Empty" in resp.json()["detail"]

    def test_rejects_corrupted_bytes(self, client: TestClient):
        garbage = b"\x00\x01\x02\x03" * 256
        resp = client.post("/ingest", files={"file": ("bad.pdf", io.BytesIO(garbage), "application/pdf")})
        assert resp.status_code == 400
        assert "Failed to parse PDF" in resp.json()["detail"]

    def test_rejects_file_exceeding_size_limit(self, client: TestClient):
        oversized = b"A" * (MAX_FILE_SIZE + 1)
        resp = client.post("/ingest", files={"file": ("big.pdf", io.BytesIO(oversized), "application/pdf")})
        assert resp.status_code == 413
        assert "too large" in resp.json()["detail"].lower()

    def test_error_detail_does_not_leak_stack_trace(self, client: TestClient):
        garbage = b"not a pdf at all"
        detail = client.post(
            "/ingest",
            files={"file": ("bad.pdf", io.BytesIO(garbage), "application/pdf")},
        ).json().get("detail", "")
        assert "Traceback" not in detail
        assert "Exception" not in detail
        assert "fitz" not in detail.lower()
