from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.services.multimedia_service import transcribe, infer_chapters
from app.models.schemas import MultimediaResponse
from app.core.config import settings
import uuid
import shutil
import anyio

router = APIRouter()

@router.post("/transcribe", response_model=MultimediaResponse, responses={400: {"description": "Unsupported media format"}})
async def transcribe_media(
    file: UploadFile = File(...),
    language: str = Query(default='auto', pattern='^(auto|en|hi)$'),
):
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1].lower()
    
    if ext not in ["mp4", "wav", "mp3"]:
        raise HTTPException(status_code=400, detail="Unsupported media format")
    
    temp_path = settings.temp_root / f"{file_id}.{ext}"
    output_dir = settings.artifact_root / file_id
    
    def save_file():
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
    await anyio.to_thread.run_sync(save_file)
        
    transcript, segments, txt_path, vtt_path = await transcribe(temp_path, output_dir, language)
    chapters = infer_chapters(segments)
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "transcript": transcript,
        "transcript_path": f"/artifacts/{file_id}/{txt_path.name}",
        "vtt_path": f"/artifacts/{file_id}/{vtt_path.name}",
        "segments": segments,
        "chapters": chapters
    }
