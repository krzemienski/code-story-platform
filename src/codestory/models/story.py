"""Story and chapter models."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


class Repository(Base):
    """GitHub repository reference."""

    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    repo_url = Column(String(500), nullable=False)
    repo_owner = Column(String(100), nullable=False)
    repo_name = Column(String(100), nullable=False)
    default_branch = Column(String(100), default="main")
    analysis_cache = Column(JSON, nullable=True)  # Cached analysis results
    last_analyzed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    stories = relationship("Story", back_populates="repository")
    intents = relationship("StoryIntent", back_populates="repository")


class Story(Base):
    """Generated story from repository analysis."""

    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False)
    intent_id = Column(UUID(as_uuid=True), ForeignKey("story_intents.id"), nullable=True)

    title = Column(String(255), nullable=False)
    narrative_style = Column(String(50), nullable=False)  # fiction, documentary, tutorial, podcast, technical
    voice_id = Column(String(100), nullable=True)  # ElevenLabs voice ID

    script_text = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    status = Column(String(50), default="pending")  # pending, analyzing, generating, synthesizing, complete, failed
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="stories")
    repository = relationship("Repository", back_populates="stories")
    intent = relationship("StoryIntent", back_populates="story")
    chapters = relationship(
        "StoryChapter",
        back_populates="story",
        order_by="StoryChapter.chapter_number"
    )


class StoryChapter(Base):
    """Chapter within a story."""

    __tablename__ = "story_chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id"), nullable=False)

    chapter_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    start_time_seconds = Column(Float, nullable=False)
    duration_seconds = Column(Float, nullable=True)

    script_segment = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("Story", back_populates="chapters")
