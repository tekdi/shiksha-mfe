import pytest
from app.models.schemas import QuestionType
from app.services import assessment_service

@pytest.mark.asyncio
async def test_generation_filters_ungrounded_questions(monkeypatch):
    async def fake_generate_json(prompt):
        return [
            {'type':'mcq','prompt':'What happens?','options':['Plants convert sunlight','Nothing'],'answer':'Plants convert sunlight','pairs':[],'explanation':'Source says so','evidence':{'quote':'Plants convert sunlight into chemical energy.'}},
            {'type':'mcq','prompt':'Hallucinated?','options':['x'],'answer':'x','pairs':[],'explanation':'No','evidence':{'quote':'Not in source'}},
        ]
    monkeypatch.setattr(assessment_service.llm_client, 'generate_json', fake_generate_json)
    questions = await assessment_service.generate_questions('Plants convert sunlight into chemical energy.', [QuestionType.mcq], 2)
    assert len(questions) == 1
