from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field

class GlossaryTerm(BaseModel):
    term: str
    definition: str

class LlmAnalysis(BaseModel):
    takeaways: list[str] = Field(default_factory=list)
    glossary: list[GlossaryTerm] = Field(default_factory=list)
    narration_script: str | None = None

class ImageAsset(BaseModel):
    page_number: int
    index: int
    width: int | None = None
    height: int | None = None
    extension: str | None = None

class DocumentBlock(BaseModel):
    kind: Literal['heading', 'paragraph']
    text: str

class ParsedPage(BaseModel):
    page_number: int
    blocks: list[DocumentBlock]
    images: list[ImageAsset] = Field(default_factory=list)

class ParsedSlide(BaseModel):
    slide_number: int
    title: str | None = None
    body: list[str] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    speaker_notes: str = ''

class IngestionResponse(BaseModel):
    file_id: str
    filename: str
    content_type: str | None = None
    document_type: Literal['pdf', 'pptx']
    metadata: dict
    pages: list[ParsedPage] = Field(default_factory=list)
    slides: list[ParsedSlide] = Field(default_factory=list)
    llm_analysis: LlmAnalysis
    processing_ms: int

class QuestionType(str, Enum):
    mcq = 'mcq'
    fill_blank = 'fill_blank'
    match_pair = 'match_pair'

class SourceEvidence(BaseModel):
    quote: str

class Question(BaseModel):
    type: QuestionType
    prompt: str
    options: list[str] = Field(default_factory=list)
    answer: str | list[str]
    pairs: list[tuple[str, str]] = Field(default_factory=list)
    explanation: str
    evidence: SourceEvidence

class AssessmentRequest(BaseModel):
    source_text: str
    question_types: list[QuestionType] = Field(default_factory=lambda: [QuestionType.mcq])
    question_count: int = Field(default=5, ge=1, le=20)
    title: str = 'Generated Assessment'

class AssessmentResponse(BaseModel):
    questions: list[Question]
    h5p_package_path: str | None = None
    scorm_package_path: str | None = None

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    speaker: str = 'SPEAKER_00'

class Chapter(BaseModel):
    title: str
    start: float

class MultimediaResponse(BaseModel):
    file_id: str
    filename: str
    transcript_path: str
    vtt_path: str
    transcript: str
    segments: list[TranscriptSegment]
    chapters: list[Chapter]
    h5p_package_path: str | None = None

class Branding(BaseModel):
    logo_url: str = ''
    primary_color: str = '#123B5D'
    secondary_color: str = '#F5A623'
    font_family: str = 'Inter, Arial, sans-serif'

class LessonSourceType(str, Enum):
    text = 'text'
    transcript = 'transcript'
    document = 'document'

class LessonStatus(str, Enum):
    draft = 'draft'
    approved = 'approved'
    published = 'published'

class MicroLessonRequest(BaseModel):
    title: str
    source_text: str
    source_type: LessonSourceType = LessonSourceType.text
    branding: Branding = Field(default_factory=Branding)

class MicroLessonResponse(BaseModel):
    lesson_id: str
    title: str
    status: LessonStatus
    html_path: str
    h5p_package_path: str
    scorm_package_path: str
    xapi_events: list[dict]
    generation_ms: int
