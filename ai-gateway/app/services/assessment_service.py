from app.models.schemas import AssessmentRequest, AssessmentResponse, MCQQuestion, FITBQuestion, MatchQuestion, QuestionType
from app.services.llm_client import llm_client
from app.core.config import settings
import json

class AssessmentService:
    async def generate_assessment(self, request: AssessmentRequest) -> AssessmentResponse:
        prompt = self._build_prompt(request)
        raw_json = await llm_client.generate_json(prompt)
        
        questions = []
        for q_data in raw_json.get("questions", []):
            if self._validate_evidence(q_data, request.source_text):
                questions.append(q_data)
        
        return AssessmentResponse(
            questionType=", ".join([qt.value for qt in request.question_types]),
            questions=questions
        )

    def _build_prompt(self, request: AssessmentRequest) -> str:
        return f"""
        Generate an assessment based on the following text:
        ---
        {request.source_text}
        ---
        Requirements:
        - Title: {request.title}
        - Difficulty: {request.difficulty.value}
        - Question Types: {[qt.value for qt in request.question_types]}
        - Count: {request.question_count}
        
        For each question, you MUST include an 'evidence' field with a 'quote' (at least 15 characters) directly from the source text.
        Return ONLY a JSON object with a 'questions' array.
        """

    def _validate_evidence(self, question: dict, source_text: str) -> bool:
        if settings.mock_mode:
            return True
        evidence = question.get("evidence")
        if not evidence:
            return False
        quote = evidence.get("quote", "")
        if len(quote) < 15:
            return False
        return quote.lower() in source_text.lower()

assessment_service = AssessmentService()
