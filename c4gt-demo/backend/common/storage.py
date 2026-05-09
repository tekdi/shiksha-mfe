from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict
from uuid import uuid4

from .models import JobState

BASE_DIR = Path(__file__).resolve().parents[2]
RUNTIME_DIR = Path(os.getenv("RUNTIME_DIR", str(BASE_DIR / "runtime")))
EXPORT_DIR = RUNTIME_DIR / "exports"
JOB_FILE = RUNTIME_DIR / "jobs.json"
TENANT_FILE = Path(os.getenv("TENANT_FILE", str(BASE_DIR / "config" / "tenants.json")))


def ensure_runtime() -> None:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    if not JOB_FILE.exists():
        JOB_FILE.write_text("{}", encoding="utf-8")


def save_text_file(filename: str, content: str) -> Path:
    ensure_runtime()
    path = EXPORT_DIR / filename
    path.write_text(content, encoding="utf-8")
    return path


def save_bytes_file(filename: str, content: bytes) -> Path:
    ensure_runtime()
    path = EXPORT_DIR / filename
    path.write_bytes(content)
    return path


def asset_url(filename: str) -> str:
    return f"/assets/{filename}"


def create_job(workflow: str, message: str = "Queued") -> JobState:
    ensure_runtime()
    job = JobState(job_id=str(uuid4()), status="queued", workflow=workflow, message=message)
    jobs = read_jobs()
    jobs[job.job_id] = job.model_dump()
    JOB_FILE.write_text(json.dumps(jobs, indent=2), encoding="utf-8")
    return job


def update_job(job: JobState) -> None:
    jobs = read_jobs()
    jobs[job.job_id] = job.model_dump()
    JOB_FILE.write_text(json.dumps(jobs, indent=2), encoding="utf-8")


def read_jobs() -> Dict[str, dict]:
    ensure_runtime()
    return json.loads(JOB_FILE.read_text(encoding="utf-8"))


def get_job(job_id: str) -> JobState | None:
    payload = read_jobs().get(job_id)
    return JobState(**payload) if payload else None


def read_tenants() -> list[dict]:
    if TENANT_FILE.exists():
        return json.loads(TENANT_FILE.read_text(encoding="utf-8"))
    return []
