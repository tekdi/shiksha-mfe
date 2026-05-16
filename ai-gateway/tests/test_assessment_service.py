import pytest
from app.services.assessment_service import assessment_service

def test_evidence_validation_rejects_short_quotes():
    question = {"evidence": {"quote": "Short"}}
    source_text = "This is a very long source text about photosynthesis."
    assert assessment_service._validate_evidence(question, source_text) is False

def test_evidence_validation_accepts_verbatim_quotes():
    quote = "photosynthesis is a process used by plants"
    question = {"evidence": {"quote": quote}}
    source_text = f"We know that {quote} to convert light."
    assert assessment_service._validate_evidence(question, source_text) is True

def test_evidence_validation_rejects_hallucinations():
    question = {"evidence": {"quote": "this quote does not exist in the source text at all"}}
    source_text = "This is a very long source text about photosynthesis."
    assert assessment_service._validate_evidence(question, source_text) is False
