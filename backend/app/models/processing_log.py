"""Processing log models for real-time updates."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class LogLevel(str, Enum):
    """Log severity level."""

    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class AgentName(str, Enum):
    """Agent names in the pipeline."""

    SYSTEM = "System"
    INTENT = "Intent"
    ANALYZER = "Analyzer"
    ARCHITECT = "Architect"
    NARRATOR = "Narrator"
    SYNTHESIZER = "Synthesizer"


class ProcessingLog(BaseModel):
    """Processing log entry for story generation progress."""

    id: str | None = None
    story_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    agent_name: str
    action: str
    details: dict[str, Any] = Field(default_factory=dict)
    level: LogLevel = LogLevel.INFO


class WebSocketMessage(BaseModel):
    """WebSocket message format."""

    type: str  # "log", "status", "complete", "error"
    data: dict[str, Any]


class StatusUpdate(BaseModel):
    """Status update message."""

    status: str
    progress: int


class CompleteMessage(BaseModel):
    """Completion message with audio details."""

    audio_url: str
    audio_chunks: list[str]
    duration: int
