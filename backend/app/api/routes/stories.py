"""Story generation API endpoints."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import HttpUrl

from app.models.story import (
    StoryCreateRequest,
    StoryCreateResponse,
    StoryStatusResponse,
    StoryStatus,
)
from app.services.supabase import get_supabase_service
from app.tasks.story_pipeline import generate_story_task

router = APIRouter()


def extract_repo_name(repo_url: str) -> str:
    """Extract repository name from GitHub URL."""
    # Handle URLs like https://github.com/owner/repo or https://github.com/owner/repo.git
    url = str(repo_url).rstrip("/").removesuffix(".git")
    parts = url.split("/")
    if len(parts) >= 2:
        return f"{parts[-2]}/{parts[-1]}"
    return parts[-1] if parts else "unknown"


@router.post("/generate", response_model=StoryCreateResponse)
async def generate_story(
    request: StoryCreateRequest,
    background_tasks: BackgroundTasks,
) -> StoryCreateResponse:
    """
    Start story generation for a GitHub repository.

    This endpoint creates a new story record and queues the generation task.
    The actual generation happens asynchronously via Celery.
    """
    try:
        supabase = get_supabase_service()

        # Extract repo name from URL
        repo_name = extract_repo_name(str(request.repo_url))

        # Create story record in database
        story = await supabase.create_story(
            repo_url=str(request.repo_url),
            repo_name=repo_name,
            style=request.style,
            duration_minutes=request.duration,
            voice=request.voice.value,
            focus_areas=request.focus_areas,
            technical_depth=request.technical_depth.value,
        )
    except Exception as e:
        # Database connection error - return 503 Service Unavailable
        raise HTTPException(
            status_code=503,
            detail=f"Database service unavailable: {str(e)}",
        )

    story_id = story["id"]

    # Queue the generation task
    generate_story_task.delay(
        story_id=story_id,
        repo_url=str(request.repo_url),
        style=request.style.value,
        duration_minutes=request.duration,
        voice=request.voice.value,
        focus_areas=request.focus_areas,
        technical_depth=request.technical_depth.value,
    )

    return StoryCreateResponse(
        id=story_id,
        status=StoryStatus.PENDING,
        message="Story generation started",
    )


@router.get("/{story_id}", response_model=StoryStatusResponse)
async def get_story_status(story_id: str) -> StoryStatusResponse:
    """
    Get the current status of a story generation.

    Frontend polls this endpoint every 2 seconds to track progress.
    """
    try:
        supabase = get_supabase_service()
        story = await supabase.get_story(story_id)
    except Exception as e:
        # Database connection error - return 503 Service Unavailable
        raise HTTPException(
            status_code=503,
            detail=f"Database service unavailable: {str(e)}",
        )

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    return StoryStatusResponse(
        id=story["id"],
        repo_url=story["repo_url"],
        repo_name=story["repo_name"],
        status=StoryStatus(story["status"]),
        progress=story.get("progress", 0),
        style=story["style"],
        duration_minutes=story["duration_minutes"],
        voice=story["voice"],
        focus_areas=story.get("focus_areas", []),
        technical_depth=story["technical_depth"],
        audio_url=story.get("audio_url"),
        audio_chunks=story.get("audio_chunks", []),
        chapters=story.get("chapters", []),
        cover_url=story.get("cover_url"),
        duration_seconds=story.get("duration_seconds"),
        error_message=story.get("error_message"),
        created_at=story["created_at"],
        updated_at=story["updated_at"],
    )


@router.post("/{story_id}/restart", response_model=StoryCreateResponse)
async def restart_story(story_id: str) -> StoryCreateResponse:
    """
    Restart a failed story generation.

    Resets the story status to pending and re-queues the generation task.
    """
    supabase = get_supabase_service()

    story = await supabase.get_story(story_id)

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    if story["status"] != StoryStatus.FAILED.value:
        raise HTTPException(
            status_code=400,
            detail="Can only restart failed stories",
        )

    # Reset status to pending
    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.PENDING,
        progress=0,
        error_message=None,
    )

    # Re-queue the generation task
    generate_story_task.delay(
        story_id=story_id,
        repo_url=story["repo_url"],
        style=story["style"],
        duration_minutes=story["duration_minutes"],
        voice=story["voice"],
        focus_areas=story.get("focus_areas", []),
        technical_depth=story["technical_depth"],
    )

    return StoryCreateResponse(
        id=story_id,
        status=StoryStatus.PENDING,
        message="Story generation restarted",
    )
