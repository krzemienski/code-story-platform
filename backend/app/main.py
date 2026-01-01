"""FastAPI application entry point for Code Story backend."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.api.websocket import websocket_endpoint
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan handler for startup/shutdown."""
    # Startup
    settings = get_settings()
    print(f"🚀 Code Story Backend starting...")
    print(f"   Model: {settings.claude_model}")
    print(f"   Thinking Budget: {settings.claude_thinking_budget} tokens")

    yield

    # Shutdown
    print("👋 Code Story Backend shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Code Story API",
        description="Transform GitHub repositories into engaging audio stories",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS middleware for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:3001",
            "https://codestory.app",
            "https://*.vercel.app",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(router, prefix="/api")

    # WebSocket endpoint for real-time updates
    @app.websocket("/ws/stories/{story_id}/progress")
    async def ws_story_progress(websocket: WebSocket, story_id: str):
        await websocket_endpoint(websocket, story_id)

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
