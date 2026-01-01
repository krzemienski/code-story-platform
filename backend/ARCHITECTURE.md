# Code Story Platform - Python Backend Architecture

## Overview

This document defines the architecture for migrating the Code Story platform backend from Next.js API routes to a Python-based system using FastAPI, Claude Agent SDK, and Celery.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
│                    React 19 + shadcn/ui + Tailwind CSS 4                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PYTHON BACKEND (FastAPI)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ REST API    │  │ WebSocket   │  │ JWT Auth    │  │ Rate Limiting       │ │
│  │ Endpoints   │  │ Handler     │  │ Middleware  │  │ Middleware          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌───────────────────────┐  ┌───────────────────┐  ┌───────────────────────────┐
│     CELERY WORKER     │  │  REDIS BROKER     │  │     SUPABASE              │
│  ┌─────────────────┐  │  │                   │  │  ┌─────────────────────┐  │
│  │ Story Pipeline  │  │  │  • Task Queue     │  │  │ PostgreSQL          │  │
│  │ Task            │  │  │  • Result Backend │  │  │ • stories           │  │
│  └─────────────────┘  │  │  • WebSocket Pub  │  │  │ • processing_logs   │  │
│                       │  │                   │  │  │ • users             │  │
│  ┌─────────────────┐  │  └───────────────────┘  │  └─────────────────────┘  │
│  │ 4-Agent Claude  │  │                         │                           │
│  │ SDK Pipeline    │  │                         │  ┌─────────────────────┐  │
│  │                 │  │                         │  │ Auth (Supabase)     │  │
│  │ Intent Agent   │  │                         │  └─────────────────────┘  │
│  │      ↓         │  │                         │                           │
│  │ Repo Analyzer  │  │                         └───────────────────────────┘
│  │      ↓         │  │
│  │ Story Architect│  │                         ┌───────────────────────────┐
│  │      ↓         │  │                         │     AWS S3                │
│  │ Voice Director │──┼────────────────────────▶│  • Audio files (.mp3)     │
│  └─────────────────┘  │                         │  • Cover images           │
└───────────────────────┘                         └───────────────────────────┘
                                      │
                                      ▼
                         ┌───────────────────────────┐
                         │     EXTERNAL SERVICES     │
                         │  • GitHub API             │
                         │  • ElevenLabs TTS         │
                         │  • RepoMix (subprocess)   │
                         └───────────────────────────┘
```

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   ├── config.py               # Environment configuration
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── stories.py      # Story CRUD endpoints
│   │   │   ├── intent.py       # Chat intent endpoint
│   │   │   └── health.py       # Health check
│   │   └── websocket/
│   │       ├── __init__.py
│   │       └── progress.py     # WebSocket progress handler
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── story.py            # Story Pydantic models
│   │   ├── intent.py           # Intent request/response models
│   │   └── processing_log.py   # Log models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase.py         # Supabase client
│   │   ├── s3.py               # S3 upload service
│   │   └── elevenlabs.py       # ElevenLabs TTS service
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py             # Base agent class
│   │   ├── intent_agent.py     # Intent extraction agent
│   │   ├── repo_analyzer.py    # Repository analysis agent
│   │   ├── story_architect.py  # Narrative generation agent
│   │   └── voice_director.py   # Audio synthesis agent
│   │
│   └── tasks/
│       ├── __init__.py
│       ├── celery_app.py       # Celery configuration
│       └── story_pipeline.py   # Async story generation task
│
├── tests/
│   └── functional/
│       └── test_api.sh         # Bash/curl functional tests
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## API Contract (Frontend Compatibility)

### 1. Generate Story
**Endpoint:** `POST /api/stories/generate`

**Request:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "style": "documentary",       // documentary, tutorial, podcast, fiction, technical
  "duration": 10,               // 5, 10, 15, 20 minutes
  "voice": "Rachel",            // Rachel, Drew, Bella, Antoni
  "focusAreas": ["architecture", "api"],
  "technicalDepth": "intermediate"  // beginner, intermediate, advanced
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Story generation started"
}
```

