"""Supabase service for database operations."""

import uuid
from datetime import datetime
from typing import Any

from supabase import create_client, Client

from app.config import get_settings
from app.models.story import StoryStatus, StoryStyle
from app.models.processing_log import LogLevel


class SupabaseService:
    """Service for Supabase database operations."""

    def __init__(self):
        settings = get_settings()
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    @property
    def client(self) -> Client:
        """Get the Supabase client."""
        return self._client

    # Story Operations

    async def create_story(
        self,
        repo_url: str,
        repo_name: str,
        style: StoryStyle,
        duration_minutes: int,
        voice: str,
        focus_areas: list[str],
        technical_depth: str,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        """Create a new story record."""
        story_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        data = {
            "id": story_id,
            "repo_url": repo_url,
            "repo_name": repo_name,
            "status": StoryStatus.PENDING.value,
            "progress": 0,
            "style": style.value,
            "duration_minutes": duration_minutes,
            "voice": voice,
            "focus_areas": focus_areas,
            "technical_depth": technical_depth,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }

        result = self._client.table("stories").insert(data).execute()
        return result.data[0] if result.data else data

    async def get_story(self, story_id: str) -> dict[str, Any] | None:
        """Get a story by ID."""
        result = self._client.table("stories").select("*").eq("id", story_id).execute()
        return result.data[0] if result.data else None

    async def update_story_status(
        self,
        story_id: str,
        status: StoryStatus,
        progress: int | None = None,
        audio_url: str | None = None,
        audio_chunks: list[str] | None = None,
        chapters: list[dict] | None = None,
        cover_url: str | None = None,
        duration_seconds: int | None = None,
        error_message: str | None = None,
    ) -> dict[str, Any] | None:
        """Update story status and related fields."""
        data: dict[str, Any] = {
            "status": status.value,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if progress is not None:
            data["progress"] = progress
        if audio_url is not None:
            data["audio_url"] = audio_url
        if audio_chunks is not None:
            data["audio_chunks"] = audio_chunks
        if chapters is not None:
            data["chapters"] = chapters
        if cover_url is not None:
            data["cover_url"] = cover_url
        if duration_seconds is not None:
            data["duration_seconds"] = duration_seconds
        if error_message is not None:
            data["error_message"] = error_message

        result = self._client.table("stories").update(data).eq("id", story_id).execute()
        return result.data[0] if result.data else None

    # Processing Log Operations

    async def insert_processing_log(
        self,
        story_id: str,
        agent_name: str,
        action: str,
        level: LogLevel = LogLevel.INFO,
        details: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Insert a processing log entry."""
        log_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        data = {
            "id": log_id,
            "story_id": story_id,
            "timestamp": now,
            "agent_name": agent_name,
            "action": action,
            "level": level.value,
            "details": details or {},
        }

        result = self._client.table("processing_logs").insert(data).execute()
        return result.data[0] if result.data else data

    async def get_processing_logs(self, story_id: str) -> list[dict[str, Any]]:
        """Get all processing logs for a story."""
        result = (
            self._client.table("processing_logs")
            .select("*")
            .eq("story_id", story_id)
            .order("timestamp", desc=False)
            .execute()
        )
        return result.data or []


# Singleton instance
_supabase_service: SupabaseService | None = None


def get_supabase_service() -> SupabaseService:
    """Get or create the Supabase service singleton."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
