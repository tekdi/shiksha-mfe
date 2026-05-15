from app.models.schemas import LessonStatus
from app.services.review_service import init_status, read_status, approve, publish
from app.core.config import settings

def test_publish_requires_approval(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'artifact_root', tmp_path)
    init_status('lesson')
    assert read_status('lesson') == LessonStatus.draft
    try:
        publish('lesson')
        assert False, 'publish should fail before approval'
    except PermissionError:
        pass
    assert approve('lesson') == LessonStatus.approved
    assert publish('lesson') == LessonStatus.published
