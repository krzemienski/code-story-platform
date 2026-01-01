# Code Story Backend

Python backend for the Code Story platform - transforms GitHub repositories into engaging audio narratives using Claude AI and ElevenLabs voice synthesis.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Code Story Backend                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │   FastAPI   │────│   Celery    │────│    Redis    │                  │
│  │   REST API  │    │   Workers   │    │   Broker    │                  │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘                  │
│         │                  │                                             │
│         │    ┌─────────────┴─────────────┐                              │
│         │    │     4-Agent Pipeline       │                              │
│         │    ├────────────────────────────┤                              │
│         │    │ Intent → Analyzer → Architect → Voice                     │
│         │    │    ↓         ↓          ↓         ↓                       │
│         │    │  Goals    RepoMix    Script    Polish                     │
│         │    └────────────────────────────┘                              │
│         │                  │                                             │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌─────────────┐                  │
│  │  Supabase   │    │  ElevenLabs │    │   AWS S3    │                  │
│  │  Database   │    │    TTS      │    │   Storage   │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

- **API Framework**: FastAPI 0.115
- **AI Engine**: Claude Opus 4.5 with Extended Thinking
- **Voice Synthesis**: ElevenLabs (eleven_flash_v2_5)
- **Task Queue**: Celery 5.4 with Redis
- **Database**: Supabase (PostgreSQL)
- **Storage**: AWS S3
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+ (for RepoMix)
- Docker & Docker Compose
- API Keys: Anthropic, ElevenLabs, AWS, Supabase

### Setup

1. **Clone and configure environment**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start all services**:
   ```bash
   ./scripts/dev.sh start
   ```

3. **Validate the API**:
   ```bash
   ./scripts/dev.sh validate
   ```

### Development Mode

For local development without Docker:

```bash
# Install dependencies
./scripts/dev.sh setup

# Start Redis (requires Docker)
./scripts/dev.sh redis

# Terminal 1: Start API
./scripts/dev.sh api

# Terminal 2: Start Celery worker
./scripts/dev.sh worker

# Terminal 3: Validate
./scripts/dev.sh validate
```

## API Endpoints

### Health Check

```bash
curl http://localhost:8000/api/health
```

### Generate Story

```bash
curl -X POST http://localhost:8000/api/stories/generate \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/anthropics/anthropic-cookbook",
    "style": "tutorial",
    "durationMinutes": 5,
    "voice": "rachel",
    "focusAreas": ["getting started"],
    "technicalDepth": "beginner"
  }'
```

### Check Story Status

```bash
curl http://localhost:8000/api/stories/{story_id}
```

### Extract Intent (Streaming)

```bash
curl -X POST http://localhost:8000/api/intent \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "I want to understand authentication",
    "repoUrl": "https://github.com/user/repo",
    "conversationHistory": []
  }'
```

### Restart Failed Story

```bash
curl -X POST http://localhost:8000/api/stories/{story_id}/restart
```

### WebSocket Progress

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/stories/{story_id}/progress');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## API Validation

The validation script tests all endpoints with curl/bash:

```bash
# Full validation suite
./scripts/validate.sh

# Against custom URL
./scripts/validate.sh http://localhost:8000
```

### Validation Gates

| Gate | Endpoint | Test |
|------|----------|------|
| 1 | GET /api/health | Health check returns 200 |
| 2 | POST /api/stories/generate | Story creation succeeds |
| 3 | GET /api/stories/{id} | Status polling works |
| 4 | POST /api/intent | Streaming SSE responds |
| 5 | POST /api/stories/generate | Invalid data returns 422 |
| 6 | POST /api/stories/{id}/restart | Restart endpoint works |
| 7 | GET /api/stories/invalid | Returns 404 |
| 8 | GET /docs | OpenAPI docs accessible |

## 4-Agent Pipeline

The story generation uses four specialized Claude agents:

1. **Intent Agent** (5-15% progress)
   - Validates and refines user intent
   - Extracts focus areas and goals
   - Determines narrative approach

2. **Analyzer Agent** (15-50% progress)
   - Runs RepoMix on the repository
   - Identifies key components and architecture
   - Creates structured analysis

3. **Architect Agent** (50-70% progress)
   - Creates narrative script
   - Structures chapters and flow
   - Targets ~150 words/minute for duration

4. **Voice Agent** (70-75% progress)
   - Polishes script for voice synthesis
   - Optimizes for natural speech
   - Adds prosody markers

After the pipeline, ElevenLabs synthesizes audio (75-100% progress).

## Project Structure

```
backend/
├── app/
│   ├── agents/           # 4-agent Claude pipeline
│   │   ├── base.py       # Base agent with extended thinking
│   │   ├── intent_agent.py
│   │   ├── analyzer_agent.py
│   │   ├── architect_agent.py
│   │   ├── voice_agent.py
│   │   └── pipeline.py   # Pipeline orchestrator
│   ├── api/
│   │   ├── routes/       # API endpoints
│   │   │   ├── health.py
│   │   │   ├── stories.py
│   │   │   └── intent.py
│   │   └── websocket.py  # Real-time updates
│   ├── models/           # Pydantic models
│   ├── services/         # External integrations
│   │   ├── supabase.py
│   │   ├── elevenlabs.py
│   │   └── s3.py
│   ├── tasks/            # Celery tasks
│   │   ├── celery_app.py
│   │   └── story_pipeline.py
│   ├── config.py         # Settings
│   └── main.py           # FastAPI app
├── scripts/
│   ├── dev.sh            # Development helper
│   └── validate.sh       # API validation
├── Dockerfile            # API container
├── Dockerfile.worker     # Celery container
├── docker-compose.yml    # Full stack
└── requirements.txt
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Supabase project URL | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service key | Yes |
| ANTHROPIC_API_KEY | Claude API key | Yes |
| CLAUDE_MODEL | Model ID (default: claude-opus-4-5-20251101) | No |
| CLAUDE_THINKING_BUDGET | Extended thinking tokens (default: 10000) | No |
| ELEVENLABS_API_KEY | ElevenLabs API key | Yes |
| AWS_ACCESS_KEY_ID | AWS access key | Yes |
| AWS_SECRET_ACCESS_KEY | AWS secret key | Yes |
| AWS_REGION | AWS region (default: us-east-1) | No |
| AWS_S3_BUCKET | S3 bucket name | Yes |
| REDIS_URL | Redis connection URL | Yes |

## Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Start with monitoring (Flower)
docker compose --profile monitoring up -d

# Stop all
docker compose down

# Rebuild after changes
docker compose up -d --build
```

## Troubleshooting

### Redis Connection Error
```bash
docker run -d --name redis-code-story -p 6379:6379 redis:7-alpine
```

### RepoMix Not Found
```bash
npm install -g repomix
```

### Celery Tasks Not Processing
```bash
# Check worker logs
docker compose logs worker

# Restart worker
docker compose restart worker
```

## License

Proprietary - All rights reserved.
