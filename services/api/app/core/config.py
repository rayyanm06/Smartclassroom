import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root path of the repo
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:Nusrat%4080@localhost:3306/smart_classroom"
    DEVICE_KEY: str = "dev-secret-device-key-2026"
    API_URL: str = "http://localhost:8000"
    TZ: str = "Asia/Kolkata"
    SETTINGS_PRESET: str = "demo"
    VITE_API_URL: str = "http://localhost:8000"
    VITE_VISION_URL: str = "http://localhost:8001"
    VITE_USE_MOCKS: str = "false"
    VITE_DEV_TOOLS: str = "true"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
