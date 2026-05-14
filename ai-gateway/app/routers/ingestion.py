from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import shutil
import os
import uuid

from app.services.pdf_parser import parse_pdf
from app.services.pptx_parser import parse_pptx
from app.services.llm_generator import generate_summary_and_glossary

router = APIRouter()

TEMP_DIR = "/tmp/shiksha_ingestion"
os.makedirs(TEMP_DIR, exist_ok=True)

class IngestionResponse(BaseModel):
    file_id: str
    filename: str
    content_type: str
    metadata: dict
    llm_analysis: dict

@router.post("/upload", response_model=IngestionResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Ingests a PDF or PPTX document, parses its structured content, 
    and uses the local LLM to generate summaries and glossaries.
    """
    if not file.filename.endswith((".pdf", ".pptx")):
        raise HTTPException(status_code=400, detail="Only PDF and PPTX files are supported.")
        
    file_id = str(uuid.uuid4())
    temp_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        parsed_data = {}
        if file.filename.endswith(".pdf"):
            parsed_data = parse_pdf(temp_path)
        elif file.filename.endswith(".pptx"):
            parsed_data = parse_pptx(temp_path)
            
        full_text = parsed_data.get("full_text", "")
        
        # Call Local LLM for Module A specific features
        llm_analysis = await generate_summary_and_glossary(full_text)
        
        # Cleanup
        os.remove(temp_path)
        
        # Remove raw text from response to save bandwidth (keep only structured data)
        if "full_text" in parsed_data:
            del parsed_data["full_text"]
            
        return IngestionResponse(
            file_id=file_id,
            filename=file.filename,
            content_type=file.content_type,
            metadata=parsed_data,
            llm_analysis=llm_analysis
        )
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
