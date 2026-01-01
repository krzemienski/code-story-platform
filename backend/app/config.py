"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Code Story Platform"
    debug: bool = False
    api_prefix: str = "/api"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Anthropic
    anthropic_api_key: str

    # ElevenLabs
    elevenlabs_api_key: str

    # AWS S3
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_s3_bucket: str = "code-story-audio"
    aws_region: str = "us-east-1"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # GitHub (optional, for higher rate limits)
    github_token: str | None = None

    # Claude Model Configuration
    claude_model: str = "claude-opus-4-5-20251101"
    claude_thinking_budget: int = 10000
    claude_max_tokens: int = 16000


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
