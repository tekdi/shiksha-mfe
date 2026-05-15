import uuid
from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.models.schemas import AssessmentRequest, AssessmentResponse
from app.services.assessment_service import generate_questions
from app.packaging.assessment_packages import build_h5p_question_set, build_scorm_assessment
router = APIRouter()

@router.post('/generate', response_model=AssessmentResponse)
async def generate_assessment(request: AssessmentRequest):
    if not request.source_text.strip():
        raise HTTPException(400, 'Source text cannot be empty.')
    questions = await generate_questions(request.source_text, request.question_types, request.question_count)
    package_id = str(uuid.uuid4())
    out = settings.artifact_root / 'assessments' / package_id
    h5p = build_h5p_question_set(request.title, questions, out / 'assessment.h5p')
    scorm = build_scorm_assessment(request.title, questions, out / 'assessment_scorm.zip')
    return AssessmentResponse(questions=questions, h5p_package_path=str(h5p), scorm_package_path=str(scorm))
