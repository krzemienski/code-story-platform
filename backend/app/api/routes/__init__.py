"""API routes module."""

from fastapi import APIRouter

from app.api.routes import health, stories, intent, test_audio

router = APIRouter()

# Include all route modules
router.include_router(health.router, tags=["health"])
router.include_router(stories.router, prefix="/stories", tags=["stories"])
router.include_router(intent.router, prefix="/chat", tags=["chat"])
router.include_router(test_audio.router, prefix="/test/audio", tags=["test"])
