from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Provider keys (kept flat for pydantic-settings env mapping convenience).
    google_ai_api_key: str = ""
    apify_api_token: str = ""
    serpapi_key: str = ""
    pexels_api_key: str = ""
    replicate_api_token: str = ""
    openai_api_key: str = ""
    luma_api_key: str = ""
    kling_api_key: str = ""
    runway_api_key: str = ""

    # Firebase / Firestore
    firebase_project_id: str = ""
    firebase_storage_bucket: str = ""
    firebase_credentials_json: str = ""

    # Local model endpoints
    ollama_base_url: str = "http://localhost:11434/v1"
    sd_base_url: str = "http://localhost:7860/sdapi/v1"

    # App
    app_cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.app_cors_origins.split(",") if o.strip()]


settings = Settings()
