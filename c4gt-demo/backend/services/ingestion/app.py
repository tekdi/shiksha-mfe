from fastapi import FastAPI, File, Form, UploadFile

from common.llm import ask_ollama_json
from common.models import IngestionResponse, Section
from common.text_processing import (
    build_sections,
    extract_text_from_upload,
    filename_title,
    glossary_from_text,
    key_takeaways_from_text,
    narration_script_from_sections,
)

app = FastAPI(title="Ingestion Service", version="1.0.0")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "ingestion"}


@app.post("/ingest", response_model=IngestionResponse)
async def ingest_asset(
    file: UploadFile | None = File(default=None),
    source_text: str = Form(default=""),
    title: str = Form(default=""),
) -> IngestionResponse:
    upload_bytes = await file.read() if file else b""
    derived_title = title or filename_title(file.filename if file else None)
    raw_text, source_type = extract_text_from_upload(file.filename if file else None, upload_bytes, source_text)
    structured_sections = build_sections(derived_title, raw_text)
    key_takeaways = key_takeaways_from_text(raw_text)
    glossary = glossary_from_text(raw_text)
    narration_script = narration_script_from_sections(structured_sections)
    llm_mode = "heuristic"

    prompt = f"""
    Convert this educational content into JSON with keys key_takeaways, glossary, narration_script.
    Keep the response factual and derived from the input only.
    Text:
    {raw_text[:4000]}
    """
    llm_payload = await ask_ollama_json(prompt)
    if llm_payload:
        key_takeaways = llm_payload.get("key_takeaways", key_takeaways)[:5]
        glossary_payload = llm_payload.get("glossary", [])
        if glossary_payload:
            glossary = glossary[:0] + [
                {"term": item.get("term", ""), "definition": item.get("definition", "")}
                for item in glossary_payload[:6]
                if item.get("term")
            ]
        narration_script = llm_payload.get("narration_script", narration_script)[: len(structured_sections) or 6]
        llm_mode = "ollama"

    normalized_sections = [
        Section(heading=section.heading, body=section.body[:1800]) for section in structured_sections
    ]
    return IngestionResponse(
        title=derived_title,
        source_type=source_type,
        raw_text=raw_text[:8000],
        structured_sections=normalized_sections,
        key_takeaways=key_takeaways,
        glossary=glossary,
        narration_script=narration_script,
        llm_mode=llm_mode,
    )
