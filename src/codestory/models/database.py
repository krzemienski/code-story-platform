"""SQLAlchemy database configuration and session management."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator

from ..core.config import get_settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


# Global engine and session factory
engine = None
async_session_factory = None


async def init_db(database_url: str | None = None) -> None:
    """Initialize database engine and session factory.
    
    Args:
        database_url: Optional database URL. Uses settings if not provided.
    """
    global engine, async_session_factory
    
    if database_url is None:
        settings = get_settings()
        database_url = settings.database_url
    
    engine = create_async_engine(
        database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
    )
    async_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI to get database session.
    
    Yields:
        AsyncSession: Database session for ORM operations
    """
    if async_session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    async with async_session_factory() as session:
        yield session


async def close_db() -> None:
    """Close database connections."""
    global engine
    if engine:
        await engine.dispose()
