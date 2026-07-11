from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Local dev defaults to a zero-setup SQLite file. Railway sets DATABASE_URL
    # to a Postgres URL in production.
    database_url: str = "sqlite:///./trackplication.db"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-4-8"

    # Auth. Set a strong JWT_SECRET in production.
    jwt_secret: str = "dev-secret-change-me-in-production-only"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Directory holding the built frontend (dist/). Empty in dev; set in the
    # Docker image so FastAPI serves the SPA. See main.py.
    static_dir: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
