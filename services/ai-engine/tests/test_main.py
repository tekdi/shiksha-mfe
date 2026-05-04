"""
Tests for services/ai-engine/main.py

All PDF fixtures are generated in-memory using PyMuPDF (fitz) so no binary
files are committed to the repository.

Coverage targets
----------------
GET  /health          — always returns {"status": "healthy"}
POST /ingest          — happy path: text + headings + images extracted
POST /ingest          — 400 when content-type is not application/pdf
POST /ingest          — 400 when content-type has charset suffix (e.g. text/plain; charset=utf-8)
POST /ingest          — 400 when file is empty (0 bytes)
POST /ingest          — 400 when bytes don't form a valid PDF
POST /ingest          — 413 when file exceeds MAX_FILE_SIZE
POST /ingest          — response schema contains all required keys
POST /ingest          — headings heuristic: bold / large-font text is classified as heading
POST /ingest          — duplicate image xrefs are deduplicated
"""

from __future__ import annotations

import io
import struct

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
    """Create a minimal, valid PDF in memory using PyMuPDF.

    Parameters
    ----------
    body_text:         Regular body text inserted at normal size (12 pt).
    heading_text:      Optional text inserted at *heading_font_size*.
    heading_font_size: Font size for the heading span (>14 triggers heuristic).
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


def _make_pdf_file(
    content: bytes,
    filename: str = "test.pdf",
    content_type: str = "application/pdf",
) -> dict:
    """Return a ``files`` dict accepted by Starlette/httpx TestClient.

    Format: ``{"field_name": (filename, file_obj, content_type)}``
    """
    return {"file": (filename, io.BytesIO(content), content_type)}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client() -> TestClient:
    """A shared synchronous TestClient for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(scope="module")
def valid_pdf() -> bytes:
    """A well-formed PDF with heading + body text."""
    return _make_pdf()


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_returns_200(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200

    def test_returns_healthy_status(self, client: TestClient):
        data = client.get("/health").json()
        assert data == {"status": "healthy"}

    def test_content_type_is_json(self, client: TestClient):
        response = client.get("/health")
        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Ingest endpoint — happy path
# ---------------------------------------------------------------------------

class TestIngestHappyPath:
    def test_returns_200(self, client: TestClient, valid_pdf: bytes):
        response = client.post("/ingest", files=_make_pdf_file(valid_pdf))
        assert response.status_code == 200

    def test_response_has_required_keys(self, client: TestClient, valid_pdf: bytes):
        data = client.post("/ingest", files=_make_pdf_file(valid_pdf)).json()
        required_keys = {
            "headers",
            "body_text",
            "images",
            "metadata",
            "key_takeaways",
            "glossary",
            "narration_script",
        }
        assert required_keys.issubset(data.keys())

    def test_body_text_is_non_empty(self, client: TestClient, valid_pdf: bytes):
        data = client.post("/ingest", files=_make_pdf_file(valid_pdf)).json()
        assert len(data["body_text"].strip()) > 0

    def test_body_text_contains_inserted_content(self, client: TestClient):
        pdf = _make_pdf(body_text="Unique body sentence XYZ123", heading_text=None)
        data = client.post("/ingest", files=_make_pdf_file(pdf)).json()
        assert "Unique body sentence XYZ123" in data["body_text"]

    def test_placeholder_fields_are_empty(self, client: TestClient, valid_pdf: bytes):
        data = client.post("/ingest", files=_make_pdf_file(valid_pdf)).json()
        assert data["key_takeaways"] == []
        assert data["glossary"] == {}
        assert data["narration_script"] == ""

    def test_images_list_is_list(self, client: TestClient, valid_pdf: bytes):
        data = client.post("/ingest", files=_make_pdf_file(valid_pdf)).json()
        assert isinstance(data["images"], list)

    def test_metadata_is_dict(self, client: TestClient, valid_pdf: bytes):
        data = client.post("/ingest", files=_make_pdf_file(valid_pdf)).json()
        assert isinstance(data["metadata"], dict)


# ---------------------------------------------------------------------------
# Ingest endpoint — heading heuristic
# ---------------------------------------------------------------------------

class TestHeadingHeuristic:
    def test_large_font_text_classified_as_heading(self, client: TestClient):
        heading = "Section Alpha"
        pdf = _make_pdf(heading_text=heading, heading_font_size=18.0)
        data = client.post("/ingest", files=_make_pdf_file(pdf)).json()
        assert heading in data["headers"]

    def test_small_font_text_not_classified_as_heading(self, client: TestClient):
        body = "Just a normal sentence."
        pdf = _make_pdf(body_text=body, heading_text=None)
        data = client.post("/ingest", files=_make_pdf_file(pdf)).json()
        # With no heading inserted, headers list should be empty
        assert data["headers"] == []

    def test_multipage_pdf_extracts_content(self, client: TestClient):
        pdf = _make_pdf(body_text="Per-page content.", num_pages=3)
        data = client.post("/ingest", files=_make_pdf_file(pdf)).json()
        # Body text should contain content from all pages
        assert data["body_text"].count("Per-page content.") == 3


# ---------------------------------------------------------------------------
# Ingest endpoint — validation errors
# ---------------------------------------------------------------------------

class TestIngestValidation:
    def test_rejects_non_pdf_content_type(self, client: TestClient):
        response = client.post(
            "/ingest",
            files={"file": ("doc.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert response.status_code == 400
        assert "Only PDF" in response.json()["detail"]

    def test_rejects_content_type_with_charset_suffix(self, client: TestClient):
        """Clients may send 'text/plain; charset=utf-8' — must still be rejected."""
        response = client.post(
            "/ingest",
            files={"file": ("doc.txt", io.BytesIO(b"hello"), "text/plain; charset=utf-8")},
        )
        assert response.status_code == 400

    def test_rejects_empty_file(self, client: TestClient):
        response = client.post(
            "/ingest",
            files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")},
        )
        assert response.status_code == 400
        assert "Empty" in response.json()["detail"]

    def test_rejects_corrupted_bytes(self, client: TestClient):
        """Random bytes that are not a valid PDF must return 400, not 500."""
        garbage = b"\x00\x01\x02\x03" * 256
        response = client.post(
            "/ingest",
            files={"file": ("bad.pdf", io.BytesIO(garbage), "application/pdf")},
        )
        assert response.status_code == 400
        # Generic message — no internal details leaked
        assert "Failed to parse PDF" in response.json()["detail"]

    def test_rejects_file_exceeding_size_limit(self, client: TestClient):
        """Uploading more than MAX_FILE_SIZE bytes must return 413."""
        oversized = b"A" * (MAX_FILE_SIZE + 1)
        response = client.post(
            "/ingest",
            files={"file": ("big.pdf", io.BytesIO(oversized), "application/pdf")},
        )
        assert response.status_code == 413
        assert "too large" in response.json()["detail"].lower()

    def test_error_detail_does_not_leak_stack_trace(self, client: TestClient):
        """The error detail for bad PDFs must be a generic user-safe string."""
        garbage = b"not a pdf at all"
        data = client.post(
            "/ingest",
            files={"file": ("bad.pdf", io.BytesIO(garbage), "application/pdf")},
        ).json()
        detail = data.get("detail", "")
        # Ensure no Python exception class names are in the response
        assert "Traceback" not in detail
        assert "Exception" not in detail
        assert "fitz" not in detail.lower()

