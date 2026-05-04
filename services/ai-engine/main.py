import base64
from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
import fitz  # PyMuPDF

app = FastAPI(title="AI Engine API")

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF is allowed.")
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    if doc.page_count == 0:
        raise HTTPException(status_code=400, detail="PDF has no pages.")
        
    headers = []
    body_text_parts = []
    images = []
    
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

    doc.close()
    
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
