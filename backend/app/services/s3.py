"""AWS S3 service for audio file storage."""

import uuid
from datetime import datetime

import boto3
from botocore.config import Config

from app.config import get_settings


class S3Service:
    """Service for AWS S3 operations."""

    def __init__(self):
        settings = get_settings()
        self._client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
            config=Config(signature_version="s3v4"),
        )
        self._bucket = settings.aws_s3_bucket
        self._region = settings.aws_region

    def upload_audio(
        self,
        audio_data: bytes,
        story_id: str,
        chunk_index: int | None = None,
        content_type: str = "audio/mpeg",
    ) -> str:
        """
        Upload audio data to S3.

        Args:
            audio_data: Audio file bytes
            story_id: Story ID for organizing files
            chunk_index: Optional chunk index for multi-part audio
            content_type: MIME type of the audio

        Returns:
            Public URL of the uploaded file
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]

        if chunk_index is not None:
            key = f"audio/{story_id}/chunk_{chunk_index:03d}_{file_id}.mp3"
        else:
            key = f"audio/{story_id}/full_{timestamp}_{file_id}.mp3"

        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=audio_data,
            ContentType=content_type,
            ACL="public-read",
        )

        # Return public URL
        return f"https://{self._bucket}.s3.{self._region}.amazonaws.com/{key}"

    def upload_cover_image(
        self,
        image_data: bytes,
        story_id: str,
        content_type: str = "image/png",
    ) -> str:
        """
        Upload cover image to S3.

        Args:
            image_data: Image file bytes
            story_id: Story ID for organizing files
            content_type: MIME type of the image

        Returns:
            Public URL of the uploaded file
        """
        file_id = str(uuid.uuid4())[:8]
        extension = "png" if "png" in content_type else "jpg"
        key = f"covers/{story_id}/cover_{file_id}.{extension}"

        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=image_data,
            ContentType=content_type,
            ACL="public-read",
        )

        return f"https://{self._bucket}.s3.{self._region}.amazonaws.com/{key}"

    def upload_concatenated_audio(
        self,
        audio_chunks: list[bytes],
        story_id: str,
        content_type: str = "audio/mpeg",
    ) -> str:
        """
        Concatenate and upload multiple audio chunks as a single file.

        MP3 files can be concatenated directly when they share the same
        encoding settings (bitrate, sample rate, channels).

        Args:
            audio_chunks: List of audio file bytes to concatenate
            story_id: Story ID for organizing files
            content_type: MIME type of the audio

        Returns:
            Public URL of the uploaded concatenated file
        """
        if not audio_chunks:
            raise ValueError("No audio chunks to concatenate")

        # Simple concatenation for MP3 files with same encoding
        concatenated = b"".join(audio_chunks)

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]
        key = f"audio/{story_id}/full_{timestamp}_{file_id}.mp3"

        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=concatenated,
            ContentType=content_type,
            ACL="public-read",
        )

        return f"https://{self._bucket}.s3.{self._region}.amazonaws.com/{key}"

    def delete_story_files(self, story_id: str) -> None:
        """Delete all files associated with a story."""
        # List and delete audio files
        audio_response = self._client.list_objects_v2(
            Bucket=self._bucket, Prefix=f"audio/{story_id}/"
        )

        if "Contents" in audio_response:
            for obj in audio_response["Contents"]:
                self._client.delete_object(Bucket=self._bucket, Key=obj["Key"])

        # List and delete cover files
        cover_response = self._client.list_objects_v2(
            Bucket=self._bucket, Prefix=f"covers/{story_id}/"
        )

        if "Contents" in cover_response:
            for obj in cover_response["Contents"]:
                self._client.delete_object(Bucket=self._bucket, Key=obj["Key"])


# Singleton instance
_s3_service: S3Service | None = None


def get_s3_service() -> S3Service:
    """Get or create the S3 service singleton."""
    global _s3_service
    if _s3_service is None:
        _s3_service = S3Service()
    return _s3_service
