import time, uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import settings
from app.models.schemas import IngestionResponse
from app.services.ingestion_service import parse_pdf, parse_pptx
from app.services.analysis_service import analyze_document
router = APIRouter()

@router.post('/upload', response_model=IngestionResponse)
async def upload_document(file: UploadFile = File(...)):
    suffix = Path(file.filename or '').suffix.lower()
    if suffix not in {'.pdf', '.pptx'}:
        raise HTTPException(400, 'Only PDF and PPTX files are supported.')
    started = time.perf_counter()
    file_id = str(uuid.uuid4())
    temp = settings.temp_root / f'{file_id}{suffix}'
    temp.write_bytes(await file.read())
    try:
        if suffix == '.pdf':
            metadata, pages, text = parse_pdf(temp)
            slides = []
            speaker_notes = ''
            doc_type = 'pdf'
        else:
            metadata, slides, text = parse_pptx(temp)
            pages = []
            speaker_notes = '\n'.join(slide.speaker_notes for slide in slides if slide.speaker_notes)
            doc_type = 'pptx'
        analysis = await analyze_document(text, speaker_notes)
        return IngestionResponse(file_id=file_id, filename=file.filename or temp.name, content_type=file.content_type, document_type=doc_type, metadata=metadata, pages=pages, slides=slides, llm_analysis=analysis, processing_ms=int((time.perf_counter()-started)*1000))
    finally:
        temp.unlink(missing_ok=True)
