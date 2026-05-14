import os
import httpx
from typing import Dict, Any, List

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("LLM_MODEL_DEFAULT", "llama3")

async def generate_summary_and_glossary(text_content: str) -> Dict[str, Any]:
    """
    Calls the local Ollama LLM to generate Key Takeaways and a Glossary from the ingested text.
    """
    
    prompt = f"""
    You are an expert instructional designer. Analyze the following educational content and generate:
    1. 3-5 Key Takeaways (bullet points).
    2. A Glossary of 3-5 key terms and their definitions.
    
    Format the output as strict JSON with keys: "takeaways" (list of strings) and "glossary" (list of dicts with "term" and "definition").
    
    Content:
    {text_content[:4000]} # Limit to 4000 chars for context window
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
            # The LLM returns a JSON string in the 'response' field because we used format="json"
            import json
            return json.loads(data["response"])
            
    except Exception as e:
        print(f"Error communicating with Ollama: {e}")
        return {
            "takeaways": ["Error generating takeaways due to LLM failure."],
            "glossary": []
        }
