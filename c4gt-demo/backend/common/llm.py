from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

import httpx


def llm_config() -> Dict[str, str]:
    enabled_env = os.getenv("OLLAMA_ENABLED", "true").lower()
    return {
        "url": os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate"),
        "model": os.getenv("OLLAMA_MODEL", "llama3:latest"),
        "enabled": enabled_env,
    }


async def ask_ollama_json(prompt: str) -> Optional[Dict[str, Any]]:
    config = llm_config()
    if config["enabled"] not in {"1", "true", "yes", "on"}:
        return None
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    config["url"],
                    json={
                        "model": config["model"],
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                    },
                )
            response.raise_for_status()
            raw_response = response.json().get("response", "{}")
            break
        except httpx.ReadTimeout:
            print(f"LLM ReadTimeout on attempt {attempt + 1}/{max_retries}")
            if attempt == max_retries - 1:
                return None
        except Exception as e:
            print(f"LLM Error: {e}")
            return None
        
        # Clean up common LLM markdown noise if present
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        # Extract first valid JSON object
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(cleaned[start:end])
        return json.loads(cleaned)