### 2. Get Story Status
**Endpoint:** `GET /api/stories/{story_id}`

**Response:**
```json
{
  "id": "uuid",
  "repo_url": "https://github.com/owner/repo",
  "repo_name": "owner/repo",
  "status": "analyzing",        // pending, analyzing, generating, synthesizing, completed, failed
  "progress": 35,
  "style": "documentary",
  "duration_minutes": 10,
  "audio_url": null,            // Populated when completed
  "audio_chunks": [],           // Array of chunk URLs for long audio
  "chapters": [],               // Chapter breakdown
  "cover_url": null,
  "created_at": "2025-12-31T23:00:00Z",
  "updated_at": "2025-12-31T23:01:00Z",
  "error_message": null
}
```

### 3. Restart Story
**Endpoint:** `POST /api/stories/{story_id}/restart`

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Story generation restarted"
}
```

### 4. Chat Intent
**Endpoint:** `POST /api/chat/intent`

**Request:**
```json
{
  "message": "I want to understand the Next.js routing system",
  "repoUrl": "https://github.com/vercel/next.js"
}
```

**Response (streaming):**
```json
{
  "intent": {
    "focusAreas": ["routing", "app-router"],
    "technicalDepth": "intermediate",
    "style": "tutorial",
    "suggestedDuration": 10
  },
  "message": "I'll focus on the App Router architecture..."
}
```

### 5. WebSocket Progress
**Endpoint:** `WS /ws/stories/{story_id}/progress`

**Server Messages:**
```json
{
  "type": "log",
  "data": {
    "agent_name": "Analyzer",
    "action": "Scanning repository structure",
    "details": {"files": 247},
    "level": "info",
    "timestamp": "2025-12-31T23:01:15Z"
  }
}
```

```json
{
  "type": "status",
  "data": {
    "status": "generating",
    "progress": 55
  }
}
```

```json
{
  "type": "complete",
  "data": {
    "audio_url": "https://s3.../audio.mp3",
    "audio_chunks": ["https://s3.../chunk1.mp3", "https://s3.../chunk2.mp3"],
    "duration": 623
  }
}
```

## Claude Agent SDK Pipeline

### Agent Configuration

All agents use **Claude Opus 4.5** with extended thinking:

```python
from anthropic import Anthropic

client = Anthropic()

def create_opus_response(system_prompt: str, messages: list, max_tokens: int = 16000):
    """Create a response using Claude Opus 4.5 with high effort extended thinking."""
    return client.messages.create(
        model="claude-opus-4-5-20251101",
        max_tokens=max_tokens,
        thinking={
            "type": "enabled",
            "budget_tokens": 10000
        },
        system=system_prompt,
        messages=messages,
        betas=["interleaved-thinking-2025-05-14"]
    )
```

### Agent 1: Intent Agent

**Purpose:** Extract user intent and preferences from natural language.

**Tools:**
- `parse_github_url`: Validate and parse GitHub repository URL
- `suggest_focus_areas`: Analyze repo and suggest relevant focus areas
- `estimate_duration`: Estimate story duration based on repo complexity

**Output:**
```python
@dataclass
class IntentResult:
    repo_url: str
    repo_owner: str
    repo_name: str
    focus_areas: list[str]
    technical_depth: str  # beginner, intermediate, advanced
    style: str            # documentary, tutorial, podcast, fiction, technical
    duration_minutes: int
    custom_instructions: str | None
```

### Agent 2: Repo Analyzer

**Purpose:** Deep analysis of repository structure, patterns, and key components.

**Tools:**
- `run_repomix`: Execute RepoMix to get consolidated repo view
- `fetch_github_metadata`: Get stars, forks, contributors, languages
- `read_key_files`: Read README, package.json, key source files
- `analyze_dependencies`: Parse and categorize dependencies
- `identify_architecture`: Detect architectural patterns

**Output:**
```python
@dataclass
class AnalysisResult:
    repo_metadata: dict           # GitHub API metadata
    file_structure: dict          # Directory tree
    key_files: dict[str, str]     # Important file contents
    dependencies: list[dict]      # Parsed dependencies
    architecture_patterns: list[str]
    tech_stack: list[str]
    complexity_score: float       # 0.0 - 1.0
    suggested_chapters: list[str]
