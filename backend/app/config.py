from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://tracker:tracker@localhost:5432/tracker"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-4-8"
    app_api_key: str = "dev-key"

    # Directory holding the built frontend (dist/). Empty in dev; set in the
    # Docker image so FastAPI serves the SPA. See main.py.
    static_dir: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
