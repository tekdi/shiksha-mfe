import json
import httpx
from app.core.config import settings

class LlmClient:
    async def generate_json(self, prompt: str):
        errors = []
        for model in [settings.llm_model_default, settings.llm_model_fallback]:
            try:
                async with httpx.AsyncClient(timeout=120) as client:
                    response = await client.post(
                        f'{settings.ollama_api_url}/api/generate',
                        json={'model': model, 'prompt': prompt, 'format': 'json', 'stream': False},
                    )
                    response.raise_for_status()
                    return json.loads(response.json()['response'])
            except Exception as exc:
                errors.append(f'{model}: {exc}')
        raise RuntimeError('All LLM models failed: ' + '; '.join(errors))

llm_client = LlmClient()