```

### Agent 3: Story Architect

**Purpose:** Generate narrative script with chapters and timestamps.

**Tools:**
- `create_outline`: Generate chapter outline
- `write_chapter`: Write individual chapter content
- `add_code_examples`: Insert relevant code snippets
- `calculate_timing`: Estimate reading time per section

**Output:**
```python
@dataclass
class Chapter:
    title: str
    content: str          # Narrative text
    code_examples: list[dict]
    duration_seconds: int
    timestamp_start: int

@dataclass
class StoryScript:
    title: str
    summary: str
    chapters: list[Chapter]
    total_duration_seconds: int
    word_count: int
```

### Agent 4: Voice Director

**Purpose:** Synthesize audio from script using ElevenLabs.

**Tools:**
- `synthesize_chunk`: Generate audio for a text chunk
- `upload_to_s3`: Upload audio file to S3
- `concatenate_audio`: Merge audio chunks (if needed)
- `generate_cover`: Create cover image for the story

**Output:**
```python
@dataclass
class AudioResult:
    audio_url: str
    audio_chunks: list[str]  # For long stories
    duration_seconds: int
    cover_url: str | None
    voice_used: str
```

## Celery Task Configuration

### celery_app.py

```python
from celery import Celery

app = Celery('code_story')

app.conf.update(
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
    broker_transport_options={
        'visibility_timeout': 43200  # 12 hours for long-running tasks
    },
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,       # 1 hour max
    task_soft_time_limit=3300,  # 55 min soft limit
    worker_prefetch_multiplier=1,  # One task at a time
    task_routes={
        'tasks.story_pipeline.*': {'queue': 'story_generation'}
    }
)
```

### story_pipeline.py

```python
from celery import shared_task
from app.agents import IntentAgent, RepoAnalyzer, StoryArchitect, VoiceDirector
from app.services.supabase import update_story_status, insert_processing_log

@shared_task(bind=True, max_retries=2)
def generate_story(self, story_id: str, request_data: dict):
    """
    Main story generation pipeline task.

    Status flow: pending → analyzing → generating → synthesizing → completed/failed
    """
    try:
        # Phase 1: Intent Analysis
        update_story_status(story_id, 'analyzing', progress=5)
        insert_processing_log(story_id, 'Intent', 'Parsing user request', 'info')

        intent_agent = IntentAgent()
        intent_result = intent_agent.process(request_data)

        insert_processing_log(story_id, 'Intent', 'Intent extracted', 'success',
                             details={'focus_areas': intent_result.focus_areas})

        # Phase 2: Repository Analysis
        update_story_status(story_id, 'analyzing', progress=15)
        insert_processing_log(story_id, 'Analyzer', 'Starting repository analysis', 'info')

        analyzer = RepoAnalyzer()
        analysis_result = analyzer.process(intent_result)

        insert_processing_log(story_id, 'Analyzer', 'Analysis complete', 'success',
                             details={'files_analyzed': len(analysis_result.key_files)})

        # Phase 3: Story Generation
        update_story_status(story_id, 'generating', progress=40)
        insert_processing_log(story_id, 'Architect', 'Generating narrative', 'info')

        architect = StoryArchitect()
        script = architect.process(intent_result, analysis_result)

        insert_processing_log(story_id, 'Architect', 'Script complete', 'success',
                             details={'chapters': len(script.chapters), 'words': script.word_count})

        # Phase 4: Audio Synthesis
        update_story_status(story_id, 'synthesizing', progress=70)
        insert_processing_log(story_id, 'Synthesizer', 'Generating audio', 'info')

        voice_director = VoiceDirector()
        audio_result = voice_director.process(script, request_data.get('voice', 'Rachel'))

        insert_processing_log(story_id, 'Synthesizer', 'Audio complete', 'success',
                             details={'duration': audio_result.duration_seconds})

        # Finalize
        update_story_status(
            story_id,
            'completed',
            progress=100,
            audio_url=audio_result.audio_url,
            audio_chunks=audio_result.audio_chunks,
            chapters=[c.__dict__ for c in script.chapters],
            cover_url=audio_result.cover_url,
            duration_seconds=audio_result.duration_seconds
        )

        insert_processing_log(story_id, 'System', 'Story generation complete', 'success')

        return {'status': 'completed', 'story_id': story_id}

    except Exception as e:
        update_story_status(story_id, 'failed', error_message=str(e))
        insert_processing_log(story_id, 'System', f'Error: {str(e)}', 'error')
        raise self.retry(exc=e, countdown=60)  # Retry after 1 minute
