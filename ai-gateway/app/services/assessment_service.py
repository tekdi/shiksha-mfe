import re
from app.models.schemas import Question, QuestionType, SourceEvidence
from app.services.llm_client import llm_client

def _validate_evidence(question: dict, source_text: str):
    quote = question.get('evidence', {}).get('quote', '').strip()
    return bool(quote and quote.lower() in source_text.lower())

async def generate_questions(source_text: str, question_types: list[QuestionType], count: int):
    prompt = f'''Generate up to {count} questions from SOURCE only. Allowed types: {[t.value for t in question_types]}.
Return strict JSON list. Each item must contain type, prompt, options, answer, pairs, explanation, evidence:{{quote}}. Evidence quote must be copied verbatim from SOURCE. Preserve LaTeX.
SOURCE:\n{source_text[:7000]}'''
    raw = await llm_client.generate_json(prompt)
    if isinstance(raw, dict):
        raw = raw.get('questions', [])
    valid = []
    for item in raw:
        if _validate_evidence(item, source_text):
            try:
                valid.append(Question(**item))
            except Exception:
                continue
    return valid
