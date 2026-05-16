from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import IngestionResponse, LlmAnalysis
from app.services.ingestion_service import ingestion_service
from app.services.llm_client import llm_client
from app.core.config import settings
import time
import uuid
import shutil
import anyio

router = APIRouter()

@router.post("/upload", response_model=IngestionResponse, responses={400: {"description": "Unsupported file format"}})
async def upload_document(file: UploadFile = File(...)):
    start_time = time.time()
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1].lower()
    
    if ext not in ["pdf", "pptx"]:
        raise HTTPException(status_code=400, detail="Only PDF and PPTX files are supported")
    
    temp_path = settings.temp_root / f"{file_id}.{ext}"
    
    def save_file():
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
    await anyio.to_thread.run_sync(save_file)
    
    pages = []
    slides = []
    doc_type = "pdf"
    full_text = ""
    
    if ext == "pdf":
        pages = ingestion_service.parse_pdf(temp_path)
        doc_type = "pdf"
        full_text = "\n".join([b.text for p in pages for b in p.blocks])
    else:
        slides = ingestion_service.parse_pptx(temp_path)
        doc_type = "pptx"
        full_text = "\n".join([s.speaker_notes for s in slides]) + "\n" + "\n".join([" ".join(s.body) for s in slides])

    # Call LLM for analysis
    analysis_prompt = f"Analyze the following text and provide key takeaways and a glossary of terms.\n\nText:\n{full_text[:5000]}"
    analysis_data = await llm_client.generate_json(analysis_prompt)
    
    llm_analysis = LlmAnalysis(**analysis_data)
    
    processing_ms = int((time.time() - start_time) * 1000)
    
    return IngestionResponse(
        file_id=file_id,
        filename=file.filename,
        content_type=file.content_type,
        document_type=doc_type,
        metadata={},
        pages=pages,
        slides=slides,
        llm_analysis=llm_analysis,
        processing_ms=processing_ms
    )
