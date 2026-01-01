"""Health check endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "service": "code-story-backend",
        "version": "1.0.0",
    }


@router.get("/ready")
async def readiness_check() -> dict:
    """Readiness check for Kubernetes probes."""
    # TODO: Add checks for Redis, Supabase connectivity
    return {
        "status": "ready",
        "checks": {
            "database": "ok",
            "redis": "ok",
        },
    }
