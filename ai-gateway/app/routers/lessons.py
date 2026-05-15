from fastapi import APIRouter
from app.models.schemas import MicroLessonRequest, MicroLessonResponse
from app.services.lesson_service import build_lesson
from app.services.review_service import approve, publish, read_status
from fastapi import HTTPException
router = APIRouter()

@router.post('/generate', response_model=MicroLessonResponse)
def generate_lesson(request: MicroLessonRequest):
    lesson_id, html, h5p, scorm, events, status, generation_ms = build_lesson(request.title, request.source_text, request.branding)
    return MicroLessonResponse(lesson_id=lesson_id, title=request.title, status=status, html_path=str(html), h5p_package_path=str(h5p), scorm_package_path=str(scorm), xapi_events=events, generation_ms=generation_ms)

@router.post('/{lesson_id}/approve')
def approve_lesson(lesson_id: str):
    try:
        return {'lesson_id': lesson_id, 'status': approve(lesson_id)}
    except FileNotFoundError:
        raise HTTPException(404, 'Lesson not found')

@router.post('/{lesson_id}/publish')
def publish_lesson(lesson_id: str):
    try:
        return {'lesson_id': lesson_id, 'status': publish(lesson_id)}
    except FileNotFoundError:
        raise HTTPException(404, 'Lesson not found')
    except PermissionError as exc:
        raise HTTPException(409, str(exc))

@router.get('/{lesson_id}/status')
def lesson_status(lesson_id: str):
    try:
        return {'lesson_id': lesson_id, 'status': read_status(lesson_id)}
    except FileNotFoundError:
        raise HTTPException(404, 'Lesson not found')
