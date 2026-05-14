from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingestion

app = FastAPI(
    title="Shiksha DMP 2026 AI Gateway",
    description="Microservice for Document Ingestion, LLM Orchestration, and Assessment Generation.",
    version="1.0.0"
)

# Allow MFE frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion.router, prefix="/api/v1/ingestion", tags=["Document Ingestion"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-gateway"}
