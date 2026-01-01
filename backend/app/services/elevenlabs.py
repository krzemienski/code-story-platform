"""ElevenLabs TTS service for audio synthesis."""

from elevenlabs import ElevenLabs
from elevenlabs.core import ApiError

from app.config import get_settings


# Voice ID mapping
VOICE_IDS = {
    "Rachel": "21m00Tcm4TlvDq8ikWAM",
    "Drew": "29vD33N1CtxCmqQRPOHJ",
    "Bella": "EXAVITQu4vr4xnSDxMaL",
    "Antoni": "ErXwobaYiN019PkySvjV",
}

# Model configuration
ELEVENLABS_MODEL = "eleven_flash_v2_5"
OUTPUT_FORMAT = "mp3_44100_128"

# Voice settings
VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True,
}

# Maximum characters per synthesis request
MAX_CHARS_PER_REQUEST = 5000


class ElevenLabsService:
    """Service for ElevenLabs text-to-speech synthesis."""

    def __init__(self):
        settings = get_settings()
        self._client = ElevenLabs(api_key=settings.elevenlabs_api_key)

    def get_voice_id(self, voice_name: str) -> str:
        """Get voice ID from voice name."""
        return VOICE_IDS.get(voice_name, VOICE_IDS["Rachel"])

    def synthesize_text(self, text: str, voice_name: str = "Rachel") -> bytes:
        """
        Synthesize text to speech.

        Args:
            text: Text to synthesize (max 5000 chars)
            voice_name: Name of the voice to use

        Returns:
            Audio data as bytes

        Raises:
            ValueError: If text exceeds maximum length
            ApiError: If ElevenLabs API fails
        """
        if len(text) > MAX_CHARS_PER_REQUEST:
            raise ValueError(
                f"Text length {len(text)} exceeds maximum {MAX_CHARS_PER_REQUEST}"
            )

        voice_id = self.get_voice_id(voice_name)

        audio_generator = self._client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=ELEVENLABS_MODEL,
            output_format=OUTPUT_FORMAT,
            voice_settings=VOICE_SETTINGS,
        )

        # Collect all audio chunks
        audio_chunks = []
        for chunk in audio_generator:
            audio_chunks.append(chunk)

        return b"".join(audio_chunks)

    def synthesize_long_text(
        self, text: str, voice_name: str = "Rachel"
    ) -> list[bytes]:
        """
        Synthesize long text by splitting into chunks.

        Args:
            text: Full text to synthesize
            voice_name: Name of the voice to use

        Returns:
            List of audio data chunks as bytes
        """
        chunks = self._split_text(text, MAX_CHARS_PER_REQUEST)
        audio_chunks = []

        for chunk in chunks:
            audio_data = self.synthesize_text(chunk, voice_name)
            audio_chunks.append(audio_data)

        return audio_chunks

    def _split_text(self, text: str, max_length: int) -> list[str]:
        """
        Split text into chunks at sentence boundaries.

        Args:
            text: Text to split
            max_length: Maximum length per chunk

        Returns:
            List of text chunks
        """
        if len(text) <= max_length:
            return [text]

        chunks = []
        current_chunk = ""

        # Split by sentences (rough heuristic)
        sentences = text.replace(".\n", ". \n").split(". ")

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # Add period back if it was removed
            if not sentence.endswith("."):
                sentence += "."

            if len(current_chunk) + len(sentence) + 1 <= max_length:
                if current_chunk:
                    current_chunk += " " + sentence
                else:
                    current_chunk = sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def estimate_duration(self, text: str, words_per_minute: int = 150) -> int:
        """
        Estimate audio duration for text.

        Args:
            text: Text to estimate duration for
            words_per_minute: Speaking rate

        Returns:
            Estimated duration in seconds
        """
        word_count = len(text.split())
        minutes = word_count / words_per_minute
        return int(minutes * 60)


# Singleton instance
_elevenlabs_service: ElevenLabsService | None = None


def get_elevenlabs_service() -> ElevenLabsService:
    """Get or create the ElevenLabs service singleton."""
    global _elevenlabs_service
    if _elevenlabs_service is None:
        _elevenlabs_service = ElevenLabsService()
    return _elevenlabs_service
