from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class KeyValue(BaseModel):
    term: str
    definition: str


class Section(BaseModel):
    heading: str
    body: str


class IngestionResponse(BaseModel):
    title: str
    source_type: str
    raw_text: str
    structured_sections: List[Section]
    key_takeaways: List[str]
    glossary: List[KeyValue]
    narration_script: List[str]
    llm_mode: Literal["ollama", "heuristic"]


class QuestionOption(BaseModel):
    option: str
    correct: bool = False


class MCQQuestion(BaseModel):
    prompt: str
    options: List[QuestionOption]
    answer: str
    explanation: str


class FillBlankQuestion(BaseModel):
    prompt: str
    answer: str
    hint: str


class MatchPairQuestion(BaseModel):
    left: str
    right: str


class PackageArtifact(BaseModel):
    label: str
    kind: str
    filename: str
    download_url: str


class AssessmentResponse(BaseModel):
    title: str
    mcqs: List[MCQQuestion]
    fill_in_the_blanks: List[FillBlankQuestion]
    match_pairs: List[MatchPairQuestion]
    artifacts: List[PackageArtifact]


class TranscriptSegment(BaseModel):
    speaker: str
    start_seconds: int
    end_seconds: int
    text: str


class ChapterMarker(BaseModel):
    title: str
    start_seconds: int
    summary: str


class MultimediaResponse(BaseModel):
    title: str
    transcript_text: str
    vtt_text: str
    speakers: List[TranscriptSegment]
    chapters: List[ChapterMarker]
    knowledge_checks: List[MCQQuestion]
    artifacts: List[PackageArtifact]


class BrandingConfig(BaseModel):
    tenant_id: str
    name: str
    logo_text: str
    primary_color: str
    secondary_color: str
    font_family: str


class LessonBuildRequest(BaseModel):
    title: str
    branding: BrandingConfig
    structured_sections: List[Section] = Field(default_factory=list)
    key_takeaways: List[str] = Field(default_factory=list)
    glossary: List[KeyValue] = Field(default_factory=list)
    narration_script: List[str] = Field(default_factory=list)
    assessment: Optional[AssessmentResponse] = None
    transcript_text: str = ""
    chapters: List[ChapterMarker] = Field(default_factory=list)
    review_notes: str = ""
    approved: bool = True


class LessonBuildResponse(BaseModel):
    title: str
    status: Literal["approved", "pending_review"]
    preview_html: str
    xapi_events: List[Dict[str, Any]]
    artifacts: List[PackageArtifact]


class JobState(BaseModel):
    job_id: str
    status: Literal["queued", "running", "completed", "failed"]
    workflow: str
    message: str = ""
    result: Optional[Dict[str, Any]] = None

