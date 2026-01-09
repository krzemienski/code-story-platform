# CLAUDE.md

This file provides comprehensive guidance for AI assistants (Claude, Cursor, GitHub Copilot) working with the Code Tales platform.

## Project Overview

**Code Tales** transforms GitHub repositories into immersive audio stories using AI. The platform analyzes repository structure, generates narrative scripts with Claude, and synthesizes audio with ElevenLabs TTS.

- **Live Site**: [codetale.ai](https://codetale.ai)
- **Repository**: [github.com/krzemienski/code-story-platform](https://github.com/krzemienski/code-story-platform)

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui (Radix primitives) |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Auth** | Supabase Auth |
| **AI** | Anthropic Claude (via AI SDK), ElevenLabs TTS |
| **Storage** | Supabase Storage (audio chunks) |
| **Package Manager** | pnpm |

## Architecture Overview

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                     CODE TALES ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND (Next.js App Router)                                   │
│  ├── app/page.tsx              → Landing page                    │
│  ├── app/dashboard/            → User dashboard (protected)      │
│  ├── app/discover/             → Public story browser            │
│  └── app/story/[id]/           → Public story player             │
│                                                                  │
│  API ROUTES                                                      │
│  ├── /api/stories/generate     → Main generation pipeline        │
│  ├── /api/stories/[id]         → CRUD operations                 │
│  ├── /api/stories/[id]/restart → Restart failed generation       │
│  └── /api/chat/intent          → Conversation agent              │
│                                                                  │
│  SERVICES (lib/)                                                 │
│  ├── agents/github.ts          → Repository analysis             │
│  ├── agents/prompts.ts         → Narrative style prompts         │
│  ├── generation/modes.ts       → Hybrid vs Studio modes          │
│  ├── ai/provider.ts            → Multi-model abstraction         │
│  └── supabase/                 → Database clients                │
│                                                                  │
│  DATA LAYER (Supabase)                                           │
│  ├── profiles                  → User profiles                   │
│  ├── code_repositories         → Cached repo analysis            │
│  ├── stories                   → Generated tales                 │
│  └── processing_logs           → Real-time progress              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## Project Structure

\`\`\`
code-story-platform/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── stories/          # Story CRUD & generation
│   │   │   ├── generate/     # Main AI pipeline
│   │   │   └── [id]/         # Story operations
│   │   └── chat/intent/      # Conversation agent
│   ├── auth/                 # Auth pages
│   ├── dashboard/            # Protected user area
│   ├── discover/             # Public story browser
│   └── story/[id]/           # Public story player
├── components/               # React components
│   ├── ui/                   # shadcn/ui primitives
│   ├── floating-player.tsx   # Global audio player
│   ├── story-generator.tsx   # Generation form
│   └── chronicle-card.tsx    # Story card component
├── lib/
│   ├── agents/               # AI agent logic
│   │   ├── github.ts         # Repo analysis
│   │   ├── prompts.ts        # Narrative prompts
│   │   └── log-helper.ts     # Processing logs
│   ├── ai/                   # AI model layer
│   │   ├── models.ts         # Model definitions
│   │   └── provider.ts       # Multi-model provider
│   ├── generation/           # Generation modes
│   │   ├── modes.ts          # Hybrid vs Studio
│   │   └── elevenlabs-studio.ts
│   ├── supabase/             # DB clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── service.ts        # Service role (bypasses RLS)
│   ├── audio-player-context.tsx  # Global audio state
│   └── types.ts              # TypeScript types
├── scripts/                  # SQL migrations (001-007)
├── docs/                     # Additional documentation
└── Makefile                  # Build commands
\`\`\`

## Quick Commands

\`\`\`bash
# Development
make dev              # Start dev server (localhost:3000)
make install          # Install dependencies
make lint             # Run ESLint

# Production
make build            # Production build
make start            # Start production server

# Docker
make docker-build     # Build Docker image
make docker-up        # Start with docker-compose
make docker-down      # Stop containers
make docker-logs      # View logs

# Database
make db-types         # Generate TypeScript types from Supabase
\`\`\`

## Generation Pipeline

The main generation flow in `app/api/stories/generate/route.ts`:

\`\`\`
1. ANALYZER AGENT
   └── Fetch repo tree, README, languages, package.json
   └── Identify key directories and patterns
   └── Cache analysis in code_repositories table

2. NARRATOR AGENT
   └── Select narrative style (fiction/documentary/tutorial/podcast/technical)
   └── Calculate tokens based on duration (150 words/min)
   └── Generate script with Claude

3. SYNTHESIZER AGENT
   └── Split script into ~8000 char chunks
   └── Generate audio with ElevenLabs TTS
   └── Upload chunks to Supabase Storage

4. FINALIZATION
   └── Update story status to 'completed'
   └── Set audio_url and audio_chunks array
   └── Make public for virality (is_public = true)
\`\`\`

## Database Schema

Core tables (see `scripts/001_create_codestory_tables.sql`):

\`\`\`sql
-- User profiles (extends auth.users)
profiles (id, email, name, subscription_tier, usage_quota)

-- Cached repository data
code_repositories (id, user_id, repo_url, repo_owner, repo_name, 
                   primary_language, stars_count, analysis_cache)

-- Generated stories
stories (id, user_id, repository_id, title, narrative_style,
         target_duration_minutes, actual_duration_seconds,
         script_text, audio_url, audio_chunks, status, progress,
         is_public, play_count, generation_mode, model_config)

-- Processing logs for real-time UI
processing_logs (id, story_id, agent_type, message, details, level)
\`\`\`

**Important**: All tables have Row Level Security (RLS) enabled. Use `lib/supabase/service.ts` for admin operations that bypass RLS.

## Narrative Styles

Defined in `lib/agents/prompts.ts`:

| Style | Description | Voice Settings |
|-------|-------------|----------------|
| `fiction` | Dramatic storytelling, code as living world | stability: 0.35, similarity: 0.8 |
| `documentary` | Authoritative architecture exploration | stability: 0.5, similarity: 0.85 |
| `tutorial` | Educational walkthrough | stability: 0.6, similarity: 0.75 |
| `podcast` | Casual conversation style | stability: 0.4, similarity: 0.8 |
| `technical` | Deep-dive with file paths | stability: 0.7, similarity: 0.9 |

## Generation Modes

Defined in `lib/generation/modes.ts`:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Hybrid** | Claude generates script, ElevenLabs synthesizes | Fiction, tutorials, technical |
| **Full Studio** | ElevenLabs GenFM handles both | Podcast-style content |

## Environment Variables

\`\`\`env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ELEVENLABS_API_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
GITHUB_TOKEN=ghp_...              # For private repos
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

## Code Patterns

### Supabase Client Selection

\`\`\`typescript
// Browser components - uses cookies for auth
import { createClient } from "@/lib/supabase/client"

// Server components/actions - reads cookies
import { createClient } from "@/lib/supabase/server"

// API routes needing RLS bypass - service role
import { createServiceClient } from "@/lib/supabase/service"
\`\`\`

### Audio Chunking

Long scripts are split into ~8000 char chunks for reliable TTS processing:

\`\`\`typescript
const chunks = splitTextIntoChunks(script, 8000)
// Chunks stored in story.audio_chunks array
// Merged on download via /api/stories/[id]/download
\`\`\`

### Global Audio Player

`lib/audio-player-context.tsx` provides:
- `useAudioPlayer()` hook for play/pause/queue
- Persists across page navigation
- Handles multi-chunk playback seamlessly

### Processing Logs

Real-time progress updates via `lib/agents/log-helper.ts`:

\`\`\`typescript
await addProcessingLog(supabase, storyId, {
  agent_type: "narrator",
  message: "Generating script...",
  level: "info"
})
\`\`\`

## Common Tasks

### Add New Narrative Style

1. Add prompt in `lib/agents/prompts.ts`
2. Update `NarrativeStyle` type in `lib/types.ts`
3. Add UI option in `components/story-generator.tsx`
4. Configure voice settings in `lib/generation/modes.ts`

### Modify Generation Pipeline

Main logic in `app/api/stories/generate/route.ts`. Key functions:
- `analyzeRepository()` - GitHub analysis
- `generateScript()` - Claude script generation
- `synthesizeAudio()` - ElevenLabs TTS

### Add New AI Model

1. Add model definition in `lib/ai/models.ts`
2. Update provider in `lib/ai/provider.ts`
3. Add UI option in `components/model-selector.tsx`

### Debug Generation Issues

1. Check `processing_logs` table for real-time progress
2. Look for `status: 'failed'` stories with `error_message`
3. Use restart endpoint: POST `/api/stories/[id]/restart`

## Status Values

The `stories.status` column uses these values:

| Status | Description |
|--------|-------------|
| `pending` | Story created, waiting to start |
| `analyzing` | Fetching and analyzing repository |
| `generating` | Claude generating script |
| `synthesizing` | ElevenLabs generating audio |
| `completed` | Successfully finished |
| `failed` | Error occurred (check error_message) |

**Important**: Always use `"completed"` (not `"complete"`) to match the database.

## Troubleshooting

### "Configure" Prompt Appearing
- SQL scripts in `/scripts` folder trigger v0 to prompt for execution
- Database is already set up - scripts are idempotent, safe to skip

### Tales Not Showing
- Check `is_public = true` in stories table
- Verify RLS policies allow public read access
- Check status is `'completed'` not `'complete'`

### Audio Not Playing
- Verify `audio_url` or `audio_chunks` array is populated
- Check Supabase Storage bucket policies
- Ensure chunks are uploaded to `story-audio` bucket

### Generation Stuck
- Check `processing_logs` for last activity
- Restart with POST `/api/stories/[id]/restart`
- Look for timeout errors in server logs

## Links

- [README](./README.md) - Full documentation with diagrams
- [ElevenLabs Analysis](./docs/ELEVENLABS-CLAUDE-ANALYSIS.md) - Generation mode comparison
- [Repository Analysis](./docs/REPOSITORY-ANALYSIS-PROCEDURE.md) - Analysis procedure
- [Supabase Dashboard](https://supabase.com/dashboard)
\`\`\`

\`\`\`makefile file="Makefile"
# Code Tales Platform - Makefile
# ================================
# Quick commands for development, building, and deployment

.PHONY: help install dev build start lint clean docker-build docker-up docker-down docker-logs db-types

# Default target
help:
	@echo "Code Tales Platform - Available Commands"
	@echo "========================================="
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install dependencies with pnpm"
	@echo "  make dev          - Start development server (localhost:3000)"
	@echo "  make lint         - Run ESLint"
	@echo "  make clean        - Remove node_modules and .next"
	@echo ""
	@echo "Production:"
	@echo "  make build        - Create production build"
	@echo "  make start        - Start production server"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start with docker-compose"
	@echo "  make docker-down  - Stop docker-compose"
	@echo "  make docker-logs  - View container logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-types     - Generate TypeScript types from Supabase"
	@echo ""

# ================================
# Development
# ================================

install:
	@echo "Installing dependencies..."
	pnpm install

dev:
	@echo "Starting development server..."
	pnpm dev

lint:
	@echo "Running ESLint..."
	pnpm lint

clean:
	@echo "Cleaning build artifacts..."
	rm -rf node_modules .next .turbo
	@echo "Done. Run 'make install' to reinstall dependencies."

# ================================
# Production
# ================================

build:
	@echo "Creating production build..."
	pnpm build

start:
	@echo "Starting production server..."
	pnpm start

# ================================
# Docker
# ================================

docker-build:
	@echo "Building Docker image..."
	docker-compose build

docker-up:
	@echo "Starting containers..."
	docker-compose up -d
	@echo ""
	@echo "Frontend available at: http://localhost:3001"

docker-down:
	@echo "Stopping containers..."
	docker-compose down

docker-logs:
	docker-compose logs -f frontend

docker-restart: docker-down docker-up

# ================================
# Database
# ================================

db-types:
	@echo "Generating TypeScript types from Supabase..."
	@if [ -z "$$SUPABASE_PROJECT_ID" ]; then \
		echo "Error: SUPABASE_PROJECT_ID environment variable not set"; \
		echo "Usage: SUPABASE_PROJECT_ID=your_project_id make db-types"; \
		exit 1; \
	fi
	npx supabase gen types typescript --project-id $$SUPABASE_PROJECT_ID > lib/database.types.ts
	@echo "Types generated at lib/database.types.ts"

# ================================
# Quick Setup (for new developers)
# ================================

setup: install
	@echo ""
	@echo "Setup complete! Next steps:"
	@echo "1. Copy .env.example to .env.local"
	@echo "2. Fill in your Supabase and API credentials"
	@echo "3. Run 'make dev' to start development"
	@echo ""

# ================================
# CI/CD Helpers
# ================================

ci-check: lint build
	@echo "CI checks passed!"

# ================================
# Utility
# ================================

# Check if required tools are installed
check-deps:
	@command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required but not installed. Run: npm install -g pnpm"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
	@echo "All dependencies available!"
