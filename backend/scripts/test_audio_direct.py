#!/usr/bin/env python3
"""
Direct Audio Generation Test Script

This script tests ElevenLabs TTS and S3 upload using:
- AWS credentials from ~/.aws/credentials (default chain)
- ElevenLabs API key from ELEVENLABS_API_KEY environment variable

Usage:
    cd /Users/nick/Desktop/code-story-platform/backend
    source venv/bin/activate

    # With environment variable:
    ELEVENLABS_API_KEY=your-key python scripts/test_audio_direct.py

    # Or source your .env file first:
    export $(cat .env | grep -v '^#' | xargs)
    python scripts/test_audio_direct.py
"""

import os
import sys
import uuid
import requests
from datetime import datetime

# Colors for terminal output
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'


def print_header(text):
    print(f"\n{BLUE}{'=' * 60}{NC}")
    print(f"{BLUE}  {text}{NC}")
    print(f"{BLUE}{'=' * 60}{NC}")


def print_step(num, total, text):
    print(f"\n{YELLOW}[{num}/{total}] {text}{NC}")


def print_success(text):
    print(f"  {GREEN}✅ {text}{NC}")


def print_error(text):
    print(f"  {RED}❌ {text}{NC}")


def print_info(text):
    print(f"  {BLUE}ℹ️  {text}{NC}")


def test_audio_generation():
    """Test ElevenLabs TTS and S3 upload."""

    print_header("AUDIO GENERATION FUNCTIONAL TEST")

    # Step 1: Check ElevenLabs API key
    print_step(1, 5, "Checking ElevenLabs API key...")

    elevenlabs_key = os.environ.get('ELEVENLABS_API_KEY')
    if not elevenlabs_key or elevenlabs_key.startswith('your-'):
        print_error("ELEVENLABS_API_KEY not set or is placeholder")
        print_info("Set it with: ELEVENLABS_API_KEY=your-key python scripts/test_audio_direct.py")
        return False

    print_success(f"ElevenLabs API key found ({len(elevenlabs_key)} chars)")

    # Step 2: Check AWS credentials
    print_step(2, 5, "Checking AWS credentials...")

    try:
        import boto3
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print_success(f"AWS Identity: {identity['Arn']}")
    except Exception as e:
        print_error(f"AWS credentials not available: {e}")
        return False

    # Step 3: Generate audio with ElevenLabs
    print_step(3, 5, "Generating audio with ElevenLabs...")

    sample_text = """Welcome to Code Story.
    This is a functional test of the text to speech pipeline.
    We are testing that audio can be generated and uploaded to Amazon S3 successfully.
    If you can hear this message, the audio generation system is working correctly."""

    try:
        # ElevenLabs API endpoint
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

        headers = {
            "xi-api-key": elevenlabs_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        payload = {
            "text": sample_text,
            "model_id": "eleven_flash_v2_5",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }

        print_info(f"Text length: {len(sample_text)} characters")
        print_info("Voice: Rachel")
        print(f"  {YELLOW}⏳ Synthesizing audio (this may take a few seconds)...{NC}")

        response = requests.post(url, headers=headers, json=payload, timeout=60)

        if response.status_code != 200:
            print_error(f"ElevenLabs API error: {response.status_code}")
            print_info(f"Response: {response.text[:200]}")
            return False

        audio_data = response.content
        print_success(f"Audio generated: {len(audio_data)} bytes ({len(audio_data) / 1024:.1f} KB)")

    except Exception as e:
        print_error(f"Audio synthesis failed: {e}")
        return False

    # Step 4: Upload to S3
    print_step(4, 5, "Uploading audio to S3...")

    bucket_name = "code-story-audio"
    test_story_id = f"test-{uuid.uuid4().hex[:8]}"
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_id = str(uuid.uuid4())[:8]
    key = f"audio/{test_story_id}/full_{timestamp}_{file_id}.mp3"

    try:
        s3 = boto3.client('s3', region_name='us-east-1')

        print_info(f"Story ID: {test_story_id}")
        print_info(f"S3 Key: {key}")
        print(f"  {YELLOW}⏳ Uploading to S3...{NC}")

        s3.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=audio_data,
            ContentType="audio/mpeg",
            ACL="public-read",
        )

        audio_url = f"https://{bucket_name}.s3.us-east-1.amazonaws.com/{key}"
        print_success("Upload successful!")
        print_info(f"S3 URL: {audio_url}")

    except Exception as e:
        print_error(f"S3 upload failed: {e}")
        return False

    # Step 5: Verify accessibility
    print_step(5, 5, "Verifying audio file accessibility...")

    try:
        head_response = requests.head(audio_url, timeout=10)

        print_info(f"HTTP Status: {head_response.status_code}")
        content_type = head_response.headers.get('Content-Type', 'unknown')
        content_length = head_response.headers.get('Content-Length', 'unknown')
        print_info(f"Content-Type: {content_type}")
        print_info(f"Content-Length: {content_length} bytes")

        if head_response.status_code == 200:
            if 'audio' in content_type or 'mpeg' in content_type:
                print_success("Audio file verified and accessible!")
            else:
                print(f"  {YELLOW}⚠️ File accessible but unexpected Content-Type: {content_type}{NC}")
        else:
            print_error(f"File not accessible (HTTP {head_response.status_code})")
            return False

    except Exception as e:
        print_error(f"Could not verify file: {e}")
        return False

    # Summary
    print_header("✅ FUNCTIONAL TEST PASSED")
    print(f"\n{GREEN}Results:{NC}")
    print(f"  Audio URL:    {audio_url}")
    print(f"  File Size:    {len(audio_data) / 1024:.1f} KB")
    print(f"  Story ID:     {test_story_id}")
    print(f"  Timestamp:    {datetime.utcnow().isoformat()}")
    print(f"\n  {BLUE}🎧 Open the URL in a browser to listen to the audio{NC}")

    return True


if __name__ == "__main__":
    success = test_audio_generation()
    sys.exit(0 if success else 1)
