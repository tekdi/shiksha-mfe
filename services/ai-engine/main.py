import base64
import logging
import os
import tempfile
from typing import Annotated

import fitz  # PyMuPDF
from fastapi import FastAPI, File, HTTPException, UploadFile

# ---------------------------------------------------------------------------
# Logging — errors are logged internally; clients never see raw tracebacks
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
_CHUNK_SIZE = 64 * 1024           # 64 KB per read

app = FastAPI(title="AI Engine API")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _read_bounded_to_disk(file: UploadFile, max_bytes: int) -> str:
    """Stream upload in chunks to a temp file; raise 413 if limit exceeded.

    Uses try/except around the write loop so the temp file is always
    cleaned up — even on unexpected I/O or network failures.
    """
    total = 0
    # Create the file first so we always have a name to clean up
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        with tmp:
            while True:
                chunk = await file.read(_CHUNK_SIZE)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail="File too large. Maximum allowed size is 10 MB.",
                    )
                tmp.write(chunk)
        return tmp.name
    except Exception:
        # Clean up the orphaned temp file on any failure
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)
        raise


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check() -> dict:
    return {"status": "healthy"}


@app.post("/ingest")
async def ingest_pdf(file: Annotated[UploadFile, File(...)]) -> dict:
    """Ingest a PDF and return structured extracted content."""
    # Validate content-type
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF files are accepted.",
        )

    # Initialize so the finally block is always safe
    temp_path: str | None = None

    try:
        temp_path = await _read_bounded_to_disk(file, MAX_FILE_SIZE)

        if os.path.getsize(temp_path) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        # Use context manager — guarantees fitz resources are freed on all paths
        with fitz.open(temp_path) as doc:
            if doc.page_count == 0:
                raise HTTPException(status_code=400, detail="PDF has no pages.")

            metadata = doc.metadata or {}
            headers: list[str] = []
            body_text_parts: list[str] = []
            images: list[dict] = []

            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)

                # ── Text extraction ──────────────────────────────────────
                blocks = page.get_text("dict").get("blocks", [])
                for b in blocks:
                    if b.get("type") != 0:
                        continue
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            if not text:
                                continue
                            font_size = span.get("size", 0)
                            is_bold = bool(span.get("flags", 0) & 2 ** 4)
                            if font_size > 14 or is_bold:
                                if text not in headers:
                                    headers.append(text)
                            body_text_parts.append(text)

                # ── Image extraction ─────────────────────────────────────
                for img_index, img in enumerate(page.get_images(full=True)):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image.get("image")
                    if image_bytes:
                        images.append({
                            "page": page_num + 1,
                            "index": img_index,
                            "ext": base_image.get("ext"),
                            "data": base64.b64encode(image_bytes).decode("utf-8"),
                        })

        return {
            "headers": headers,
            "body_text": " ".join(body_text_parts),
            "images": images,
            "metadata": metadata,
            "key_takeaways": [],
            "glossary": {},
            "narration_script": "",
        }

    except (fitz.FileDataError, fitz.EmptyFileError):
        logger.error("PyMuPDF failed to open file — corrupted or invalid PDF.")
        raise HTTPException(
            status_code=400,
            detail="Failed to parse PDF. Ensure the file is a valid, non-encrypted PDF.",
        )
    finally:
        # Always clean up the temp file — temp_path=None means streaming failed
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
