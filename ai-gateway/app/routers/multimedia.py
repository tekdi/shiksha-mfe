from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import shutil
import os
import uuid

from app.services.transcription_service import transcribe_audio_whisper

router = APIRouter()

TEMP_DIR = "/tmp/shiksha_multimedia"
OUTPUT_DIR = "/tmp/shiksha_multimedia_outputs"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

class MultimediaResponse(BaseModel):
    file_id: str
    filename: str
    vtt_url: str
    transcript_preview: str

@router.post("/transcribe", response_model=MultimediaResponse)
async def transcribe_media(file: UploadFile = File(...)):
    """
    Ingests an audio or video file and transcribes it using local Whisper.
    Returns a VTT file suitable for H5P Interactive Video.
    """
    if not file.filename.endswith((".mp3", ".mp4", ".wav", ".m4a")):
        raise HTTPException(status_code=400, detail="Only MP3, MP4, WAV, and M4A files are supported.")
        
    file_id = str(uuid.uuid4())
    temp_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Call Local Whisper for Module C specific features
        transcription_result = transcribe_audio_whisper(temp_path, OUTPUT_DIR)
        
        if transcription_result.get("status") == "error":
            raise Exception(transcription_result.get("error_message"))
        
        # Cleanup input file
        os.remove(temp_path)
            
        return MultimediaResponse(
            file_id=file_id,
            filename=file.filename,
            vtt_url=f"/api/v1/multimedia/download/{file_id}.vtt", # Mock download route
            transcript_preview=transcription_result.get("transcript_preview", "")
        )
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to transcribe media: {str(e)}")
