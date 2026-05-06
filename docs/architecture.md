# Architecture: AI Engine Integration

## Overview

The `ai-engine` is a Python/FastAPI microservice responsible for processing educational content (PDFs) and extracting structured data for the Shiksha MFE platform. It is fully containerised and can be deployed standalone or alongside the other MFE services.

---

## Service Design

```
┌─────────────────────────┐        POST /ingest         ┌──────────────────────────┐
│       Content MFE       │ ───────────────────────────► │  ai-engine  (FastAPI)    │
│  (upload UI / teacher)  │ ◄───────────────────────────  │  port 8000               │
└─────────────────────────┘     structured JSON          └──────────────────────────┘
                                                                     │
                                                                     │  PyMuPDF
                                                                     ▼
                                                           ┌─────────────────────┐
                                                           │   PDF Document       │
                                                           │  ─ text per page     │
                                                           │  ─ headings          │
                                                           │  ─ metadata          │
                                                           │  ─ embedded images   │
                                                           └─────────────────────┘
```

---

## Endpoints

### `GET /health`
Liveness probe. Returns `{"status": "healthy"}` with HTTP 200.

### `POST /ingest`
Accepts a `multipart/form-data` PDF upload (≤ 10 MB).

**Successful response shape (HTTP 200):**
```jsonc
{
  "page_count": 3,
  "metadata": {
    "title": "Sample Document",
    "author": "Jane Doe",
    "creationDate": "D:20240101000000"
  },
  "pages": [
    {
      "page_num": 1,
      "text": "Full text of page 1...",
      "headings": ["Introduction"],
      "images": [
        {
          "page": 1,
          "index": 0,
          "ext": "png",
          "data": "<base64-encoded bytes>"
        }
      ]
    }
    // … one entry per page
  ],
  "body_text": "Full concatenated plain text across all pages…",
  "headers": ["Introduction", "Chapter 1", "Summary"],  // deduplicated
  "images": [ /* flat list of all images from all pages */ ],
  "key_takeaways": [],          // placeholder — future AI enrichment
  "glossary": {},               // placeholder — future AI enrichment
  "narration_script": ""        // placeholder — future AI enrichment
}
```

**Error responses:**

| HTTP Status | Condition |
|-------------|-----------|
| 400 | Non-PDF content-type |
| 400 | Empty file (0 bytes) |
| 400 | PDF has zero pages |
| 400 | Corrupted / unreadable PDF |
| 413 | File exceeds 10 MB |

---

## Integration Points

### Content MFE
When a user uploads a PDF via the Content MFE, it sends a `POST /ingest` request. The structured JSON response is displayed for review and editing before being persisted to the main application database.

### Teacher App
The Teacher App consumes the structured content:
- **Narration Script** — for lesson planning (populated by future AI enrichment)
- **Key Takeaways** — quick lesson summaries
- **Glossary** — domain-specific terminology

---

## Deployment

The `ai-engine` is containerised and runs on port **8000** by default.

```bash
# Run with Docker Compose
docker compose -f docker-compose.ai.yml up --build

# Or run locally (Python 3.11+)
cd services/ai-engine
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Sample `curl` Commands

### 1 — Health check
```bash
curl -s http://localhost:8000/health
# → {"status":"healthy"}
```

### 2 — Ingest a PDF file
```bash
curl -X POST "http://localhost:8000/ingest" \
     -H "Accept: application/json" \
     -F "file=@/path/to/your/document.pdf"
```

### 3 — Ingest and pretty-print the response
```bash
curl -s -X POST "http://localhost:8000/ingest" \
     -F "file=@sample.pdf" | python -m json.tool
```

### 4 — Extract only the headings from the response
```bash
curl -s -X POST "http://localhost:8000/ingest" \
     -F "file=@sample.pdf" | python -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(d['headers']))"
```

### 5 — Extract only page 1 text
```bash
curl -s -X POST "http://localhost:8000/ingest" \
     -F "file=@sample.pdf" | python -c "import sys,json; d=json.load(sys.stdin); print(d['pages'][0]['text'])"
```

### 6 — Save all base64 images from the response
```bash
curl -s -X POST "http://localhost:8000/ingest" \
     -F "file=@sample.pdf" \
  | python -c "
import sys, json, base64, pathlib
data = json.load(sys.stdin)
for img in data['images']:
    out = pathlib.Path(f'page{img[\"page\"]}_img{img[\"index\"]}.{img[\"ext\"]}')
    out.write_bytes(base64.b64decode(img['data']))
    print('Saved', out)
"
```

### 7 — Test error handling (oversized file)
```bash
# Generate a 11 MB dummy file and confirm 413
dd if=/dev/urandom of=/tmp/big.pdf bs=1M count=11 2>/dev/null
curl -o /dev/null -w "%{http_code}" -X POST "http://localhost:8000/ingest" \
     -F "file=@/tmp/big.pdf"
# → 413
```

---

## Interactive API Docs

When the service is running, full interactive Swagger UI is available at:

```
http://localhost:8000/docs
```

ReDoc alternative:

```
http://localhost:8000/redoc
```
