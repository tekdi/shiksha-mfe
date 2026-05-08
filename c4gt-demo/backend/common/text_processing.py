from __future__ import annotations

import io
import re
from collections import Counter
from pathlib import Path
from typing import Iterable, List, Tuple

from .models import ChapterMarker, FillBlankQuestion, KeyValue, MatchPairQuestion, MCQQuestion, QuestionOption, Section, TranscriptSegment
from .stopwords import STOPWORDS

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover
    PdfReader = None

try:
    from pptx import Presentation
except Exception:  # pragma: no cover
    Presentation = None


def normalize_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def filename_title(filename: str | None, fallback: str = "Demo Lesson") -> str:
    if not filename:
        return fallback
    stem = Path(filename).stem.replace("_", " ").replace("-", " ").strip()
    return stem.title() or fallback


def extract_text_from_upload(filename: str | None, data: bytes, source_text: str | None = None) -> Tuple[str, str]:
    if source_text and source_text.strip():
        return normalize_text(source_text), "text"

    filename = filename or "upload.txt"
    suffix = Path(filename).suffix.lower()

    if suffix == ".pdf" and PdfReader is not None:
        reader = PdfReader(io.BytesIO(data))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return normalize_text(text), "pdf"

    if suffix in {".ppt", ".pptx"} and Presentation is not None:
        presentation = Presentation(io.BytesIO(data))
        chunks: List[str] = []
        for idx, slide in enumerate(presentation.slides, start=1):
            slide_parts: List[str] = [f"Slide {idx}"]
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text:
                    slide_parts.append(shape.text)
            chunks.append("\n".join(slide_parts))
        return normalize_text("\n\n".join(chunks)), "ppt"

    decoded = data.decode("utf-8", errors="ignore")
    if decoded.strip():
        return normalize_text(decoded), "text"

    fallback = (
        f"Uploaded asset {filename} could not be deeply parsed in this environment. "
        "This demo generated a synthetic transcript from the file metadata so the workflow remains runnable."
    )
    return fallback, suffix.lstrip(".") or "binary"


def split_sentences(text: str) -> List[str]:
    cleaned = normalize_text(text)
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    return [p.strip() for p in parts if p.strip()]


