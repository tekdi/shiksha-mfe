from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.assessment_generator import generate_mcqs

router = APIRouter()

class AssessmentRequest(BaseModel):
    source_text: str
    question_count: int = 5
    question_type: str = "MCQ"

class AssessmentResponse(BaseModel):
    questions: List[Dict[str, Any]]
    status: str

@router.post("/generate", response_model=AssessmentResponse)
async def generate_assessment(request: AssessmentRequest):
    """
    Generates assessments (e.g. MCQs) based on the provided source text.
    Ensures zero-hallucination by leveraging strict LLM prompts.
    """
    if not request.source_text.strip():
        raise HTTPException(status_code=400, detail="Source text cannot be empty.")
        
    if request.question_type.upper() == "MCQ":
        questions = await generate_mcqs(request.source_text, request.question_count)
        return AssessmentResponse(questions=questions, status="success")
    else:
        raise HTTPException(status_code=400, detail=f"Question type '{request.question_type}' is currently unsupported.")
