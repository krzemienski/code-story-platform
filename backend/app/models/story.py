"""Story-related Pydantic models."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class StoryStatus(str, Enum):
    """Story generation status."""

    PENDING = "pending"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    SYNTHESIZING = "synthesizing"
    COMPLETED = "completed"
    FAILED = "failed"


class StoryStyle(str, Enum):
    """Narrative style options."""

    DOCUMENTARY = "documentary"
    TUTORIAL = "tutorial"
    PODCAST = "podcast"
    FICTION = "fiction"
    TECHNICAL = "technical"


class VoiceName(str, Enum):
    """ElevenLabs voice options."""

    RACHEL = "Rachel"
    DREW = "Drew"
    BELLA = "Bella"
    ANTONI = "Antoni"


class TechnicalDepth(str, Enum):
    """Technical depth level."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class StoryCreateRequest(BaseModel):
    """Request model for creating a new story."""

    repo_url: HttpUrl = Field(..., alias="repoUrl", description="GitHub repository URL")
    style: StoryStyle = Field(default=StoryStyle.DOCUMENTARY, description="Narrative style")
    duration: int = Field(default=10, ge=5, le=20, description="Target duration in minutes")
    voice: VoiceName = Field(default=VoiceName.RACHEL, description="Voice for synthesis")
    focus_areas: list[str] = Field(
        default_factory=list, alias="focusAreas", description="Areas to focus on"
    )
    technical_depth: TechnicalDepth = Field(
        default=TechnicalDepth.INTERMEDIATE,
        alias="technicalDepth",
        description="Technical depth level",
    )

    model_config = {"populate_by_name": True}


class StoryCreateResponse(BaseModel):
    """Response model for story creation."""

    id: str
    status: StoryStatus
    message: str


class StoryStatusResponse(BaseModel):
    """Response model for story status polling."""

    id: str
    status: StoryStatus
    progress: int = Field(ge=0, le=100, default=0)
    audio_url: str | None = None
    error_message: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class Chapter(BaseModel):
    """Story chapter model."""

    title: str
    content: str
    code_examples: list[dict[str, Any]] = Field(default_factory=list)
    duration_seconds: int
    timestamp_start: int


class StoryResponse(BaseModel):
    """Full story response model."""

    id: str
    repo_url: str
    repo_name: str
    status: StoryStatus
    progress: int = Field(ge=0, le=100)
    style: StoryStyle
    duration_minutes: int
    audio_url: str | None = None
    audio_chunks: list[str] = Field(default_factory=list)
    chapters: list[Chapter] = Field(default_factory=list)
    cover_url: str | None = None
    created_at: datetime
    updated_at: datetime
    error_message: str | None = None

    model_config = {"from_attributes": True}
