# CLAUDE.md

This file provides guidance to Claude Code when working with the Code Tales platform.

## Project Overview

**Code Tales** transforms GitHub repositories into immersive audio stories using AI. The platform analyzes repository structure, generates narrative scripts with Claude, and synthesizes audio with ElevenLabs TTS.

**Live Site**: [codetale.ai](https://codetale.ai)

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui (Radix primitives) |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Auth** | Supabase Auth (SSR) |
| **AI** | Anthropic Claude (AI SDK), ElevenLabs TTS |
| **Storage** | Supabase Storage (audio chunks) |
| **Package Manager** | pnpm |

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
│   ├── supabase/             # DB clients
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── service.ts        # Service role (bypasses RLS)
│   ├── audio-player-context.tsx  # Global audio state
│   └── types.ts              # TypeScript types
├── scripts/                  # SQL migrations (001-007)
└── styles/                   # Global CSS
\`\`\`

## Quick Commands

\`\`\`bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm start        # Start production server
\`\`\`

## Architecture: Multi-Agent Pipeline

\`\`\`
GitHub URL → Analyzer Agent → Narrator Agent → Synthesizer Agent → Audio
                 │                  │                  │
           Fetch tree &       Generate script    ElevenLabs TTS
           metadata           with Claude        (chunked upload)
\`\`\`

### Key Flow (`app/api/stories/generate/route.ts`)

1. **Analyzer**: Fetches repo tree, README, languages, package.json
2. **Narrator**: Claude generates script based on style & duration
3. **Synthesizer**: ElevenLabs converts to audio, uploads chunks to Supabase Storage

## Database Schema

Core tables in Supabase (see `scripts/001_create_codestory_tables.sql`):

- `profiles` - User profiles (extends auth.users)
- `code_repositories` - Cached repo analysis
- `stories` - Generated stories with audio_chunks array
- `processing_logs` - Real-time generation progress

**RLS**: All tables have row-level security. Use `lib/supabase/service.ts` for admin operations.

## Narrative Styles

Defined in `lib/agents/prompts.ts`:

| Style | Use Case |
|-------|----------|
| `fiction` | Dramatic storytelling, code as living world |
| `documentary` | Authoritative architecture exploration |
| `tutorial` | Educational walkthrough |
| `podcast` | Casual conversation style |
| `technical` | Deep-dive with file paths |

## Environment Variables

\`\`\`env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ELEVENLABS_API_KEY=

# Optional
GITHUB_TOKEN=              # For private repos
\`\`\`

## Code Patterns

### Supabase Client Selection

\`\`\`typescript
// Browser components
import { createClient } from "@/lib/supabase/client"

// Server components/actions
import { createClient } from "@/lib/supabase/server"

// API routes needing RLS bypass
import { createServiceClient } from "@/lib/supabase/service"
\`\`\`

### Audio Chunking

Long scripts are split into ~8000 char chunks for reliable TTS processing. Chunks stored in `story.audio_chunks` array, merged on download.

### Global Audio Player

`lib/audio-player-context.tsx` provides:
- `useAudioPlayer()` hook for play/pause/queue
- Persists across page navigation
- Handles multi-chunk playback seamlessly

## Testing & Quality

- TypeScript strict mode enabled
- ESLint for code quality
- No test framework currently configured

## Common Tasks

### Add New Narrative Style

1. Add prompt in `lib/agents/prompts.ts`
2. Update style type in `lib/types.ts`
3. Add UI option in story generator component

### Modify Generation Pipeline

Main logic in `app/api/stories/generate/route.ts`. Processing logs sent via `lib/agents/log-helper.ts`.

### Add New UI Component

Use shadcn/ui CLI or create in `components/ui/`. Follow existing patterns with Radix primitives.

## Deployment

Deployed on Vercel. Database migrations run manually via Supabase SQL editor.

## Links

- [GitHub Repository](https://github.com/krzemienski/code-story-platform)
- [README](./README.md) - Full documentation
- [Supabase Dashboard](https://supabase.com/dashboard)
