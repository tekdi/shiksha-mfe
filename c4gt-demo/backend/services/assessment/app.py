from fastapi import FastAPI

from common.llm import ask_ollama_json
from common.models import AssessmentResponse, MCQQuestion, QuestionOption, FillBlankQuestion, MatchPairQuestion
from common.packages import build_assessment_packages
from common.text_processing import generate_fill_blanks, generate_match_pairs, generate_mcqs, glossary_from_text

app = FastAPI(title="Assessment Service", version="1.0.0")


async def generate_ai_assessment(text: str) -> dict:
    prompt = f"""
    Analyze the following educational text and generate a comprehensive assessment suite.
    Return ONLY a JSON object with the following structure:
    {{
        "mcqs": [
            {{
                "prompt": "Clear and challenging question?",
                "options": [
                    {{"option": "Correct Answer", "correct": true}},
                    {{"option": "Distractor 1", "correct": false}},
                    {{"option": "Distractor 2", "correct": false}},
                    {{"option": "Distractor 3", "correct": false}}
                ],
                "answer": "Correct Answer",
                "explanation": "Why this is correct."
            }}
        ],
        "fill_in_the_blanks": [
            {{
                "prompt": "A sentence with a _____ blank.",
                "answer": "word",
                "hint": "clue"
            }}
        ],
        "match_pairs": [
            {{
                "left": "Term",
                "right": "Definition"
            }}
        ]
    }}
    
    Generate 5 high-quality MCQs, 5 Fill-in-the-blanks, and 5 Match-the-pair items.
    
    TEXT:
    {text[:4000]}
    """
    return await ask_ollama_json(prompt)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "assessment"}


async def generate_assessment(payload: dict) -> AssessmentResponse:
    title = payload.get("title") or "Assessment Demo"
    text = payload.get("raw_text") or payload.get("source_text") or ""
    
    # Try AI Generation first
    ai_data = await generate_ai_assessment(text)
    
    if ai_data:
        try:
            mcqs = [MCQQuestion(**q) for q in ai_data.get("mcqs", [])]
            fibs = [FillBlankQuestion(**q) for q in ai_data.get("fill_in_the_blanks", [])]
            match_pairs = [MatchPairQuestion(**q) for q in ai_data.get("match_pairs", [])]
            
            if mcqs:
                response = AssessmentResponse(
                    title=title,
                    mcqs=mcqs,
                    fill_in_the_blanks=fibs,
                    match_pairs=match_pairs,
                    artifacts=[],
                )
                response.artifacts = build_assessment_packages(title, response)
                return response
        except Exception as e:
            print(f"Failed to parse AI assessment: {e}")

    # Fallback to heuristics with improved limits
    glossary = glossary_from_text(text, limit=8)
    response = AssessmentResponse(
        title=title,
        mcqs=generate_mcqs(text, limit=8),
        fill_in_the_blanks=generate_fill_blanks(text, limit=8),
        match_pairs=generate_match_pairs(glossary, limit=6),
        artifacts=[],
    )
    response.artifacts = build_assessment_packages(title, response)
    return response
