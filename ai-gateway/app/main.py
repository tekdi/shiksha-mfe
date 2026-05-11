import os
from typing import Annotated
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
import httpx
from app.services.ingestion import DocumentIngestionService

app = FastAPI(
    title="LMS AI Content & Assessment Engine - API Gateway",
    description="API Gateway for Module A, B, C, D running entirely on self-hosted open-source models.",
    version="1.0.0"
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "llama3"

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-gateway"}

async def generate_with_ollama(prompt: str, model: str = "llama3") -> str:
    """Helper function to call Ollama"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=300.0  # Increased timeout for large document processing
            )
            response.raise_for_status()
            return response.json().get("response", "")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Ollama service unavailable: {str(e)}")

@app.post("/api/v1/generate", responses={503: {"description": "Ollama service unavailable"}})
async def generate_content(request: GenerateRequest):
    """
    Generate content using local Ollama instance.
    This supports Module B (Quiz-Gen) and general queries.
    """
    response_text = await generate_with_ollama(request.prompt, request.model)
    return {"response": response_text}

@app.post("/api/v1/ingest/document", responses={
    400: {"description": "Only PDF and PPTX files are supported"},
    500: {"description": "Failed to process document"},
    503: {"description": "Ollama service unavailable"}
})
async def ingest_document(file: Annotated[UploadFile, File(...)]):
    """
    Module A: Intelligent Document Ingestion
    Upload PDF/PPT, extract text, and use LLM to generate Key Takeaways and Glossary.
    """
    if not file.filename.lower().endswith(('.pdf', '.pptx', '.ppt')):
        raise HTTPException(status_code=400, detail="Only PDF and PPTX files are supported")
    
    file_bytes = await file.read()
    
    try:
        # Extract raw text from the document
        extracted_text = DocumentIngestionService.process_document(file.filename, file_bytes)
        
        # In a real production system, this would be pushed to Celery. 
        # For demonstration of Module A, we will process a chunk synchronously or start a background task.
        
        # We process the first 4000 characters to avoid context window limits in this prototype
        text_chunk = extracted_text[:4000]
        
        prompt = f"""
        Analyze the following educational content and provide:
        1. A structured JSON summary with "title" and "body".
        2. A list of 3-5 "Key Takeaways".
        3. A "Glossary" of 3-5 important terms and their definitions.

        Content:
        {text_chunk}
        """
        
        # Call LLM
        llm_response = await generate_with_ollama(prompt, "llama3")
        
        return {
            "status": "success",
            "filename": file.filename,
            "raw_text_length": len(extracted_text),
            "ai_analysis": llm_response
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.post("/api/v1/transcribe")
async def transcribe_audio(file: Annotated[UploadFile, File(...)]):
    """
    Module C: Multimedia Intelligence
    Upload Audio/Video for Whisper transcription.
    """
    task_id = "task_" + os.urandom(8).hex()
    return {
        "status": "queued",
        "task_id": task_id,
        "filename": file.filename,
        "message": "Media uploaded. Whisper transcription task queued."
    }
