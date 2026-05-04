import base64
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
import fitz  # PyMuPDF

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Engine API")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF is allowed.")
    
    # Check file size before reading into memory to prevent potential DoS
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
    headers = []
    body_text_parts = []
    images = []
    metadata = {}
    seen_xrefs = set()
    
    try:
        with fitz.open(stream=content, filetype="pdf") as doc:
            if doc.page_count == 0:
                raise HTTPException(status_code=400, detail="PDF has no pages.")
                
            metadata = doc.metadata or {}
            
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                
                # Extract text blocks for headings and body text
                blocks = page.get_text("dict").get("blocks", [])
                for b in blocks:
                    if b.get("type") == 0:  # Text block
                        for l in b.get("lines", []):
                            for s in l.get("spans", []):
                                text = s.get("text", "").strip()
                                if not text:
                                    continue
                                
                                # Heuristic for headings: larger font size or bold
                                font_size = s.get("size", 0)
                                flags = s.get("flags", 0)
                                is_bold = bool(flags & 2 ** 4)
                                
                                if font_size > 14 or is_bold:
                                    if text not in headers:
                                        headers.append(text)
                                
                                body_text_parts.append(text)
                
                # Extract images
                image_list = page.get_images(full=True)
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    if xref in seen_xrefs:
                        continue
                    seen_xrefs.add(xref)
                    
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image.get("image")
                    image_ext = base_image.get("ext")
                    
                    if image_bytes:
                        b64_img = base64.b64encode(image_bytes).decode("utf-8")
                        images.append({
                            "page": page_num + 1,
                            "index": img_index,
                            "ext": image_ext,
                            "data": b64_img
                        })
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while parsing PDF")
        raise HTTPException(status_code=400, detail="Failed to parse PDF. Please ensure it is a valid document.")
    
    body_text = " ".join(body_text_parts)
    
    return {
        "headers": headers,
        "body_text": body_text,
        "images": images,
        "metadata": metadata,
        "key_takeaways": [],
        "glossary": {},
        "narration_script": ""
    }
