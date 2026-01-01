"""Audio generation test endpoint.

This endpoint allows direct testing of ElevenLabs TTS and S3 upload
without requiring the full story pipeline or Supabase.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.elevenlabs import get_elevenlabs_service
from app.services.s3 import get_s3_service

router = APIRouter()


class AudioTestRequest(BaseModel):
    """Request for audio test generation."""
    text: str = "Welcome to Code Story. This is a test of the audio generation pipeline."
    voice: str = "Rachel"


class AudioTestResponse(BaseModel):
    """Response from audio test generation."""
    success: bool
    audio_url: str | None = None
    file_size_bytes: int | None = None
    story_id: str | None = None
    error: str | None = None
    timestamp: str


@router.post("/generate", response_model=AudioTestResponse)
async def test_audio_generation(request: AudioTestRequest) -> AudioTestResponse:
    """
    Generate test audio using ElevenLabs and upload to S3.

    This endpoint bypasses the story pipeline to directly test TTS functionality.
    """
    timestamp = datetime.utcnow().isoformat()

    try:
        # Initialize services
        elevenlabs = get_elevenlabs_service()
        s3 = get_s3_service()

        # Generate unique story ID for test
        test_story_id = f"test-{uuid.uuid4().hex[:8]}"

        # Synthesize audio
        audio_data = elevenlabs.synthesize_text(request.text, request.voice)

        if not audio_data:
            raise ValueError("No audio data returned from ElevenLabs")

        # Upload to S3
        audio_url = s3.upload_audio(
            audio_data=audio_data,
            story_id=test_story_id,
        )

        return AudioTestResponse(
            success=True,
            audio_url=audio_url,
            file_size_bytes=len(audio_data),
            story_id=test_story_id,
            timestamp=timestamp,
        )

    except Exception as e:
        return AudioTestResponse(
            success=False,
            error=str(e),
            timestamp=timestamp,
        )


@router.get("/health")
async def test_audio_health() -> dict:
    """Check if audio services are configured and accessible."""
    result = {
        "elevenlabs": "unknown",
        "s3": "unknown",
        "timestamp": datetime.utcnow().isoformat(),
    }

    try:
        from app.config import get_settings
        settings = get_settings()

        # Check ElevenLabs
        if settings.elevenlabs_api_key and not settings.elevenlabs_api_key.startswith("your-"):
            result["elevenlabs"] = "configured"
        else:
            result["elevenlabs"] = "not_configured"

        # Check S3
        if settings.aws_access_key_id and not settings.aws_access_key_id.startswith("your-"):
            result["s3"] = "configured"
        else:
            result["s3"] = "not_configured"

    except Exception as e:
        result["error"] = str(e)

    return result
