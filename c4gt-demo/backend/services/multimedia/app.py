from fastapi import FastAPI, File, Form, UploadFile

from common.llm import ask_ollama_json
from common.models import MultimediaResponse, MCQQuestion, ChapterMarker
from common.packages import build_multimedia_packages
from common.text_processing import (
    chapter_markers,
    extract_text_from_upload,
    filename_title,
    generate_mcqs,
    transcript_segments,
    transcript_to_vtt,
)

app = FastAPI(title="Multimedia Service", version="1.0.0")


async def generate_ai_multimedia_analysis(text: str) -> dict:
    prompt = f"""
    Analyze the following video transcript. 
    1. Create 5-8 timestamped logical chapters (provide labels and summaries).
    2. Create 5 high-quality MCQs based on the content.
    Return ONLY a JSON object with keys 'chapters' and 'mcqs'.
    
    TEXT:
    {text[:4000]}
    """
    return await ask_ollama_json(prompt)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "multimedia"}


@app.post("/analyze", response_model=MultimediaResponse)
async def analyze_media(
    file: UploadFile | None = File(default=None),
    transcript_text: str = Form(default=""),
    title: str = Form(default=""),
) -> MultimediaResponse:
    upload_bytes = await file.read() if file else b""
    derived_title = title or filename_title(file.filename if file else None, fallback="Interactive Video Demo")
    raw_text, _ = extract_text_from_upload(file.filename if file else None, upload_bytes, transcript_text)
    transcript_text = raw_text or "This demo transcript explains the learning content and inserts knowledge checks."
    
    speakers = transcript_segments(transcript_text)
    
    # Try AI Analysis
    ai_data = await generate_ai_multimedia_analysis(transcript_text)
    
    if ai_data:
        try:
            chapters = [ChapterMarker(title=c['label'], start_seconds=0, summary=c.get('summary', '')) for c in ai_data.get('chapters', [])]
            # Match timestamps if possible or just use indices
            for idx, marker in enumerate(chapters):
                marker.start_seconds = idx * 30 # Mock timestamps if LLM didn't provide
            
            mcqs = [MCQQuestion(**q) for q in ai_data.get("mcqs", [])]
            
            if mcqs or chapters:
                response = MultimediaResponse(
                    title=derived_title,
                    transcript_text=transcript_text,
                    vtt_text=transcript_to_vtt(speakers),
                    speakers=speakers,
                    chapters=chapters,
                    knowledge_checks=mcqs,
                    artifacts=[],
                )
                response.artifacts = build_multimedia_packages(derived_title, response)
                return response
        except Exception as e:
            print(f"Failed to parse AI multimedia analysis: {e}")

    # Fallback
    chapters = chapter_markers(speakers, limit=6)
    knowledge_checks = generate_mcqs(transcript_text, limit=5)
    response = MultimediaResponse(
        title=derived_title,
        transcript_text=transcript_text,
        vtt_text=transcript_to_vtt(speakers),
        speakers=speakers,
        chapters=chapters,
        knowledge_checks=knowledge_checks,
        artifacts=[],
    )
    response.artifacts = build_multimedia_packages(derived_title, response)
    return response
