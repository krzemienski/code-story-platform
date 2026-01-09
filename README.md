# Code Tales

**Transform GitHub repositories into immersive audio stories.**

Code Tales is an open-source platform that analyzes code repositories and generates engaging audio stories using AI. Perfect for understanding new codebases, onboarding developers, or experiencing the art of software architecture through sound.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/krzemienski/code-story-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Code Tales transforms any public GitHub repository into an audio experience. Whether you prefer a fictional adventure through code, a documentary-style exploration, or a technical deep-dive, our AI agents analyze the repository structure, understand the architecture, and craft a story tailored to your preferences.

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  CODE TALES PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                              USER INTERFACE LAYER                                ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ ││
│  │  │  Landing    │  │  Dashboard  │  │  Discover   │  │  Story Player           │ ││
│  │  │  (page.tsx) │  │  (My Tales) │  │  (Public)   │  │  (Floating + Dedicated) │ ││
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ ││
│  └─────────┼────────────────┼────────────────┼─────────────────────┼───────────────┘│
│            │                │                │                     │                │
│  ┌─────────▼────────────────▼────────────────▼─────────────────────▼───────────────┐│
│  │                              COMPONENT LAYER                                     ││
│  │  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ ││
│  │  │ StoryGenerator │  │ ChronicleCard    │  │ FloatingPlayer   │  │ Processing │ ││
│  │  │ - Mode Select  │  │ - Play/Queue     │  │ - Global State   │  │ Logs       │ ││
│  │  │ - Config Panel │  │ - Actions        │  │ - Chunk Playback │  │ - Real-time│ ││
│  │  └───────┬────────┘  └────────┬─────────┘  └────────┬─────────┘  └─────┬──────┘ ││
│  └──────────┼───────────────────┼──────────────────────┼──────────────────┼────────┘│
│             │                   │                      │                  │         │
│  ┌──────────▼───────────────────▼──────────────────────▼──────────────────▼────────┐│
│  │                                API LAYER                                         ││
│  │  ┌────────────────────────────────────────────────────────────────────────────┐ ││
│  │  │                    /api/stories/generate/route.ts                          │ ││
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐  │ ││
│  │  │  │   ANALYZER   │──▶│   NARRATOR   │──▶│ SYNTHESIZER  │──▶│   STORAGE   │  │ ││
│  │  │  │   (GitHub)   │   │   (Claude)   │   │ (ElevenLabs) │   │  (Supabase) │  │ ││
│  │  │  └──────────────┘   └──────────────┘   └──────────────┘   └─────────────┘  │ ││
│  │  └────────────────────────────────────────────────────────────────────────────┘ ││
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐  ││
│  │  │ /api/stories/[id]│  │ /api/chat/intent │  │ /api/stories/[id]/download   │  ││
│  │  │ CRUD Operations  │  │ Intent Agent     │  │ Audio Chunk Merging          │  ││
│  │  └──────────────────┘  └──────────────────┘  └──────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                              SERVICE LAYER                                       ││
│  │  ┌──────────────────────────┐  ┌──────────────────────────────────────────────┐ ││
│  │  │ lib/agents/              │  │ lib/generation/                              │ ││
│  │  │ ├── github.ts (Analysis) │  │ ├── modes.ts (Hybrid/Studio)                 │ ││
│  │  │ ├── prompts.ts (Styles)  │  │ └── elevenlabs-studio.ts (GenFM)             │ ││
│  │  │ └── log-helper.ts        │  │                                              │ ││
│  │  └──────────────────────────┘  └──────────────────────────────────────────────┘ ││
│  │  ┌──────────────────────────┐  ┌──────────────────────────────────────────────┐ ││
│  │  │ lib/ai/                  │  │ lib/content-generation/                      │ ││
│  │  │ ├── models.ts            │  │ └── framework.ts                             │ ││
│  │  │ └── provider.ts          │  │                                              │ ││
│  │  └──────────────────────────┘  └──────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                              DATA LAYER (Supabase)                               ││
│  │  ┌──────────┐  ┌─────────────────┐  ┌──────────┐  ┌─────────────────────────┐   ││
│  │  │ profiles │  │code_repositories│  │ stories  │  │   processing_logs       │   ││
│  │  │ (users)  │  │ (repo cache)    │  │ (tales)  │  │   (real-time progress)  │   ││
│  │  └──────────┘  └─────────────────┘  └──────────┘  └─────────────────────────┘   ││
│  │  ┌──────────────────────────────────────────────────────────────────────────┐   ││
│  │  │                    Supabase Storage (story-audio bucket)                 │   ││
│  │  │                    Audio chunks: {story_id}/chunk_{n}.mp3                │   ││
│  │  └──────────────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## Data Flow Diagram

