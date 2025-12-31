# Code Story

**Transform code repositories into audio narratives.**

Code Story is an open-source, developer-first platform that analyzes GitHub repositories and generates engaging audio narratives using AI. Unlike generic tools, Code Story is purpose-built for developers who need deep, customizable control over how their code is analyzed and explained.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CODE STORY PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           FRONTEND (Next.js 15)                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  Landing    │  │  Dashboard  │  │  Story      │  │  Player     │     │   │
│  │  │  Page       │  │  /dashboard │  │  Creation   │  │  Component  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                                           │   │
│  │  Components: shadcn/ui + ElevenLabs UI (Orb, Waveform, Conversation)     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                          API ROUTES (Next.js)                             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │   │
│  │  │ /api/chat/      │  │ /api/stories/   │  │ /api/stories/   │          │   │
│  │  │ intent          │  │ generate        │  │ [id]/restart    │          │   │
│  │  │                 │  │                 │  │                 │          │   │
│  │  │ AI Chat for     │  │ Full pipeline   │  │ Restart failed  │          │   │
│  │  │ customization   │  │ orchestration   │  │ generations     │          │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                       AI AGENT PIPELINE                                   │   │
│  │                                                                           │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐ │   │
│  │  │  ANALYZER   │ -> │  ARCHITECT  │ -> │  NARRATOR   │ -> │SYNTHESIZER│ │   │
│  │  │  Agent      │    │  Agent      │    │  Agent      │    │  Agent    │ │   │
│  │  │             │    │             │    │             │    │           │ │   │
│  │  │ - GitHub    │    │ - Dependency│    │ - Script    │    │ - Chunk   │ │   │
│  │  │   API       │    │   graph     │    │   generation│    │   text    │ │   │
│  │  │ - Structure │    │ - Pattern   │    │ - Chapter   │    │ - TTS API │ │   │
│  │  │   analysis  │    │   detection │    │   breakdown │    │ - Combine │ │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘    └───────────┘ │   │
│  │        │                  │                  │                  │        │   │
│  │        └──────────────────┴──────────────────┴──────────────────┘        │   │
│  │                                   │                                       │   │
│  │                    ┌──────────────┴──────────────┐                       │   │
│  │                    │    Processing Logs          │                       │   │
│  │                    │    (Real-time streaming)    │                       │   │
│  │                    └─────────────────────────────┘                       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         EXTERNAL SERVICES                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │   │
│  │  │   Claude AI     │  │   ElevenLabs    │  │    GitHub       │          │   │
│  │  │   (Anthropic)   │  │      TTS        │  │      API        │          │   │
│  │  │                 │  │                 │  │                 │          │   │
│  │  │ Via Vercel AI   │  │ Voice synthesis │  │ Repo analysis   │          │   │
│  │  │ Gateway         │  │ 10k char chunks │  │ Files, README   │          │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER (Supabase)                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  profiles   │  │  stories    │  │ processing_ │  │   Storage   │     │   │
│  │  │             │  │             │  │ logs        │  │   Bucket    │     │   │
│  │  │ User data   │  │ Generated   │  │             │  │             │     │   │
│  │  │ preferences │  │ narratives  │  │ Real-time   │  │ Audio files │     │   │
│  │  │             │  │ + chapters  │  │ agent logs  │  │ (MP3)       │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                                           │   │
│  │  + code_repositories, story_intents, story_chapters (with RLS)           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Story Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STORY GENERATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  User Input                                                                      │
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 1. INTENT CAPTURE                                                           ││
│  │    • User enters GitHub URL                                                 ││
│  │    • Optional: AI chat conversation to understand goals                     ││
│  │    • Select style (Documentary/Tutorial/Podcast/Fiction/Technical)          ││
│  │    • Choose duration (5/15/30/45+ minutes)                                  ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 2. ANALYZER AGENT                                                           ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Connect to GitHub API                                              │ ││
│  │    │ • Fetch repository metadata (stars, forks, language)                 │ ││
│  │    │ • Scan directory structure                                           │ ││
│  │    │ • Identify key directories (src/, lib/, components/, etc.)           │ ││
│  │    │ • Parse package.json dependencies                                    │ ││
│  │    │ • Read README.md                                                     │ ││
│  │    │ • Sample key files for analysis                                      │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Repository Analysis Object                                       ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 3. ARCHITECT AGENT                                                          ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Build dependency graph                                             │ ││
│  │    │ • Identify core modules and their relationships                      │ ││
│  │    │ • Map data flow patterns                                             │ ││
│  │    │ • Detect architectural patterns (MVC, microservices, etc.)           │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Architecture Map                                                 ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 4. NARRATOR AGENT (Claude AI)                                               ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Generate narrative outline based on style                          │ ││
│  │    │ • Write full script (~150 words/minute target)                       │ ││
│  │    │ • Apply narrative style (documentary/tutorial/podcast/etc.)          │ ││
│  │    │ • Include natural pauses and transitions                             │ ││
│  │    │ • Generate chapter breakdown with timestamps                         │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Script Text + Chapters Array                                     ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 5. SYNTHESIZER AGENT (ElevenLabs)                                           ││
│  │    ┌──────────────────────────────────────────────────────────────────────┐ ││
│  │    │ • Split script into <10k character chunks                            │ ││
│  │    │ • Process each chunk with TTS API                                    │ ││
│  │    │ • Use previous_text/next_text for continuity                         │ ││
│  │    │ • Combine audio buffers                                              │ ││
│  │    │ • Upload to Supabase Storage                                         │ ││
│  │    └──────────────────────────────────────────────────────────────────────┘ ││
│  │    Output: Audio URL + Duration                                             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│      │                                                                           │
│      ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 6. COMPLETED STORY                                                          ││
│  │    • Audio file available for streaming/download                            ││
│  │    • Chapter navigation enabled                                             ││
│  │    • Script text for reference                                              ││
│  │    • Playback position saved                                                ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       │
│  │    profiles     │       │code_repositories│       │  story_intents  │       │
│  ├─────────────────┤       ├─────────────────┤       ├─────────────────┤       │
│  │ id (PK, FK)     │       │ id (PK)         │       │ id (PK)         │       │
│  │ email           │       │ user_id (FK)    │──┐    │ user_id (FK)    │       │
│  │ full_name       │       │ repo_url        │  │    │ repository_id   │───┐   │
│  │ avatar_url      │       │ repo_owner      │  │    │ intent_category │   │   │
│  │ subscription    │       │ repo_name       │  │    │ user_description│   │   │
│  │ preferences     │       │ primary_language│  │    │ focus_areas     │   │   │
│  └────────┬────────┘       │ analysis_cache  │  │    │ conversation    │   │   │
│           │                └─────────────────┘  │    └─────────────────┘   │   │
│           │                         │           │              │           │   │
│           │                         │           │              │           │   │
│           ▼                         ▼           │              ▼           │   │
│  ┌─────────────────────────────────────────────┴──────────────────────────┴───┐│
│  │                              stories                                        ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ id (PK)              │ title               │ narrative_style               ││
│  │ user_id (FK)         │ voice_id            │ expertise_level               ││
│  │ repository_id (FK)   │ script_text         │ target_duration_minutes       ││
│  │ intent_id (FK)       │ audio_url           │ actual_duration_seconds       ││
│  │ status               │ chapters (JSONB)    │ error_message                 ││
│  │ progress             │ progress_message    │ processing timestamps         ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│           │                                                                     │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────┐                           ┌─────────────────┐             │
│  │ story_chapters  │                           │ processing_logs │             │
│  ├─────────────────┤                           ├─────────────────┤             │
│  │ id (PK)         │                           │ id (PK)         │             │
│  │ story_id (FK)   │                           │ story_id (FK)   │             │
│  │ chapter_number  │                           │ timestamp       │             │
│  │ title           │                           │ agent_name      │             │
│  │ start_time_secs │                           │ action          │             │
│  │ duration_secs   │                           │ details (JSONB) │             │
│  │ script_segment  │                           │ level           │             │
│  └─────────────────┘                           └─────────────────┘             │
│                                                                                  │
│  All tables have Row Level Security (RLS) policies for user isolation          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 + React 19 | App Router, Server Components |
| Styling | Tailwind CSS v4 + shadcn/ui | Design system |
| Audio UI | ElevenLabs UI Components | Orb, Waveform, Conversation |
| AI | Vercel AI SDK + Claude | Script generation |
| Voice | ElevenLabs API | Text-to-speech synthesis |
| Database | Supabase (PostgreSQL) | Data persistence + RLS |
| Storage | Supabase Storage | Audio file hosting |
| Auth | Supabase Auth | User authentication |
| Realtime | Supabase Realtime | Processing log streaming |

## Environment Variables

```bash
# Supabase
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (via Vercel AI Gateway - no key needed)
# Uses anthropic/claude-sonnet-4-20250514

# Voice Synthesis
ELEVENLABS_API_KEY=

# Auth Redirect (for dev)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=
```

## Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run database migrations (SQL scripts in `/scripts`)
5. Start the dev server: `npm run dev`

## SQL Migrations

Run these in order in Supabase SQL Editor:

1. `001_create_codestory_tables.sql` - Core tables
2. `002_create_profile_trigger.sql` - Auto-create profiles
3. `003_create_storage_bucket.sql` - Audio storage
4. `004_add_play_count_function.sql` - Play tracking
5. `005_add_increment_play_count.sql` - Play count RPC
6. `006_create_processing_logs.sql` - Processing logs table
7. `007_fix_processing_logs_rls.sql` - RLS policies for logs

## License

MIT License - see LICENSE file for details.
