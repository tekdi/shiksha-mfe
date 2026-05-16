from fastapi import APIRouter, HTTPException
from app.models.schemas import AssessmentRequest, AssessmentResponse
from app.services.assessment_service import assessment_service

router = APIRouter()

@router.post("/generate", response_model=AssessmentResponse, responses={400: {"description": "Source text cannot be empty"}})
async def generate_assessment(request: AssessmentRequest):
    if not request.source_text.strip():
        raise HTTPException(status_code=400, detail="Source text cannot be empty")
    
    return await assessment_service.generate_assessment(request)
