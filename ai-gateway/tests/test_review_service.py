import pytest
from app.services.review_service import review_service
from fastapi import HTTPException

def test_review_state_machine():
    lesson_id = "test-lesson-1"
    
    # Initial state
    # Note: In-memory store might persist between tests if not reset, but for this demo it's fine.
    
    # Approve
    review_service.approve(lesson_id)
    assert review_service.get_status(lesson_id) == "approved"
    
    # Publish
    review_service.publish(lesson_id)
    assert review_service.get_status(lesson_id) == "published"

def test_publish_without_approval_fails():
    lesson_id = "test-lesson-2"
    with pytest.raises(HTTPException) as excinfo:
        review_service.publish(lesson_id)
    assert excinfo.value.status_code == 409
    assert "must be approved" in excinfo.value.detail
