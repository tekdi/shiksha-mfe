# Shiksha AI Gateway

Local-first FastAPI service for DMP 2026 Modules A-D.

## Implemented API surface
- `POST /api/v1/ingestion/upload`
- `POST /api/v1/assessment/generate`
- `POST /api/v1/multimedia/transcribe`
- `GET /api/v1/multimedia/artifacts/{file_id}/{name}`
- `POST /api/v1/lessons/generate`
- `POST /api/v1/lessons/{lesson_id}/approve`
- `POST /api/v1/lessons/{lesson_id}/publish`

## Local verification
```bash
python -m pytest
```
Use Python 3.11 for runtime parity with the Docker image.
