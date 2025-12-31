# CodeTale

**Transform GitHub repositories into immersive audio stories.**

CodeTale is an open-source platform that analyzes code repositories and generates engaging audio stories using AI. Perfect for understanding new codebases, onboarding developers, or experiencing the art of software architecture through sound.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/krzemienski/code-story-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

CodeTale transforms any public GitHub repository into an audio experience. Whether you prefer a fictional adventure through code, a documentary-style exploration, or a technical deep-dive, our AI agents analyze the repository structure, understand the architecture, and craft a story tailored to your preferences.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CODETALE PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   GitHub     │───▶│   Analyzer   │───▶│   Narrator   │───▶│ Synthesizer│ │
│  │   Repo URL   │    │    Agent     │    │    Agent     │    │   Agent   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│         │                   │                   │                   │       │
│         ▼                   ▼                   ▼                   ▼       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Fetch Tree  │    │  Build Map   │    │ Generate     │    │ ElevenLabs│ │
│  │  & Metadata  │    │  & Patterns  │    │ Script       │    │   TTS     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         SUPABASE (PostgreSQL)                            ││
│  │  ┌─────────┐ ┌─────────────────┐ ┌────────┐ ┌─────────────────────────┐ ││
│  │  │profiles │ │code_repositories│ │stories │ │    story_chapters       │ ││
│  │  └─────────┘ └─────────────────┘ └────────┘ └─────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      FLOATING AUDIO PLAYER                               ││
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌─────────────────┐   ││
│  │  │ Waveform │ │ Progress │ │ Queue   │ │ Volume │ │ Persist Across  │   ││
│  │  │ Display  │ │  Slider  │ │ Manager │ │Control │ │   Navigation    │   ││
│  │  └──────────┘ └──────────┘ └─────────┘ └────────┘ └─────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

- **Multi-Agent AI Pipeline** - Specialized agents for analysis, narration, and synthesis
- **5 Narrative Styles** - Fiction, documentary, tutorial, podcast, and technical
- **High-Quality Audio** - ElevenLabs text-to-speech with multiple voice options
- **Persistent Floating Player** - Audio continues while browsing the site
- **Queue Management** - Add multiple stories to your listening queue
- **Real-time Progress** - Watch live logs as your story generates
- **Chunked Audio** - Long stories split intelligently for reliable playback
- **Public Library** - Browse and listen to community-generated stories

## Project Structure

```
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
│   ├── audio-player-context.tsx     # Global audio state management
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   ├── server.ts                # Server Supabase client
│   │   └── service.ts               # Service role client (bypasses RLS)
│   └── types.ts                     # TypeScript type definitions
│
└── scripts/
    ├── 001_create_codetale_tables.sql
    ├── 002_create_profile_trigger.sql
    ├── 003_create_storage_bucket.sql
    ├── 004_add_play_count_function.sql
    └── ...
```

## How It Works

### 1. Repository Analysis (`lib/agents/github.ts`)

When you submit a GitHub URL, the **Analyzer Agent** fetches:

```typescript
// Fetch repository tree structure
const tree = await fetchRepoTree(owner, repo)

// Analyze key directories, config files, languages
const analysis = {
  structure: tree,
  readme: await fetchFileContent(owner, repo, 'README.md'),
  languages: await fetchLanguages(owner, repo),
  keyDirectories: identifyKeyDirectories(tree),
  packageJson: await fetchFileContent(owner, repo, 'package.json'),
  metadata: await fetchRepoMetadata(owner, repo)
}
```

### 2. Script Generation (`app/api/stories/generate/route.ts`)

The **Narrator Agent** uses Claude to generate a script based on:

- Repository analysis summary
- Selected narrative style (fiction, documentary, etc.)
- Target duration (5-45 minutes)
- User expertise level

```typescript
const result = await generateText({
  model: "anthropic/claude-sonnet-4-20250514",
  system: getStoryPrompt(style, expertise, targetMinutes),
  prompt: `Create an audio story for ${repo}...`,
  maxTokens: estimatedTokensNeeded,
  temperature: 0.8
})
```

### 3. Audio Synthesis

The **Synthesizer Agent** converts the script to audio using ElevenLabs:

```typescript
// Split long scripts into chunks (max 8000 chars each)
const scriptChunks = splitTextIntoChunks(script, 8000)

// Generate audio for each chunk
for (const chunk of scriptChunks) {
  const audioResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      body: JSON.stringify({
        text: chunk,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: style === "fiction" ? 0.35 : 0.5,
          similarity_boost: 0.8
        }
      })
    }
  )
  // Upload chunk to Supabase Storage
  await supabase.storage.from("story-audio").upload(filename, audioBuffer)
}
```

### 4. Playback (`lib/audio-player-context.tsx`)

The floating player manages:

- Current track and queue state
- Seamless chunk transitions for long stories
- Play/pause across page navigation
- Volume and progress controls

## Narrative Styles

| Style | Description | Best For |
|-------|-------------|----------|
| **Fiction** | Characters, plot, dramatic tension. Code becomes a living world. | Entertainment, engagement |
| **Documentary** | Authoritative exploration of architecture and history. | Understanding big picture |
| **Tutorial** | Step-by-step educational walkthrough. | Learning new codebases |
| **Podcast** | Casual conversation style, like chatting with a friend. | Easy listening |
| **Technical** | Deep-dive with exact file paths, complexity analysis. | Expert practitioners |

## Database Schema

### Core Tables

```sql
-- User profiles (extends Supabase auth.users)
profiles (id, email, name, subscription_tier, usage_quota)

-- Cached repository data
code_repositories (id, user_id, repo_url, repo_owner, repo_name, 
                   primary_language, stars_count, analysis_cache)

-- Generated stories
stories (id, user_id, repository_id, title, narrative_style,
         target_duration_minutes, actual_duration_seconds,
         script_text, audio_url, audio_chunks, status, progress,
         is_public, play_count)

-- Processing logs for real-time UI
processing_logs (id, story_id, agent_type, message, details, level)
```

### Row Level Security

All tables have RLS enabled:
- Users can only access their own data
- Public stories are readable by everyone
- Service role bypasses RLS for generation pipeline

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ELEVENLABS_API_KEY=sk_...

# Optional
GITHUB_TOKEN=ghp_...  # For private repos
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- ElevenLabs API key

### Installation

```bash
# Clone the repository
git clone https://github.com/krzemienski/code-story-platform.git
cd code-story-platform

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Execute scripts/001-007 in your Supabase SQL editor

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) or [https://codetale.ai](https://codetale.ai)

## API Reference

### POST `/api/stories/generate`

Triggers story generation for a story record.

```typescript
// Request
{ storyId: string }

// Response
{ success: true, storyId: string }
```

### GET `/api/stories/[id]`

Fetch story details with repository info.

### POST `/api/stories/[id]/restart`

Restart a failed or pending story generation.

### GET `/api/stories/[id]/download`

Download complete audio (merges all chunks).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

### Areas for Contribution

- **New narrative styles** - Add prompts in `lib/agents/prompts.ts`
- **Language support** - Improve analysis for specific languages
- **Voice options** - Add ElevenLabs voice presets
- **UI/UX improvements** - Enhance the player, cards, or discovery
- **Performance** - Optimize generation pipeline

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- **Website**: [codetale.ai](https://codetale.ai)
- **Repository**: [github.com/krzemienski/code-story-platform](https://github.com/krzemienski/code-story-platform)
- **Issues**: [Report bugs or request features](https://github.com/krzemienski/code-story-platform/issues)

---

Built with love for developers who want to hear their code come alive.
