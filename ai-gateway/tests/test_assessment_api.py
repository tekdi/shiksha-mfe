from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import Question, QuestionType, SourceEvidence
from app.routers import assessment
from app.core.config import settings

def test_assessment_endpoint_packages_outputs(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'artifact_root', tmp_path)
    async def fake_questions(source_text, types, count):
        return [Question(type=QuestionType.mcq,prompt='What?',options=['A','B'],answer='A',explanation='Because',evidence=SourceEvidence(quote='Because'))]
    monkeypatch.setattr(assessment, 'generate_questions', fake_questions)
    client = TestClient(app)
    response = client.post('/api/v1/assessment/generate', json={'source_text':'Because','question_types':['mcq'],'question_count':1})
    assert response.status_code == 200
    body = response.json()
    assert body['questions'][0]['type'] == 'mcq'
    assert body['h5p_package_path'].endswith('.h5p')
