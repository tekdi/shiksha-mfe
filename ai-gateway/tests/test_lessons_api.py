from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

def test_lesson_publish_gate(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'artifact_root', tmp_path)
    client = TestClient(app)
    created = client.post('/api/v1/lessons/generate', json={'title':'Lesson','source_text':'One. Two.'})
    assert created.status_code == 200
    lesson_id = created.json()['lesson_id']
    assert client.post(f'/api/v1/lessons/{lesson_id}/publish').status_code == 409
    assert client.post(f'/api/v1/lessons/{lesson_id}/approve').status_code == 200
    assert client.post(f'/api/v1/lessons/{lesson_id}/publish').status_code == 200