def build_sections(title: str, text: str, max_sections: int = 6) -> List[Section]:
    paragraphs = [p.strip() for p in normalize_text(text).split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = split_sentences(text)
    grouped: List[Section] = []
    chunk_size = max(1, len(paragraphs) // max_sections or 1)
    for idx in range(0, len(paragraphs), chunk_size):
        chunk = paragraphs[idx : idx + chunk_size]
        heading = title if idx == 0 else f"{title} - Part {len(grouped) + 1}"
        grouped.append(Section(heading=heading, body="\n\n".join(chunk)))
        if len(grouped) >= max_sections:
            break
    return grouped or [Section(heading=title, body=text)]


def top_keywords(text: str, limit: int = 8) -> List[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9\-]{4,}", text.lower())
    counts = Counter(word for word in words if word not in STOPWORDS)
    return [word.replace("-", " ").title() for word, _ in counts.most_common(limit)]


def glossary_from_text(text: str, limit: int = 6) -> List[KeyValue]:
    sentences = split_sentences(text)
    keywords = top_keywords(text, limit=limit)
    glossary: List[KeyValue] = []
    for term in keywords:
        term_lower = term.lower()
        definition = next((sentence for sentence in sentences if term_lower in sentence.lower()), "")
        if not definition:
            definition = f"{term} is a core concept highlighted in the uploaded learning material."
        glossary.append(KeyValue(term=term, definition=definition))
    return glossary


def key_takeaways_from_text(text: str, limit: int = 5) -> List[str]:
    sentences = split_sentences(text)
    ranked = sorted(sentences, key=lambda value: (-len(value.split()), value))
    return ranked[:limit] or ["The asset contains educational material ready for transformation into a micro-lesson."]


def narration_script_from_sections(sections: Iterable[Section]) -> List[str]:
    script: List[str] = []
    for idx, section in enumerate(sections, start=1):
        body = section.body.replace("\n", " ")
        script.append(f"Slide {idx}: {section.heading}. {body[:240]}")
    return script


def generate_mcqs(text: str, limit: int = 8) -> List[MCQQuestion]:
    takeaways = key_takeaways_from_text(text, limit=limit + 2)
    keywords = top_keywords(text, limit=limit * 5)
    questions: List[MCQQuestion] = []
    
    # Templates for better variety
    templates = [
        "Which of the following best describes {keyword}?",
        "What is the primary role of {keyword} in this context?",
        "According to the material, {keyword} is characterized by:",
        "Which statement accurately reflects the concept of {keyword}?",
        "How does {keyword} relate to the key concepts in this lesson?",
        "What is a defining feature of {keyword}?",
        "In the context of this material, {keyword} represents:",
        "Which of the following best exemplifies {keyword}?"
    ]
    
    for idx in range(min(limit, len(keywords))):
        answer = keywords[idx]
        
        # Get better distractors from other keywords
        distractors = []
        for candidate_idx, candidate in enumerate(keywords):
            if candidate != answer and candidate not in distractors:
                distractors.append(candidate)
            if len(distractors) == 3:
                break
        
        # Pad with plausible but incorrect alternatives if needed
        if len(distractors) < 3:
            common_terms = [
                "General Framework", "Standard Protocol", "Common Practice",
                "Industry Standard", "Established Method", "Traditional Approach",
                "Specialized Process", "Advanced Technique", "Alternative Strategy"
            ]
            for term in common_terms:
                if term not in distractors and len(distractors) < 3:
                    distractors.append(term)
        
        template = templates[idx % len(templates)]
        prompt = template.format(keyword=answer)
        
        # Find the first takeaway that mentions this keyword for better explanation
        explanation = f"{answer} is a key component discussed in the learning material."
        for takeaway in takeaways:
            if answer.lower() in takeaway.lower():
                explanation = f"As highlighted in the material: {takeaway[:150]}..."
                break
        
        questions.append(
            MCQQuestion(
                prompt=prompt,
                options=[QuestionOption(option=answer, correct=True)] + [QuestionOption(option=item) for item in distractors],
                answer=answer,
                explanation=explanation,
            )
        )
    return questions


def generate_fill_blanks(text: str, limit: int = 8) -> List[FillBlankQuestion]:
    sentences = key_takeaways_from_text(text, limit=limit + 10)
    keywords = top_keywords(text, limit=limit + 10)
    results: List[FillBlankQuestion] = []
    
    for idx in range(min(limit, len(keywords))):
        answer = keywords[idx]
        
        # Find a sentence naturally containing this keyword
        sentence = next(
            (item for item in sentences if answer.lower() in item.lower()),
            None
        )
        
        if sentence:
            prompt = re.sub(re.escape(answer), "_____", sentence, flags=re.IGNORECASE)
        else:
            # Create a contextual sentence if keyword not found naturally
            prompt = f"In this learning material, _____ is an important concept that contributes significantly to understanding the subject."
        
        # Better hints
        hint = f"Hint: {answer[:3]}... (relates to the core concepts)"
        
        results.append(FillBlankQuestion(prompt=prompt, answer=answer, hint=hint))
    
    return results


def generate_match_pairs(glossary: List[KeyValue], limit: int = 6) -> List[MatchPairQuestion]:
    pairs = glossary[:limit]
    
    if not pairs:
        pairs = [KeyValue(term="Lesson", definition="A structured learning unit.")]
    
    # Enhance definitions if they're too generic
    enhanced_pairs = []
    for item in pairs:
        definition = item.definition.strip()
        if not definition or len(definition) < 15:
            definition = f"{item.term} is a fundamental concept that plays a vital role in this educational context."
        elif definition.endswith("."):
            definition = definition
        else:
            definition = definition + "."
        
        enhanced_pairs.append(MatchPairQuestion(left=item.term, right=definition))
    
    return enhanced_pairs


def transcript_segments(text: str) -> List[TranscriptSegment]:
    sentences = split_sentences(text)
    if not sentences:
        sentences = ["This multimedia asset is ready for transcript-driven lesson generation."]
    segments: List[TranscriptSegment] = []
    cursor = 0
    for idx, sentence in enumerate(sentences, start=1):
        duration = max(4, min(12, len(sentence.split()) // 2 + 2))
        segments.append(
            TranscriptSegment(
                speaker=f"Speaker {1 if idx % 2 else 2}",
                start_seconds=cursor,
                end_seconds=cursor + duration,
                text=sentence,
            )
        )
        cursor += duration
    return segments


def transcript_to_vtt(segments: List[TranscriptSegment]) -> str:
    lines = ["WEBVTT", ""]
    for segment in segments:
        lines.append(f"{seconds_to_stamp(segment.start_seconds)} --> {seconds_to_stamp(segment.end_seconds)}")
        lines.append(f"{segment.speaker}: {segment.text}")
        lines.append("")
    return "\n".join(lines)


def chapter_markers(segments: List[TranscriptSegment], limit: int = 4) -> List[ChapterMarker]:
    if not segments:
        return []
    chunk = max(1, len(segments) // limit)
    chapters: List[ChapterMarker] = []
    for idx in range(0, len(segments), chunk):
        batch = segments[idx : idx + chunk]
        summary = " ".join(item.text for item in batch)[:180]
        chapters.append(
            ChapterMarker(
                title=f"Chapter {len(chapters) + 1}",
                start_seconds=batch[0].start_seconds,
                summary=summary,
            )
        )
        if len(chapters) >= limit:
            break
    return chapters


def seconds_to_stamp(total_seconds: int) -> str:
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02}:{minutes:02}:{seconds:02}.000"
