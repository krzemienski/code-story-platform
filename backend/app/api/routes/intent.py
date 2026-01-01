"""Intent extraction chat endpoint."""

import json
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from anthropic import Anthropic

from app.config import get_settings
from app.models.intent import IntentChatRequest, ExtractedIntent
from app.models.story import StoryStyle, TechnicalDepth

router = APIRouter()

# System prompt for intent extraction
INTENT_EXTRACTION_PROMPT = """You are an AI assistant helping users configure their code story preferences.

Your job is to understand what the user wants from their code story and extract:
1. Focus areas - What parts of the codebase they want to learn about (e.g., authentication, API, database, frontend, architecture)
2. Technical depth - How technical the explanation should be:
   - beginner: Simple explanations, no jargon, focus on concepts
   - intermediate: Some technical terms, balanced explanation
   - advanced: Deep technical details, architecture patterns, implementation specifics
3. Style - The narrative style they prefer:
   - documentary: Objective, educational narration like a documentary
   - tutorial: Step-by-step walkthrough style
   - podcast: Conversational, casual explanation
   - fiction: Creative storytelling with the code as the plot
   - technical: Pure technical documentation style
4. Duration - How long they want the story (5, 10, 15, or 20 minutes)

Engage in natural conversation to understand their needs. When you have enough information,
include a JSON block in your response with the extracted intent:

```json
{
  "focusAreas": ["area1", "area2"],
  "technicalDepth": "intermediate",
  "style": "documentary",
  "suggestedDuration": 10
}
```

Be helpful and conversational. Ask clarifying questions if needed."""


def create_intent_stream(
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    """Create a streaming response for intent extraction."""
    settings = get_settings()
    client = Anthropic(api_key=settings.anthropic_api_key)

    # Build conversation history
    anthropic_messages = []
    for msg in messages:
        anthropic_messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })

    async def generate():
        with client.messages.stream(
            model="claude-sonnet-4-20250514",  # Use Sonnet for chat
            max_tokens=1024,
            system=INTENT_EXTRACTION_PROMPT,
            messages=anthropic_messages,
        ) as stream:
            for text in stream.text_stream:
                # Send as SSE format
                yield f"data: {json.dumps({'content': text})}\n\n"

        yield "data: [DONE]\n\n"

    return generate()


@router.post("/intent")
async def extract_intent(request: IntentChatRequest) -> StreamingResponse:
    """
    Chat endpoint for extracting user intent for story generation.

    Uses Claude to have a conversation with the user and extract their
    preferences for the code story (focus areas, technical depth, style, duration).

    Returns a streaming response with SSE format.
    """
    # Build messages list with conversation history + current message
    messages = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
    messages.append({"role": "user", "content": request.message})

    stream = create_intent_stream(messages=messages)

    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
