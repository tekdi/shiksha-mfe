from pathlib import Path
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_ROOT = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    app_name: str = 'Shiksha AI Gateway'
    ollama_api_url: str = 'https://ollama:11434'
    llm_model: str = 'mistral'          # Mistral only, no fallback
    redis_url: str = 'rediss://redis:6379/0'
    artifact_root: Path = APP_ROOT / 'storage' / 'artifacts'
    temp_root: Path = APP_ROOT / 'storage' / 'temp'
    whisper_model: str = 'large-v3'
    hindi_model: str = 'Oriserve/Whisper-Hindi2Hinglish-Swift'
    default_language: str = 'auto'
    mock_mode: bool = False
    allowed_origins: list[str] = ['http://localhost:3000', 'http://localhost:3001']

settings = Settings()

# Ensure directories exist with secure permissions
for path in [settings.artifact_root, settings.temp_root]:
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Ensure permissions are correct if directory already existed
    os.chmod(path, 0o700)
