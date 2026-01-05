"""Application configuration and settings management."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All settings can be overridden via environment variables.
    Secrets should never be committed to version control.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Code Story"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/codestory",
        description="PostgreSQL connection URL (async)",
    )
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching and Celery",
    )

    # Authentication
    secret_key: str = Field(
        default="change-me-in-production",
        description="Secret key for JWT signing",
    )
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    refresh_token_expire_days: int = 30
    algorithm: str = "HS256"

    # Anthropic / Claude
    anthropic_api_key: str = Field(
        default="",
        description="Anthropic API key for Claude",
    )
    claude_model: str = "claude-opus-4-5-20251101"
    claude_max_tokens: int = 8192
    claude_effort: Literal["low", "medium", "high"] = "high"

    # ElevenLabs
    elevenlabs_api_key: str = Field(
        default="",
        description="ElevenLabs API key for voice synthesis",
    )
    elevenlabs_default_voice: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
    elevenlabs_model: str = "eleven_multilingual_v2"

    # GitHub
    github_token: str = Field(
        default="",
        description="GitHub personal access token for API access",
    )
    github_api_base: str = "https://api.github.com"

    # AWS S3
    aws_access_key_id: str = Field(default="", description="AWS access key")
    aws_secret_access_key: str = Field(default="", description="AWS secret key")
    aws_region: str = "us-east-1"
    s3_bucket: str = Field(default="codestory-audio", description="S3 bucket for audio files")
    s3_endpoint_url: str | None = None  # For S3-compatible storage

    # Celery
    celery_broker_url: str | None = None  # Defaults to redis_url if not set
    celery_result_backend: str | None = None  # Defaults to redis_url if not set

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 3600

    # Feature Flags
    enable_voice_synthesis: bool = True
    enable_github_private_repos: bool = False
    enable_analytics: bool = True
    max_story_duration_minutes: int = 30
    max_repo_size_mb: int = 100

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensure database URL uses async driver."""
        if v and "postgresql://" in v and "asyncpg" not in v:
            v = v.replace("postgresql://", "postgresql+asyncpg://")
        return v

    @computed_field
    @property
    def celery_broker(self) -> str:
        """Get Celery broker URL, defaulting to Redis URL."""
        return self.celery_broker_url or self.redis_url

    @computed_field
    @property
    def celery_backend(self) -> str:
        """Get Celery result backend URL, defaulting to Redis URL."""
        return self.celery_result_backend or self.redis_url

    @computed_field
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    def has_anthropic_key(self) -> bool:
        """Check if Anthropic API key is configured."""
        return bool(self.anthropic_api_key and self.anthropic_api_key != "")

    def has_elevenlabs_key(self) -> bool:
        """Check if ElevenLabs API key is configured."""
        return bool(self.elevenlabs_api_key and self.elevenlabs_api_key != "")

    def has_github_token(self) -> bool:
        """Check if GitHub token is configured."""
        return bool(self.github_token and self.github_token != "")

    def has_aws_credentials(self) -> bool:
        """Check if AWS credentials are configured."""
        return bool(self.aws_access_key_id and self.aws_secret_access_key)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance.

    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()


def get_config() -> Settings:
    """Alias for get_settings() for clearer dependency naming."""
    return get_settings()
