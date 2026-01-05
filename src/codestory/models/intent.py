"""Story intent model for capturing user goals."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


class StoryIntent(Base):
    """User's intent for story generation."""

    __tablename__ = "story_intents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False)

    intent_category = Column(String(100), nullable=False)  # onboarding, architecture, feature, debugging
    expertise_level = Column(String(50), default="intermediate")  # beginner, intermediate, expert
    focus_areas = Column(JSON, default=list)  # List of components/features to focus on
    learning_goals = Column(Text, nullable=True)

    conversation_history = Column(JSON, default=list)  # Chat history with Intent Agent
    generated_plan = Column(JSON, nullable=True)  # Structured story plan

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="intents")
    repository = relationship("Repository", back_populates="intents")
    story = relationship("Story", back_populates="intent", uselist=False)
