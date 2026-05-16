from fastapi import APIRouter, HTTPException
from app.models.schemas import MicroLessonRequest, MicroLessonResponse
from app.services.lesson_service import build_lesson
from app.services.review_service import approve, publish, read_status

router = APIRouter()
ERROR_LESSON_NOT_FOUND = "Lesson not found"

@router.post('/generate', response_model=MicroLessonResponse)
async def generate_lesson(request: MicroLessonRequest):
    result = await build_lesson(request.title, request.source_text, request.branding)
    return result

@router.post('/{lesson_id}/approve', responses={404: {"description": ERROR_LESSON_NOT_FOUND}})
def approve_lesson(lesson_id: str):
    try:
        return {'lesson_id': lesson_id, 'status': approve(lesson_id)}
    except FileNotFoundError:
        raise HTTPException(404, ERROR_LESSON_NOT_FOUND)

@router.post('/{lesson_id}/publish', responses={
    404: {"description": ERROR_LESSON_NOT_FOUND},
    409: {"description": "Conflict/Permission Error"}
})
def publish_lesson(lesson_id: str):
    try:
        return {'lesson_id': lesson_id, 'status': publish(lesson_id)}
    except FileNotFoundError:
        raise HTTPException(404, ERROR_LESSON_NOT_FOUND)
    except PermissionError as e:
        raise HTTPException(409, str(e))

@router.get('/{lesson_id}/status', responses={404: {"description": ERROR_LESSON_NOT_FOUND}})
def lesson_status(lesson_id: str):
    try:
        return {'lesson_id': lesson_id, 'status': read_status(lesson_id)}
    except FileNotFoundError:
        raise HTTPException(404, ERROR_LESSON_NOT_FOUND)
