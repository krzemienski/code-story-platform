"""Story generation pipeline Celery task."""

import asyncio
from typing import Any

from celery import Task
from celery.exceptions import SoftTimeLimitExceeded

from app.tasks.celery_app import celery_app
from app.models.story import StoryStatus
from app.models.processing_log import LogLevel, AgentName
from app.services.supabase import get_supabase_service
from app.services.s3 import get_s3_service
from app.services.elevenlabs import get_elevenlabs_service
from app.agents.pipeline import run_agent_pipeline


class StoryGenerationTask(Task):
    """Base task class for story generation with error handling."""

    autoretry_for = (Exception,)
    retry_backoff = True
    retry_backoff_max = 300
    retry_jitter = True
    max_retries = 3

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        story_id = kwargs.get("story_id") or args[0]
        asyncio.run(self._handle_failure(story_id, str(exc)))

    async def _handle_failure(self, story_id: str, error_message: str) -> None:
        """Update story status on failure."""
        supabase = get_supabase_service()
        await supabase.update_story_status(
            story_id=story_id,
            status=StoryStatus.FAILED,
            error_message=error_message,
        )
        await supabase.insert_processing_log(
            story_id=story_id,
            agent_name=AgentName.SYSTEM.value,
            action=f"Story generation failed: {error_message}",
            level=LogLevel.ERROR,
        )


@celery_app.task(bind=True, base=StoryGenerationTask)
def generate_story_task(
    self,
    story_id: str,
    repo_url: str,
    style: str,
    duration_minutes: int,
    voice: str,
    focus_areas: list[str],
    technical_depth: str,
) -> dict[str, Any]:
    """
    Main story generation task.

    Runs the 4-agent pipeline:
    1. Intent Agent - Validates and refines user intent
    2. Repo Analyzer - Analyzes the repository with RepoMix
    3. Story Architect - Creates the narrative script
    4. Voice Director - Synthesizes audio with ElevenLabs

    Args:
        story_id: Unique story identifier
        repo_url: GitHub repository URL
        style: Narrative style (documentary, tutorial, etc.)
        duration_minutes: Target duration in minutes
        voice: ElevenLabs voice name
        focus_areas: List of focus areas for the story
        technical_depth: Technical depth level

    Returns:
        Dictionary with audio_url, audio_chunks, and duration
    """
    try:
        return asyncio.run(
            _run_pipeline(
                story_id=story_id,
                repo_url=repo_url,
                style=style,
                duration_minutes=duration_minutes,
                voice=voice,
                focus_areas=focus_areas,
                technical_depth=technical_depth,
            )
        )
    except SoftTimeLimitExceeded:
        asyncio.run(_handle_timeout(story_id))
        raise


async def _run_pipeline(
    story_id: str,
    repo_url: str,
    style: str,
    duration_minutes: int,
    voice: str,
    focus_areas: list[str],
    technical_depth: str,
) -> dict[str, Any]:
    """Run the agent pipeline asynchronously."""
    supabase = get_supabase_service()
    s3 = get_s3_service()
    elevenlabs = get_elevenlabs_service()

    # Update status to analyzing
    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.ANALYZING,
        progress=5,
    )

    await supabase.insert_processing_log(
        story_id=story_id,
        agent_name=AgentName.SYSTEM.value,
        action="Starting story generation pipeline",
        level=LogLevel.INFO,
    )

    # Run the 4-agent pipeline
    pipeline_result = await run_agent_pipeline(
        story_id=story_id,
        repo_url=repo_url,
        style=style,
        duration_minutes=duration_minutes,
        focus_areas=focus_areas,
        technical_depth=technical_depth,
        supabase=supabase,
    )

    # Get the script from the pipeline
    script = pipeline_result["script"]
    chapters = pipeline_result.get("chapters", [])

    # Update status to synthesizing
    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.SYNTHESIZING,
        progress=75,
    )

    await supabase.insert_processing_log(
        story_id=story_id,
        agent_name=AgentName.SYNTHESIZER.value,
        action="Synthesizing audio with ElevenLabs",
        level=LogLevel.INFO,
        details={"voice": voice, "script_length": len(script)},
    )

    # Synthesize audio
    audio_chunks_data = elevenlabs.synthesize_long_text(script, voice)

    # Upload audio chunks to S3
    audio_chunk_urls = []
    for i, chunk_data in enumerate(audio_chunks_data):
        chunk_url = s3.upload_audio(
            audio_data=chunk_data,
            story_id=story_id,
            chunk_index=i,
        )
        audio_chunk_urls.append(chunk_url)

        await supabase.insert_processing_log(
            story_id=story_id,
            agent_name=AgentName.SYNTHESIZER.value,
            action=f"Uploaded audio chunk {i + 1}/{len(audio_chunks_data)}",
            level=LogLevel.INFO,
        )

    # Use first chunk as main audio URL (or concatenate later)
    audio_url = audio_chunk_urls[0] if audio_chunk_urls else ""

    # Estimate duration
    duration_seconds = elevenlabs.estimate_duration(script)

    # Update status to completed
    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.COMPLETED,
        progress=100,
        audio_url=audio_url,
        audio_chunks=audio_chunk_urls,
        chapters=chapters,
        duration_seconds=duration_seconds,
    )

    await supabase.insert_processing_log(
        story_id=story_id,
        agent_name=AgentName.SYSTEM.value,
        action="Story generation completed successfully",
        level=LogLevel.SUCCESS,
        details={
            "audio_chunks": len(audio_chunk_urls),
            "duration_seconds": duration_seconds,
        },
    )

    return {
        "audio_url": audio_url,
        "audio_chunks": audio_chunk_urls,
        "duration": duration_seconds,
    }


async def _handle_timeout(story_id: str) -> None:
    """Handle task timeout."""
    supabase = get_supabase_service()
    await supabase.update_story_status(
        story_id=story_id,
        status=StoryStatus.FAILED,
        error_message="Story generation timed out after 10 minutes",
    )
    await supabase.insert_processing_log(
        story_id=story_id,
        agent_name=AgentName.SYSTEM.value,
        action="Story generation timed out",
        level=LogLevel.ERROR,
    )
