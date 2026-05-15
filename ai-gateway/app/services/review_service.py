import json
from pathlib import Path
from app.core.config import settings
from app.models.schemas import LessonStatus

def _path(lesson_id: str) -> Path:
    return settings.artifact_root / 'lessons' / lesson_id / 'status.json'

def init_status(lesson_id: str):
    path = _path(lesson_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({'status': LessonStatus.draft.value}), encoding='utf-8')

def read_status(lesson_id: str) -> LessonStatus:
    path = _path(lesson_id)
    if not path.exists():
        raise FileNotFoundError(lesson_id)
    return LessonStatus(json.loads(path.read_text(encoding='utf-8'))['status'])

def approve(lesson_id: str) -> LessonStatus:
    path = _path(lesson_id)
    if not path.exists():
        raise FileNotFoundError(lesson_id)
    path.write_text(json.dumps({'status': LessonStatus.approved.value}), encoding='utf-8')
    return LessonStatus.approved

def publish(lesson_id: str) -> LessonStatus:
    if read_status(lesson_id) != LessonStatus.approved:
        raise PermissionError('Lesson must be approved before publishing')
    _path(lesson_id).write_text(json.dumps({'status': LessonStatus.published.value}), encoding='utf-8')
    return LessonStatus.published
