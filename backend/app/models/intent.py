"""Intent-related Pydantic models for chat endpoint."""

from pydantic import BaseModel, Field, HttpUrl

from app.models.story import StoryStyle, TechnicalDepth


class ChatMessage(BaseModel):
    """Chat message in conversation history."""

    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class IntentRequest(BaseModel):
    """Request model for intent extraction."""

    message: str = Field(..., min_length=1, description="User's natural language message")
    repo_url: HttpUrl = Field(..., alias="repoUrl", description="GitHub repository URL")

    model_config = {"populate_by_name": True}


class IntentChatRequest(BaseModel):
    """Request model for intent chat with conversation history."""

    message: str = Field(..., min_length=1, description="User's natural language message")
    repo_url: HttpUrl = Field(..., alias="repoUrl", description="GitHub repository URL")
    conversation_history: list[ChatMessage] = Field(
        default_factory=list,
        alias="conversationHistory",
        description="Previous conversation messages",
    )

    model_config = {"populate_by_name": True}


class ExtractedIntent(BaseModel):
    """Extracted intent from user message."""

    focus_areas: list[str] = Field(
        default_factory=list, alias="focusAreas", description="Identified focus areas"
    )
    technical_depth: TechnicalDepth = Field(
        default=TechnicalDepth.INTERMEDIATE,
        alias="technicalDepth",
        description="Inferred technical depth",
    )
    style: StoryStyle = Field(
        default=StoryStyle.DOCUMENTARY, description="Suggested narrative style"
    )
    suggested_duration: int = Field(
        default=10, alias="suggestedDuration", ge=5, le=20, description="Suggested duration"
    )

    model_config = {"populate_by_name": True}


class IntentResponse(BaseModel):
    """Response model for intent extraction."""

    intent: ExtractedIntent
    message: str = Field(..., description="Natural language response to user")
