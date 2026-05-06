"""
AI Engine — PDF ingestion service.

POST /ingest
    Accepts a multipart PDF upload (≤ 10 MB).
    Returns structured JSON with:
      - page_count       : total number of pages
      - metadata         : PDF document metadata dict
      - pages            : per-page array of { page_num, text, headings, images }
      - body_text        : full concatenated plain text (all pages)
      - headers          : deduplicated list of detected headings (all pages)
      - images           : flat list of all embedded images as base64
      - key_takeaways    : placeholder list (future AI enrichment)
      - glossary         : placeholder dict  (future AI enrichment)
      - narration_script : placeholder str   (future AI enrichment)

Error handling
    400  Unsupported content-type (non-PDF)
    400  Empty file (0 bytes)
    400  PDF has no pages
    400  Corrupted / unreadable PDF
    413  File exceeds MAX_FILE_SIZE (10 MB)
"""

from __future__ import annotations

import base64
import logging
from typing import Any

import fitz  # PyMuPDF
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_FILE_SIZE = 10 * 1024 * 1024   # 10 MB hard limit
_CHUNK_SIZE   = 64 * 1024           # 64 KB read-chunk size (avoids seek() DoS)

# Heuristic thresholds for heading detection
_HEADING_FONT_SIZE_THRESHOLD = 14   # pt — spans larger than this are headings
_HEADING_FLAG_BOLD            = 2**4  # PyMuPDF span flag bit for bold text

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Engine API",
    description="PDF ingestion and content-extraction service for the Shiksha MFE platform.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------


class PageImage(BaseModel):
    page: int
    index: int
    ext: str
    data: str   # base64-encoded bytes


class PageResult(BaseModel):
    page_num: int
    text: str
    headings: list[str]
    images: list[PageImage]


class IngestResponse(BaseModel):
    page_count: int
    metadata: dict[str, Any]
    pages: list[PageResult]
    body_text: str
    headers: list[str]
    images: list[PageImage]
    key_takeaways: list[str]
    glossary: dict[str, str]
    narration_script: str


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _read_bounded(file: UploadFile, max_bytes: int) -> bytes:
    """Read *file* in chunks, raising HTTP 413 if it exceeds *max_bytes*.

    Chunked reading avoids loading an arbitrarily large file into memory before
    the size can be checked — the pattern SonarQube flags with ``file.file.seek()``.
    """
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(_CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum allowed size is {max_bytes // (1024 * 1024)} MB.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


def _extract_page(
    doc: fitz.Document,
    page_num: int,
    seen_xrefs: set[int],
) -> tuple[PageResult, list[str]]:
    """Extract text, headings, and images from a single PDF page.

    Parameters
    ----------
    doc:        Open PyMuPDF document.
    page_num:   Zero-based page index.
    seen_xrefs: Mutable set used to deduplicate images across pages.

    Returns
    -------
    (PageResult, new_headings)
        PageResult  — structured data for this page.
        new_headings — heading strings not yet seen on previous pages.
    """
    page = doc.load_page(page_num)

    page_texts: list[str] = []
    page_headings: list[str] = []
    page_images: list[PageImage] = []

    # ── Text & heading extraction ────────────────────────────────────────────
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE).get("blocks", [])
    for block in blocks:
        if block.get("type") != 0:   # 0 = text block, 1 = image block
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                if not text:
                    continue

                font_size: float = span.get("size", 0)
                flags: int       = span.get("flags", 0)
                is_bold: bool    = bool(flags & _HEADING_FLAG_BOLD)

                if font_size > _HEADING_FONT_SIZE_THRESHOLD or is_bold:
                    if text not in page_headings:
                        page_headings.append(text)

                page_texts.append(text)

    # ── Embedded image extraction ────────────────────────────────────────────
    for img_index, img_info in enumerate(page.get_images(full=True)):
        xref: int = img_info[0]
        if xref in seen_xrefs:
            continue
        seen_xrefs.add(xref)

        try:
            base_image  = doc.extract_image(xref)
            image_bytes = base_image.get("image")
            image_ext   = base_image.get("ext", "png")
        except Exception:
            logger.warning("Could not extract image xref=%d on page %d — skipping.", xref, page_num + 1)
            continue

        if image_bytes:
            page_images.append(
                PageImage(
                    page=page_num + 1,
                    index=img_index,
                    ext=image_ext,
                    data=base64.b64encode(image_bytes).decode("utf-8"),
                )
            )

    return (
        PageResult(
            page_num=page_num + 1,
            text=" ".join(page_texts),
            headings=page_headings,
            images=page_images,
        ),
        page_headings,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Ops"])
def health_check() -> dict[str, str]:
    """Liveness probe — always returns ``{"status": "healthy"}``."""
    return {"status": "healthy"}


@app.post(
    "/ingest",
    response_model=IngestResponse,
    tags=["Ingestion"],
    summary="Ingest a PDF and extract structured content",
    responses={
        400: {"description": "Unsupported file type, empty file, zero-page PDF, or corrupted PDF"},
        413: {"description": "File exceeds the 10 MB size limit"},
    },
)
async def ingest_pdf(file: UploadFile = File(...)) -> IngestResponse:
    """Upload a PDF and receive fully structured extracted content.

    The endpoint performs:
    - Content-type validation (only ``application/pdf`` is accepted)
    - Bounded streaming read (guard against oversized uploads)
    - Per-page text extraction via PyMuPDF's dict mode
    - Heading detection heuristic (font size > 14 pt **or** bold flag)
    - Embedded image extraction and base64 encoding (cross-page deduplication)
    - PDF document metadata extraction
    """

    # ── Content-type guard ───────────────────────────────────────────────────
    # Strip optional parameters such as "; charset=binary"
    content_type = (file.content_type or "").split(";")[0].strip()
    if content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF files (application/pdf) are accepted.",
        )

    # ── Bounded read ─────────────────────────────────────────────────────────
    content = await _read_bounded(file, MAX_FILE_SIZE)
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    # ── PDF parsing ──────────────────────────────────────────────────────────
    all_pages: list[PageResult] = []
    all_headings: list[str]     = []
    seen_xrefs: set[int]        = set()
    metadata: dict[str, Any]    = {}

    try:
        with fitz.open(stream=content, filetype="pdf") as doc:
            if doc.page_count == 0:
                raise HTTPException(status_code=400, detail="PDF has no pages.")

            metadata = {k: v for k, v in (doc.metadata or {}).items() if v}

            for page_num in range(doc.page_count):
                page_result, new_headings = _extract_page(doc, page_num, seen_xrefs)
                all_pages.append(page_result)
                for h in new_headings:
                    if h not in all_headings:
                        all_headings.append(h)

    except HTTPException:
        raise   # re-raise our own HTTP errors unchanged
    except Exception:
        logger.exception("Unexpected error while parsing PDF.")
        raise HTTPException(
            status_code=400,
            detail="Failed to parse PDF. Please ensure it is a valid, non-encrypted document.",
        )

    # ── Aggregate fields ─────────────────────────────────────────────────────
    body_text  = " ".join(p.text for p in all_pages)
    all_images = [img for p in all_pages for img in p.images]

    return IngestResponse(
        page_count=len(all_pages),
        metadata=metadata,
        pages=all_pages,
        body_text=body_text,
        headers=all_headings,
        images=all_images,
        key_takeaways=[],
        glossary={},
        narration_script="",
    )
