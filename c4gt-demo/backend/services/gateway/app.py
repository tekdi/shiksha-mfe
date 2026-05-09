import os
from typing import Any, Dict

import httpx
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from common.models import JobState, LessonBuildRequest
from common.storage import EXPORT_DIR, asset_url, create_job, get_job, read_tenants, update_job

SERVICE_URLS = {
    "ingestion": os.getenv("INGESTION_SERVICE_URL", "http://localhost:8001"),
    "assessment": os.getenv("ASSESSMENT_SERVICE_URL", "http://localhost:8002"),
    "multimedia": os.getenv("MULTIMEDIA_SERVICE_URL", "http://localhost:8003"),
    "lesson_builder": os.getenv("LESSON_BUILDER_SERVICE_URL", "http://localhost:8004"),
}

app = FastAPI(title="Shiksha AI Demo Gateway", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def service_post(service_name: str, path: str, **kwargs: Any) -> Dict[str, Any]:
    base_url = SERVICE_URLS[service_name]
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{base_url}{path}", **kwargs)
    response.raise_for_status()
    return response.json()


async def build_document_workflow(
    job_id: str,
    title: str,
    tenant_id: str,
    source_text: str,
    review_notes: str,
    approved: bool,
    file_name: str | None,
    file_bytes: bytes,
) -> None:
    job = get_job(job_id)
    if not job:
        return
    try:
        job.status = "running"
        job.message = "Running Module A ingestion"
        update_job(job)

        files = {"file": (file_name or "document.txt", file_bytes)} if file_bytes else None
        data = {"source_text": source_text, "title": title}
        ingestion = await service_post("ingestion", "/ingest", files=files, data=data)

        job.message = "Running Module B assessment packaging"
        update_job(job)
        assessment = await service_post("assessment", "/generate", json=ingestion)

        tenants = read_tenants()
        branding = next((tenant for tenant in tenants if tenant["tenant_id"] == tenant_id), tenants[0] if tenants else None)
        if not branding:
            raise HTTPException(status_code=500, detail="No tenant configuration available")

        lesson_request = LessonBuildRequest(
            title=title or ingestion["title"],
            branding=branding,
            structured_sections=ingestion["structured_sections"],
            key_takeaways=ingestion["key_takeaways"],
            glossary=ingestion["glossary"],
            narration_script=ingestion["narration_script"],
            assessment=assessment,
            review_notes=review_notes,
            approved=approved,
        )

        job.message = "Running Module D lesson builder"
        update_job(job)
        lesson = await service_post("lesson_builder", "/build", json=lesson_request.model_dump())

        job.status = "completed"
        job.message = "Document workflow completed"
        job.result = {
            "module_a": ingestion,
            "module_b": assessment,
            "module_d": lesson,
        }
        update_job(job)
    except Exception as exc:  # pragma: no cover
        job.status = "failed"
        job.message = f"Document workflow failed: {exc}"
        update_job(job)


async def build_multimedia_workflow(
    job_id: str,
    title: str,
    tenant_id: str,
    transcript_text: str,
    review_notes: str,
    approved: bool,
    file_name: str | None,
    file_bytes: bytes,
) -> None:
    job = get_job(job_id)
    if not job:
        return
    try:
        job.status = "running"
        job.message = "Running Module C multimedia pipeline"
        update_job(job)

        files = {"file": (file_name or "transcript.txt", file_bytes)} if file_bytes else None
        data = {"transcript_text": transcript_text, "title": title}
        multimedia = await service_post("multimedia", "/analyze", files=files, data=data)

        tenants = read_tenants()
        branding = next((tenant for tenant in tenants if tenant["tenant_id"] == tenant_id), tenants[0] if tenants else None)
        lesson_request = LessonBuildRequest(
            title=title or multimedia["title"],
            branding=branding,
            transcript_text=multimedia["transcript_text"],
            chapters=multimedia["chapters"],
            key_takeaways=[chapter["summary"] for chapter in multimedia["chapters"]],
            glossary=[],
            narration_script=[],
            approved=approved,
            review_notes=review_notes,
        )

        job.message = "Running Module D lesson builder"
        update_job(job)
        lesson = await service_post("lesson_builder", "/build", json=lesson_request.model_dump())
        job.status = "completed"
        job.message = "Multimedia workflow completed"
        job.result = {
            "module_c": multimedia,
            "module_d": lesson,
        }
        update_job(job)
    except Exception as exc:  # pragma: no cover
        job.status = "failed"
        job.message = f"Multimedia workflow failed: {exc}"
        update_job(job)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "gateway", "services": SERVICE_URLS}


@app.get("/tenants")
async def tenants() -> list[dict]:
    return read_tenants()


@app.post("/workflows/document")
async def start_document_workflow(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    source_text: str = Form(default=""),
    title: str = Form(default="Issue 7 Demo Lesson"),
    tenant_id: str = Form(default="tekdi"),
    review_notes: str = Form(default="Creator reviewed the generated lesson."),
    approved: bool = Form(default=True),
) -> JobState:
    file_bytes = await file.read() if file else b""
    job = create_job("document", "Document workflow queued")
    background_tasks.add_task(
        build_document_workflow,
        job.job_id,
        title,
        tenant_id,
        source_text,
        review_notes,
        approved,
        file.filename if file else None,
        file_bytes,
    )
    return job


@app.post("/workflows/multimedia")
async def start_multimedia_workflow(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    transcript_text: str = Form(default=""),
    title: str = Form(default="Interactive Video Demo"),
    tenant_id: str = Form(default="tekdi"),
    review_notes: str = Form(default="Creator approved the multimedia lesson."),
    approved: bool = Form(default=True),
) -> JobState:
    file_bytes = await file.read() if file else b""
    job = create_job("multimedia", "Multimedia workflow queued")
    background_tasks.add_task(
        build_multimedia_workflow,
        job.job_id,
        title,
        tenant_id,
        transcript_text,
        review_notes,
        approved,
        file.filename if file else None,
        file_bytes,
    )
    return job


@app.get("/jobs/{job_id}", response_model=JobState)
async def job_status(job_id: str) -> JobState:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/assets/{filename:path}")
async def get_asset(filename: str) -> FileResponse:
    path = EXPORT_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(path)
