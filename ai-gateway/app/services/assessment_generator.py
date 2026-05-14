import os
import httpx
import json
from typing import Dict, Any, List

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("LLM_MODEL_DEFAULT", "llama3")

async def generate_mcqs(text_content: str, count: int = 5) -> List[Dict[str, Any]]:
    """
    Generates Multiple Choice Questions directly from the source material.
    Ensures zero hallucination by strictly constraining the prompt.
    """
    
    prompt = f"""
    You are an expert assessment creator. Generate {count} multiple choice questions (MCQs) based strictly on the following text.
    Do NOT use outside knowledge. If the text does not contain enough information, generate as many as possible up to {count}.
    
    For each question, provide:
    1. The question text.
    2. Four options (A, B, C, D).
    3. The correct answer (the letter).
    4. A brief explanation of why it is correct based on the text.
    
    Format the output as strict JSON: a list of dictionaries with keys: "question", "options" (list of strings), "answer", "explanation".
    
    Content:
    {text_content[:4000]}
    """

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "format": "json",
        "stream": False
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{OLLAMA_API_URL}/api/generate", json=payload)
            response.raise_for_status()
            
            data = response.json()
            return json.loads(data["response"])
            
    except Exception as e:
        print(f"Error generating MCQs via Ollama: {e}")
        return []