```

## ElevenLabs Voice Configuration

```python
VOICE_IDS = {
    "Rachel": "21m00Tcm4TlvDq8ikWAM",
    "Drew": "29vD33N1CtxCmqQRPOHJ",
    "Bella": "EXAVITQu4vr4xnSDxMaL",
    "Antoni": "ErXwobaYiN019PkySvjV"
}

ELEVENLABS_CONFIG = {
    "model_id": "eleven_flash_v2_5",
    "output_format": "mp3_44100_128",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
        "use_speaker_boost": True
    }
}
```

## Environment Variables

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Anthropic
ANTHROPIC_API_KEY=xxx

# ElevenLabs
ELEVENLABS_API_KEY=xxx

# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=code-story-audio
AWS_REGION=us-east-1

# Redis
REDIS_URL=redis://localhost:6379/0

# GitHub (optional, for higher rate limits)
GITHUB_TOKEN=xxx
```

## Functional Validation Gates

Per user specification, validation uses **curl/bash commands** (no test files):

### Gate 1: API Health
```bash
# Verify FastAPI is running
curl -s http://localhost:8000/api/health | jq '.status == "healthy"'
```

### Gate 2: Story Generation
```bash
# Create a story
STORY_ID=$(curl -s -X POST http://localhost:8000/api/stories/generate \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/expressjs/express",
    "style": "documentary",
    "duration": 5,
    "voice": "Rachel"
  }' | jq -r '.id')

echo "Story ID: $STORY_ID"
```

### Gate 3: Status Polling
```bash
# Poll until complete (max 5 minutes)
for i in {1..150}; do
  STATUS=$(curl -s "http://localhost:8000/api/stories/$STORY_ID" | jq -r '.status')
  echo "Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo "Story completed!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Story failed!"
    exit 1
  fi

  sleep 2
done
```

### Gate 4: Audio Verification
```bash
# Verify audio URL exists and is accessible
AUDIO_URL=$(curl -s "http://localhost:8000/api/stories/$STORY_ID" | jq -r '.audio_url')
curl -s -I "$AUDIO_URL" | grep "200 OK"
```

### Gate 5: Intent Chat
```bash
# Test intent extraction
curl -s -X POST http://localhost:8000/api/chat/intent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain the routing system",
    "repoUrl": "https://github.com/vercel/next.js"
  }' | jq '.intent'
```

### Gate 6: Playwright E2E (Browser)
```bash
# Run as actual end-user through browser
# 1. Login with Supabase auth
# 2. Navigate to generate page
# 3. Submit GitHub URL
# 4. Wait for audio generation
# 5. Play audio and verify playback
npx playwright test e2e/story-generation.spec.ts
```

## Docker Configuration

### Dockerfile
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install RepoMix globally
RUN npm install -g repomix

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    volumes:
      - .:/app

  worker:
    build: .
    command: celery -A app.tasks.celery_app worker --loglevel=info -Q story_generation
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - api

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Next Steps

1. **Phase 4: Implementation** - Build the actual Python code following this architecture
2. **Phase 5: Validation** - Run curl/bash functional gates
3. **Phase 6: Integration** - Connect frontend to new Python backend
