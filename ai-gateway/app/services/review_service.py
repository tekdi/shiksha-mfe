from app.models.schemas import LessonStatus
from fastapi import HTTPException

class ReviewService:
    def __init__(self):
        # In-memory storage for demo purposes, replace with DB in production
        self._lessons = {}

    def init_status(self, lesson_id: str):
        self._lessons[lesson_id] = LessonStatus.draft

    def get_status(self, lesson_id: str) -> LessonStatus:
        return self._lessons.get(lesson_id, LessonStatus.draft)

    def approve(self, lesson_id: str) -> LessonStatus:
        status = self.get_status(lesson_id)
        if status == LessonStatus.published:
            raise HTTPException(status_code=400, detail="Already published")
        self._lessons[lesson_id] = LessonStatus.approved
        return LessonStatus.approved

    def publish(self, lesson_id: str) -> LessonStatus:
        status = self.get_status(lesson_id)
        if status != LessonStatus.approved:
            raise HTTPException(status_code=409, detail="Lesson must be approved before publishing")
        self._lessons[lesson_id] = LessonStatus.published
        return LessonStatus.published

review_service = ReviewService()

# Export functions for cleaner API routing
def init_status(lesson_id: str):
    return review_service.init_status(lesson_id)

def read_status(lesson_id: str):
    return review_service.get_status(lesson_id)

def approve(lesson_id: str):
    return review_service.approve(lesson_id)

def publish(lesson_id: str):
    return review_service.publish(lesson_id)
