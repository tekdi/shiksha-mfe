# DMP 2026 AI Platform Setup

## Start the local AI stack
```bash
docker compose up --build -d
```
This starts Redis, Ollama, an Ollama init job that pulls `llama3` and `mistral`, a Celery worker, and the FastAPI gateway on port `8000`.

## Health check
```bash
curl http://localhost:8000/health
```

## Smoke-test the API
```bash
python ai-gateway/scripts/smoke_api.py
```

## Frontend
```bash
npm install --legacy-peer-deps
npx nx dev learner-web-app --port=3003
```

## Python note
The AI service is tested for Python 3.11 in containers. Local Python 3.13 may fail when building the pinned PyMuPDF wheel; use Docker or Python 3.11 for parity with production.