\`\`\`
┌────────────────────────────────────────────────────────────────────────────────────┐
│                           TALE GENERATION PIPELINE                                  │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  USER INPUT                                                                         │
│  ┌─────────────────┐                                                               │
│  │ GitHub URL      │                                                               │
│  │ Narrative Style │                                                               │
│  │ Duration        │                                                               │
│  │ Generation Mode │───────────────────┐                                           │
│  └─────────────────┘                   │                                           │
│                                        ▼                                           │
│  PHASE 1: ANALYSIS              ┌──────────────┐                                   │
│  ┌─────────────────────────────▶│  GitHub API  │                                   │
│  │                              └──────┬───────┘                                   │
│  │                                     │                                           │
│  │  ┌──────────────────────────────────▼────────────────────────────────────────┐ │
│  │  │ Repository Analysis                                                        │ │
│  │  │ • Fetch tree structure (directories, files)                                │ │
│  │  │ • Read README.md, package.json, config files                               │ │
│  │  │ • Detect languages, frameworks, patterns                                   │ │
│  │  │ • Identify key architectural components                                    │ │
│  │  └──────────────────────────────────┬────────────────────────────────────────┘ │
│  │                                     │                                           │
│  │                                     ▼                                           │
│  │  PHASE 2: GENERATION         ┌──────────────┐                                   │
│  │  (Mode: Hybrid)              │ Claude API   │                                   │
│  │  ┌──────────────────────────▶│ (Anthropic)  │                                   │
│  │  │                           └──────┬───────┘                                   │
│  │  │                                  │                                           │
│  │  │  ┌───────────────────────────────▼─────────────────────────────────────────┐│
│  │  │  │ Script Generation                                                        ││
│  │  │  │ • Apply narrative style (fiction/documentary/tutorial/podcast/technical)││
│  │  │  │ • Calculate tokens based on duration (150 words/min)                     ││
│  │  │  │ • Generate engaging script with proper pacing                            ││
│  │  │  └───────────────────────────────┬─────────────────────────────────────────┘│
│  │  │                                  │                                           │
│  │  │                                  ▼                                           │
│  │  │  PHASE 3: SYNTHESIS       ┌──────────────┐                                   │
│  │  │  ┌───────────────────────▶│ ElevenLabs   │                                   │
│  │  │  │                        │ TTS API      │                                   │
│  │  │  │                        └──────┬───────┘                                   │
│  │  │  │                               │                                           │
│  │  │  │  ┌────────────────────────────▼────────────────────────────────────────┐ │
│  │  │  │  │ Audio Generation                                                     │ │
│  │  │  │  │ • Split script into ~8000 char chunks                                │ │
│  │  │  │  │ • Apply voice settings (stability, similarity)                       │ │
│  │  │  │  │ • Generate MP3 for each chunk                                        │ │
│  │  │  │  │ • Upload chunks to Supabase Storage                                  │ │
│  │  │  │  └────────────────────────────┬────────────────────────────────────────┘ │
│  │  │  │                               │                                           │
│  │  │  │                               ▼                                           │
│  │  │  │  PHASE 4: STORAGE      ┌──────────────┐                                   │
│  │  │  │  ┌────────────────────▶│  Supabase    │                                   │
│  │  │  │  │                     │  Storage     │                                   │
│  │  │  │  │                     └──────┬───────┘                                   │
│  │  │  │  │                            │                                           │
│  │  │  │  │  ┌─────────────────────────▼──────────────────────────────────────────┐│
│  │  │  │  │  │ Final Storage                                                      ││
│  │  │  │  │  │ • Store audio_chunks array in stories table                        ││
│  │  │  │  │  │ • Update status to 'completed'                                     ││
│  │  │  │  │  │ • Set audio_url to first chunk or merged file                      ││
│  │  │  │  │  │ • Make public for virality (is_public = true)                      ││
│  │  │  │  │  └─────────────────────────────────────────────────────────────────────┘│
│  │                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## Features

- **Multi-Agent AI Pipeline** - Specialized agents for analysis, narration, and synthesis
- **Dual Generation Modes** - Hybrid (Claude + ElevenLabs TTS) or Full Studio (ElevenLabs GenFM)
- **5 Narrative Styles** - Fiction, documentary, tutorial, podcast, and technical
- **High-Quality Audio** - ElevenLabs text-to-speech with multiple voice options
- **Persistent Floating Player** - Audio continues while browsing the site
- **Queue Management** - Add multiple stories to your listening queue
- **Real-time Progress** - Watch live logs as your story generates
- **Chunked Audio** - Long stories split intelligently for reliable playback
- **Public Library** - Browse and listen to community-generated stories

## Project Structure

\`\`\`
code-story-platform/
├── app/
│   ├── api/
│   │   ├── stories/
│   │   │   ├── generate/route.ts    # Main generation pipeline
│   │   │   ├── [id]/route.ts        # Story CRUD operations
│   │   │   ├── [id]/download/       # Audio download with chunk merging
│   │   │   └── [id]/restart/        # Restart failed generations
│   │   └── chat/intent/route.ts     # Intent conversation agent
│   ├── auth/                        # Authentication pages
│   ├── dashboard/                   # User dashboard
│   │   ├── page.tsx                 # Story list & management
│   │   ├── new/page.tsx             # Create new story
│   │   └── story/[id]/page.tsx      # Story detail view
│   ├── discover/page.tsx            # Public story browser
│   ├── story/[id]/page.tsx          # Public story player
│   └── page.tsx                     # Landing page
│
├── components/
│   ├── featured-hero.tsx            # Hero carousel with featured stories
│   ├── chronicle-card.tsx           # Story card with play/queue actions
│   ├── floating-player.tsx          # Global persistent audio player
│   ├── story-generator.tsx          # Generation form & progress
│   ├── generation-mode-selector.tsx # Hybrid vs Studio mode toggle
│   ├── processing-logs.tsx          # Real-time generation logs
│   ├── navbar.tsx                   # Main navigation
│   ├── parallax-background.tsx      # Animated background effects
│   └── ui/                          # shadcn/ui components
│
├── lib/
│   ├── agents/
│   │   ├── github.ts                # Repository analysis (tree, metadata)
│   │   ├── prompts.ts               # Narrative style system prompts
│   │   └── log-helper.ts            # Processing log utilities
│   ├── ai/
│   │   ├── models.ts                # AI model definitions
│   │   └── provider.ts              # Multi-model provider abstraction
│   ├── generation/
│   │   ├── modes.ts                 # Hybrid vs Full Studio modes
│   │   └── elevenlabs-studio.ts     # ElevenLabs Studio API client
│   ├── audio-player-context.tsx     # Global audio state management
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   ├── server.ts                # Server Supabase client
│   │   └── service.ts               # Service role client (bypasses RLS)
│   └── types.ts                     # TypeScript type definitions
│
├── scripts/                         # SQL migrations (idempotent)
│   ├── 001_create_codestory_tables.sql
│   ├── 002_create_profile_trigger.sql
│   └── ...
│
├── docs/
│   ├── ELEVENLABS-CLAUDE-ANALYSIS.md
│   └── REPOSITORY-ANALYSIS-PROCEDURE.md
│
├── CLAUDE.md                        # AI assistant guidance
├── Makefile                         # Build and run commands
└── docker-compose.yml               # Container orchestration
\`\`\`

## Quick Start

\`\`\`bash
# Clone and install
git clone https://github.com/krzemienski/code-story-platform.git
cd code-story-platform
make install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development
make dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## Narrative Styles

| Style | Description | Best For |
|-------|-------------|----------|
| **Fiction** | Characters, plot, dramatic tension. Code becomes a living world. | Entertainment, engagement |
| **Documentary** | Authoritative exploration of architecture and history. | Understanding big picture |
| **Tutorial** | Step-by-step educational walkthrough. | Learning new codebases |
| **Podcast** | Casual conversation style, like chatting with a friend. | Easy listening |
| **Technical** | Deep-dive with exact file paths, complexity analysis. | Expert practitioners |

## Environment Variables

\`\`\`env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ELEVENLABS_API_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
GITHUB_TOKEN=ghp_...  # For private repos
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- **Website**: [codetale.ai](https://codetale.ai)
- **Repository**: [github.com/krzemienski/code-story-platform](https://github.com/krzemienski/code-story-platform)
- **Documentation**: [CLAUDE.md](./CLAUDE.md)

---

Built with love for developers who want to hear their code come alive.
