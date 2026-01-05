"""Initial schema migration.

This migration will be auto-generated once the database is available.
For now, this is a placeholder for the initial schema.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial schema tables."""
    # Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("subscription_tier", sa.String(50), nullable=True),
        sa.Column("preferences", sa.JSON(), nullable=True),
        sa.Column("usage_quota", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # API Keys table
    op.create_table(
        "api_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("key_hash", sa.String(255), nullable=False),
        sa.Column("permissions", sa.JSON(), nullable=True),
        sa.Column("rate_limit", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("last_used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(("user_id",), ("users.id")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash"),
    )

    # Repositories table
    op.create_table(
        "repositories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("repo_url", sa.String(500), nullable=False),
        sa.Column("repo_owner", sa.String(100), nullable=False),
        sa.Column("repo_name", sa.String(100), nullable=False),
        sa.Column("default_branch", sa.String(100), nullable=True),
        sa.Column("analysis_cache", sa.JSON(), nullable=True),
        sa.Column("last_analyzed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(("user_id",), ("users.id")),
        sa.PrimaryKeyConstraint("id"),
    )

    # Stories table
    op.create_table(
        "stories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("repository_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("intent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("narrative_style", sa.String(50), nullable=False),
        sa.Column("voice_id", sa.String(100), nullable=True),
        sa.Column("script_text", sa.Text(), nullable=True),
        sa.Column("audio_url", sa.String(500), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(("intent_id",), ("story_intents.id")),
        sa.ForeignKeyConstraint(("repository_id",), ("repositories.id")),
        sa.ForeignKeyConstraint(("user_id",), ("users.id")),
        sa.PrimaryKeyConstraint("id"),
    )

    # Story Chapters table
    op.create_table(
        "story_chapters",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("story_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chapter_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("start_time_seconds", sa.Float(), nullable=False),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("script_segment", sa.Text(), nullable=True),
        sa.Column("audio_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(("story_id",), ("stories.id")),
        sa.PrimaryKeyConstraint("id"),
    )

    # Story Intents table
    op.create_table(
        "story_intents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("repository_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("intent_category", sa.String(100), nullable=False),
        sa.Column("expertise_level", sa.String(50), nullable=True),
        sa.Column("focus_areas", sa.JSON(), nullable=True),
        sa.Column("learning_goals", sa.Text(), nullable=True),
        sa.Column("conversation_history", sa.JSON(), nullable=True),
        sa.Column("generated_plan", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(("repository_id",), ("repositories.id")),
        sa.ForeignKeyConstraint(("user_id",), ("users.id")),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table("story_intents")
    op.drop_table("story_chapters")
    op.drop_table("stories")
    op.drop_table("repositories")
    op.drop_table("api_keys")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
