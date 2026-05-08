from fastapi import FastAPI

from common.llm import ask_ollama_json
from common.models import AssessmentResponse, MCQQuestion, QuestionOption, FillBlankQuestion, MatchPairQuestion
from common.packages import build_assessment_packages
from common.text_processing import generate_fill_blanks, generate_match_pairs, generate_mcqs, glossary_from_text

app = FastAPI(title="Assessment Service", version="1.0.0")


async def generate_ai_assessment(text: str) -> dict:
    prompt = f"""
    Analyze the following educational text and generate a COMPREHENSIVE assessment suite.
    Return ONLY a JSON object with the following structure:
    {{
        "mcqs": [
            {{
                "prompt": "Clear, well-formulated question covering key concepts?",
                "options": [
                    {{"option": "Correct Answer - Primary concept", "correct": true}},
                    {{"option": "Plausible distractor - Related but incorrect", "correct": false}},
                    {{"option": "Plausible distractor - Common misconception", "correct": false}},
                    {{"option": "Plausible distractor - Related concept", "correct": false}}
                ],
                "answer": "Correct Answer - Primary concept",
                "explanation": "Detailed explanation of why this is correct based on the material."
            }}
        ],
        "fill_in_the_blanks": [
            {{
                "prompt": "A complete sentence from the material with ONE important word replaced by _____.",
                "answer": "the actual word that should fill the blank",
                "hint": "A meaningful clue that guides without giving away the answer"
            }}
        ],
        "match_pairs": [
            {{
                "left": "Important Term or Concept",
                "right": "Accurate, detailed definition or explanation from the material"
            }}
        ]
    }}
    
    REQUIREMENTS:
    - Generate AT LEAST 12-15 high-quality MCQs with varied question types (definition, role, characteristics, examples)
    - Each MCQ must have 4 distinct, plausible answer choices (1 correct, 3 distractors)
    - Distractors should be contextually relevant and plausible, NOT generic or obviously wrong
    - Generate AT LEAST 12-15 Fill-in-the-blanks questions from actual sentences in the material
    - Generate AT LEAST 10 Match-the-pair items with descriptive definitions
    - All questions must be based directly on the provided text
    - Avoid trivial or obvious questions
    - Include variety: definition questions, application questions, relationship questions, etc.
    
    TEXT:
    {text[:4000]}
    """
    return await ask_ollama_json(prompt)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "assessment"}


@app.post("/generate", response_model=AssessmentResponse)
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
            
            if mcqs and len(mcqs) > 0:
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

    # Fallback to heuristics with comprehensive question generation
    glossary = glossary_from_text(text, limit=12)
    response = AssessmentResponse(
        title=title,
        mcqs=generate_mcqs(text, limit=15),
        fill_in_the_blanks=generate_fill_blanks(text, limit=15),
        match_pairs=generate_match_pairs(glossary, limit=10),
        artifacts=[],
    )
    response.artifacts = build_assessment_packages(title, response)
    return response
