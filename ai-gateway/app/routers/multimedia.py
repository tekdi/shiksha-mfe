import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.core.config import settings
from app.models.schemas import MultimediaResponse
from app.services.multimedia_service import transcribe, infer_chapters
from app.packaging.multimedia_packages import build_h5p_interactive_video
router = APIRouter()

@router.post('/transcribe', response_model=MultimediaResponse)
async def transcribe_media(file: UploadFile = File(...)):
    suffix = Path(file.filename or '').suffix.lower()
    if suffix not in {'.mp3', '.mp4', '.wav', '.m4a'}:
        raise HTTPException(400, 'Only MP3, MP4, WAV, and M4A files are supported.')
    file_id = str(uuid.uuid4())
    temp = settings.temp_root / f'{file_id}{suffix}'
    temp.write_bytes(await file.read())
    out = settings.artifact_root / 'multimedia' / file_id
    try:
        transcript, segments, txt, vtt = transcribe(temp, out)
        chapters = infer_chapters(segments)
        h5p = build_h5p_interactive_video(file.filename or temp.name, vtt.name, chapters, out / 'interactive_video.h5p')
        return MultimediaResponse(file_id=file_id, filename=file.filename or temp.name, transcript_path=str(txt), vtt_path=str(vtt), transcript=transcript, segments=segments, chapters=chapters, h5p_package_path=str(h5p))
    finally:
        temp.unlink(missing_ok=True)

@router.get('/artifacts/{file_id}/{name}')
def download_artifact(file_id: str, name: str):
    path = settings.artifact_root / 'multimedia' / file_id / name
    if not path.exists():
        raise HTTPException(404, 'Artifact not found')
    return FileResponse(path)
