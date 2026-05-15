import time
import uuid
from pathlib import Path
from app.core.config import settings
from app.models.schemas import Branding, LessonStatus
from app.packaging.lesson_packages import build_html_lesson, build_h5p_course_presentation, build_scorm_lesson
from app.services.review_service import init_status

def build_lesson(title: str, source_text: str, branding: Branding):
    started = time.perf_counter()
    lesson_id = str(uuid.uuid4())
    out = settings.artifact_root / 'lessons' / lesson_id
    sentences = [s.strip() for s in source_text.replace('\n', ' ').split('.') if s.strip()]
    slides = sentences[:8] or [source_text[:300]]
    html_path = build_html_lesson(title, slides, branding, out / 'lesson.html')
    h5p = build_h5p_course_presentation(title, slides, out / 'lesson.h5p')
    scorm = build_scorm_lesson(title, html_path.read_text(encoding='utf-8'), out / 'lesson_scorm.zip')
    init_status(lesson_id)
    events = [
        {'verb': 'started', 'object': lesson_id},
        {'verb': 'progressed', 'object': lesson_id, 'result': {'progress': 0}},
        {'verb': 'completed', 'object': lesson_id, 'result': {'completion': True}},
        {'verb': 'scored', 'object': lesson_id, 'result': {'score': {'raw': 0}}},
    ]
    generation_ms = int((time.perf_counter() - started) * 1000)
    return lesson_id, html_path, h5p, scorm, events, LessonStatus.draft, generation_ms
