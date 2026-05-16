# Module A Demo — Intelligent Document Ingestion

> **Code for GovTech 2026 · Project Proposal**  
> Pluggable AI Microservice Platform for Multi-Tenant SaaS LMS  

---

## Overview

Module A is the **Intelligent Document Ingestion** microservice. It accepts a PDF file via a multipart upload, extracts structured content using [PyMuPDF](https://pymupdf.readthedocs.io/), and returns a JSON payload containing:

| Field | Type | Description |
|-------|------|-------------|
| `headers` | `string[]` | Bold / large-font text spans detected as headings |
| `body_text` | `string` | All text spans joined in reading order |
| `images` | `object[]` | Base-64 encoded images with page & index metadata |
| `metadata` | `object` | PDF document metadata (title, author, creator, …) |
| `key_takeaways` | `string[]` | *(placeholder — AI generation not yet wired)* |
| `glossary` | `object` | *(placeholder — AI generation not yet wired)* |
| `narration_script` | `string` | *(placeholder — AI generation not yet wired)* |

---

## Architecture

```
Browser (teachers app @ :3001 dev)
  │
  ├── GET  /health   → FastAPI ai-engine @ :8000
  └── POST /ingest   → FastAPI ai-engine @ :8000
                           │
                      PyMuPDF (fitz)
                      Extracts headers, body text, images
                           │
                      Structured JSON response
```

**Key files:**

| Path | Purpose |
|------|---------|
| `services/ai-engine/main.py` | FastAPI backend — `/health` and `/ingest` endpoints |
| `services/ai-engine/requirements.txt` | Python dependencies (`fastapi`, `pymupdf`, `uvicorn`) |
| `apps/teachers/src/pages/ai-demo.tsx` | Next.js landing page route (`/ai-demo`) |
| `apps/teachers/src/pages/ai-demo.module.css` | Scoped CSS for landing page |
| `apps/teachers/src/components/ai-demo/IngestionDemo.tsx` | Upload widget + response display |
| `apps/teachers/src/components/ai-demo/IngestionDemo.module.css` | Scoped CSS for widget |
| `apps/teachers/src/utils/aiEngine.ts` | API helper — single source of truth for base URL |
| `apps/teachers/.env.local` | Local dev env vars (`NEXT_PUBLIC_AI_ENGINE_URL`) |

---

## Running Locally

### 1 — Start the AI Engine backend

```bash
# From repo root
cd services/ai-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Or with Docker:

```bash
docker compose -f docker-compose.ai.yml up --build
```

Verify:
```bash
curl http://localhost:8000/health
# → {"status":"healthy"}
```

### 2 — Start the Teachers frontend

```bash
# From repo root
npx nx serve teachers
# → http://localhost:3000  (or :3001 depending on nx config)
```

Then navigate to:
```
http://localhost:3000/ai-demo
```

> **Note:** The `.env.local` file in `apps/teachers/` sets `NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000`.  
> Override this value in your deployment environment — **never hardcode in component files**.

---

## API Reference

### `GET /health`

Returns backend liveness status.

```json
{ "status": "healthy" }
```

### `POST /ingest`

Upload a PDF via `multipart/form-data` with field name **`file`**.

```bash
curl -X POST http://localhost:8000/ingest \
  -H "accept: application/json" \
  -F "file=@sample.pdf"
```

**Constraints:**
- Content-Type must be `application/pdf`
- Maximum file size: **10 MB**
- File must not be encrypted or corrupted

**Example response:**
```json
{
  "headers": ["Introduction", "Chapter 1: Overview", "…"],
  "body_text": "Full extracted text content…",
  "images": [
    { "page": 1, "index": 0, "ext": "png", "data": "<base64>" }
  ],
  "metadata": {
    "title": "Sample Document",
    "author": "Jane Doe",
    "creator": "Microsoft Word"
  },
  "key_takeaways": [],
  "glossary": {},
  "narration_script": ""
}
```

---

## CORS Configuration

The backend (`services/ai-engine/main.py`) allows cross-origin requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://127.0.0.1:3000 / :3001 / :3002`

This covers all local Next.js development origins. **No wildcard origins are used.** Production deployments must update `_DEV_ORIGINS` or move to environment-variable-driven allow-list.

---

## What Is & Is Not Implemented

| Feature | Status |
|---------|--------|
| PDF upload (drag-and-drop + file picker) | ✅ Done |
| Backend health check badge | ✅ Done |
| Text / heading / image extraction | ✅ Done (PyMuPDF) |
| PDF metadata extraction | ✅ Done |
| Loading / success / error UI states | ✅ Done |
| PDF validation (type + size) | ✅ Done |
| Raw JSON viewer | ✅ Done |
| Key takeaways (AI) | ⏳ Placeholder |
| Glossary (AI) | ⏳ Placeholder |
| Narration script (AI) | ⏳ Placeholder |
| PPT / Video / Audio ingestion | 🔜 Module B/C |
| Quiz generation (H5P, SCORM) | 🔜 Module D |

---

## Related Modules (Planned)

- **Module B** — Assessment generation (MCQ, Match, Fill-in-the-blank)  
- **Module C** — Multimedia processing (Whisper transcription → VTT → H5P)  
- **Module D** — Micro-lesson packaging (SCORM 1.2, xAPI)
