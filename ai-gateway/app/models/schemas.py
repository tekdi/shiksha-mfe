from enum import Enum
from typing import Literal, Any
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

# --- Module A: Ingestion ---
class GlossaryTerm(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    term: str
    definition: str
    context: str = ''
    relatedTerms: list[str] = Field(default_factory=list)  # camelCase to match TS
    latex: str | None = None

class KeyTakeaway(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    summary: str
    pageRef: str = 'N/A'
    confidence: float = 1.0

class LlmAnalysis(BaseModel):
    takeaways: list[KeyTakeaway] = Field(default_factory=list)
    glossary: list[GlossaryTerm] = Field(default_factory=list)
    narration_script: str | None = None

class DocumentBlock(BaseModel):
    kind: Literal['heading', 'paragraph']
    text: str

class ImageAsset(BaseModel):
    page_number: int
    index: int
    width: int | None = None
    height: int | None = None
    extension: str | None = None

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

# --- Module B: Assessment ---
class QuestionType(str, Enum):
    mcq = 'mcq'
    fill_blank = 'fill_in_the_blanks'
    match_pair = 'match_the_pair'

class Difficulty(str, Enum):
    easy = 'easy'
    medium = 'medium'
    hard = 'hard'

class BloomsLevel(str, Enum):
    remember = 'remember'
    understand = 'understand'
    apply = 'apply'
    analyze = 'analyze'

class SourceEvidence(BaseModel):
    quote: str
    pageRef: str = ''

class MCQAnswer(BaseModel):
    text: str
    correct: bool
    feedback: str

class MCQQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    latex: str | None = None
    answers: list[MCQAnswer]
    explanation: str
    difficulty: Difficulty
    bloomsLevel: BloomsLevel
    evidence: SourceEvidence | None = None

class FITBBlank(BaseModel):
    answer: str
    alternatives: list[str] = Field(default_factory=list)
    tip: str = ''

class FITBQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sentence: str
    blanks: list[FITBBlank]
    latex: str | None = None
    difficulty: Difficulty
    bloomsLevel: BloomsLevel
    evidence: SourceEvidence | None = None

class MatchPair(BaseModel):
    left: str
    right: str

class MatchQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    instruction: str
    pairs: list[MatchPair]
    distractors: list[str] = Field(default_factory=list)
    latex: str | None = None
    difficulty: Difficulty
    bloomsLevel: BloomsLevel
    evidence: SourceEvidence | None = None

class AssessmentRequest(BaseModel):
    source_text: str
    question_types: list[QuestionType] = Field(default_factory=lambda: [QuestionType.mcq])
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: Difficulty = Difficulty.medium
    title: str = 'Generated Assessment'

class AssessmentResponse(BaseModel):
    type: Literal['quiz'] = 'quiz'
    questionType: str
    sourceFile: str = ''
    generatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    questions: list[Any]  # Union of MCQ/FITB/Match serialized

# --- Module D: Lessons ---
class Branding(BaseModel):
    logo_url: str = ''
    primary_color: str = '#123B5D'
    secondary_color: str = '#F5A623'
    font_family: str = 'Inter, Arial, sans-serif'

class LessonStatus(str, Enum):
    draft = 'draft'
    approved = 'approved'
    published = 'published'

class MicroLessonRequest(BaseModel):
    title: str
    source_text: str
    branding: Branding

class MicroLessonResponse(BaseModel):
    lesson_id: str
    title: str
    status: LessonStatus
    slides: list[dict] = Field(default_factory=list)
    html_content: str = ""
    file_paths: dict[str, str] = Field(default_factory=dict)
    xapi_events: list[dict] = Field(default_factory=list)
    generation_ms: int


# --- Module E: Multimedia ---
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
    transcript: str
    transcript_path: str
    vtt_path: str
    segments: list[TranscriptSegment]
    chapters: list[Chapter]
