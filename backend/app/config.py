"""
App configuration via pydantic-settings.
All secrets are optional so the app imports cleanly with no .env file.
"""

from __future__ import annotations

from typing import Annotated, List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- AI ---
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    # Vision model routing (PRD Section 7.4)
    vision_model_primary: str = "gpt-4o"
    vision_model_secondary: str = "claude-sonnet-4-6"
    vision_model_cheap: str = "gpt-4o-mini"
    confidence_threshold: float = 0.7

    # --- Supabase (PRD Section 16) ---
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_key: str | None = None

    # --- Database ---
    database_url: str | None = None

    # --- USDA FoodData Central (PRD Section 8) ---
    usda_api_key: str | None = None

    # --- Server ---
    cors_origins: List[str] = Field(default=["*"])
    photo_max_bytes: int = 5 * 1024 * 1024  # 5 MB


settings = Settings()
