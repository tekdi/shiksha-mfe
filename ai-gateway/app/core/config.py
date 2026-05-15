from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    app_name: str = 'Shiksha AI Gateway'
    ollama_api_url: str = 'http://ollama:11434'
    llm_model_default: str = 'llama3'
    llm_model_fallback: str = 'mistral'
    redis_url: str = 'redis://redis:6379/0'
    artifact_root: Path = Path('/tmp/shiksha-ai-artifacts')
    temp_root: Path = Path('/tmp/shiksha-ai')
    whisper_model: str = 'large-v3'
    tenant_logo_url: str = ''
    tenant_primary_color: str = '#123B5D'
    tenant_secondary_color: str = '#F5A623'
    tenant_font_family: str = 'Inter, Arial, sans-serif'

settings = Settings()
settings.artifact_root.mkdir(parents=True, exist_ok=True)
settings.temp_root.mkdir(parents=True, exist_ok=True)
