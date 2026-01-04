# Code Tales: ElevenLabs vs Claude Generation Architecture

## Executive Summary

This document analyzes the current tale generation pipeline and proposes a dual-mode architecture:
1. **Unified ElevenLabs Mode** - Uses ElevenLabs Studio for both script generation AND voice synthesis
2. **Hybrid Claude+ElevenLabs Mode** - Uses Claude/GPT for script, ElevenLabs for voice only

---

## Current State Analysis (Updated: January 2026)

### Database Schema Status: COMPLETE

The SQL script `scripts/001_create_codestory_tables.sql` is now **fully idempotent** with:
- `DROP POLICY IF EXISTS` before all `CREATE POLICY` statements
- `CREATE TABLE IF NOT EXISTS` for all tables
- `CREATE INDEX IF NOT EXISTS` for all indexes
- Exception handling for enum types (`DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`)
- All tables properly configured with RLS enabled

**Tables:**
| Table | Purpose | RLS | Status |
|-------|---------|-----|--------|
| `profiles` | User data extending auth.users | Yes | Ready |
| `code_repositories` | GitHub repo cache | Yes | Ready |
| `story_intents` | User learning goals | Yes | Ready |
| `stories` | Generated tales | Yes | Ready |
| `story_chapters` | Chapter breakdown | Yes | Ready |
| `processing_logs` | Generation progress | Yes | Ready |

**Key Columns in stories table:**
- `is_public` - DEFAULT TRUE (for virality)
- `status` - Uses `'completed'` (not `'complete'`)
- `audio_chunks` - JSONB array for chunked audio
- `play_count` - Tracks popularity
- `generation_mode` - 'hybrid' or 'elevenlabs_studio'
- `generation_config` - JSONB for model settings

### Current Pipeline (Hybrid Approach)

```
User Input → Claude/GPT (Script via AI Gateway) → ElevenLabs TTS API → Supabase Storage
```

**Components:**
- **Script Generation**: Claude Sonnet / GPT-4o via Vercel AI Gateway (auto-routed)
- **Voice Synthesis**: ElevenLabs Text-to-Speech API (`eleven_flash_v2_5`)
- **Storage**: Supabase Storage for audio chunks
- **Model Selection**: Auto-recommends based on narrative style, duration, priority

**Generation Route Flow (`app/api/stories/generate/route.ts`):**
1. Load tale config from database
2. Auto-select model if not specified (uses `recommendModel()`)
3. Fetch intent context if available
4. Analyze repository via GitHub API
5. Generate script with Claude/GPT (prompt optimized per model)
6. Parse chapters with GPT-4o-mini
7. Chunk script for TTS (max 10,000 chars per chunk)
8. Synthesize audio via ElevenLabs
9. Upload chunks to Supabase Storage
10. Update tale with audio URLs

**Current Limitations:**
1. No use of ElevenLabs Studio's advanced features (multi-voice, music, SFX)
2. Simple chunked TTS - no timing precision or audio layering
3. No GenFM podcast generation capability
4. Timeout risk for long tales (5-minute Vercel limit)

---

## ElevenLabs Studio API Capabilities

### Studio Features Available via API:
1. **AI Script Generator** - Generate scripts from prompts
2. **GenFM** - Create podcast-style content with host/guest voices
3. **Multi-Track Timeline** - Narration, music, SFX on separate tracks
4. **Chapter Management** - Automatic chapter detection and navigation
5. **Auto-Assign Voices** - Detect characters and assign matching voices
6. **Music Generation** - AI-generated background music
7. **Sound Effects** - AI-generated contextual sound effects
8. **Pronunciation Dictionaries** - Custom pronunciation rules

### ElevenLabs API Endpoints:
- `POST /v1/text-to-speech/{voice_id}` - Basic TTS (current usage)
- `POST /v1/studio/create-project` - Create Studio project
- `POST /v1/studio/generate-podcast` - GenFM podcast generation
- `GET /v1/studio/{project_id}/export` - Export rendered audio/video

---

## Proposed Dual-Mode Architecture

### Mode 1: Unified ElevenLabs (Full Studio Pipeline)

```
User Input → ElevenLabs GenFM/Studio → Full Audio Production
```

**Best For:**
- Podcast-style tales (conversational host + guest)
- Tales requiring background music and sound effects
- Professional production quality
- Multi-character narratives

**Configuration:**
```typescript
{
  mode: "elevenlabs_studio",
  format: "podcast" | "audiobook" | "documentary",
  hosts: { main: VoiceId, guest?: VoiceId },
  includeMusic: boolean,
  includeSFX: boolean,
  duration: "short" | "default" | "long",
  focusAreas: string[] // Up to 3
}
```

### Mode 2: Hybrid Claude + ElevenLabs

```
User Input → Claude/GPT (Script) → ElevenLabs TTS → Audio
```

**Best For:**
- Fiction narratives with complex storytelling
- Technical deep-dives requiring precise language
- Tutorial content with specific structure
- Content requiring custom prompt engineering

**Configuration:**
```typescript
{
  mode: "claude_hybrid",
  scriptModel: "anthropic/claude-sonnet-4" | "openai/gpt-4o",
  voiceModel: "eleven_multilingual_v2" | "eleven_flash_v2_5",
  narrativeStyle: "fiction" | "documentary" | "tutorial" | "technical",
  voiceSettings: VoiceSettings
}
```

---

## Repository Analysis Procedure

### Step 1: Initial Context Gathering
```typescript
// Files to always check first
const contextFiles = [
  'lib/types.ts',           // Type definitions
  'lib/ai/models.ts',       // AI model configs
  'lib/generation/modes.ts', // Generation modes
  'app/api/stories/generate/route.ts', // Main pipeline
]
```

### Step 2: Database Schema Validation
```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify stories table columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'stories' ORDER BY ordinal_position;

-- Verify RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('profiles', 'stories', 'story_intents', 'story_chapters');
```

### Step 3: Code Pattern Analysis
- Check all status value usage (`'completed'` not `'complete'`)
- Verify `is_public` defaults to `TRUE`
- Ensure all queries filter correctly for public access
- Validate model configurations match available providers

### Step 4: User Flow Verification
| Flow | Start | End | Auth |
|------|-------|-----|------|
| Public Listen | `/story/[id]` | Audio plays | No |
| Generate | `/dashboard` | Tale created | Yes |
| Share | Tale page | Copy link | No |
| Discover | `/discover` | Browse tales | No |
| Auth | `/auth/*` | Sign up, login, error | No |
| Settings | `/dashboard/settings` | User preferences | Yes |

---

## User Flow & Testing Plan

### Page Inventory & User Paths

| Page | Path | Purpose | Auth Required |
|------|------|---------|---------------|
| Landing | `/` | Hero, tale carousel, generate CTA | No |
| Story Detail | `/story/[id]` | Public tale playback | No |
| Dashboard | `/dashboard` | User's tales library | Yes |
| New Tale | `/dashboard/new` | Tale generation wizard | Yes |
| Tale Detail (Private) | `/dashboard/story/[id]` | Private tale + controls | Yes |
| Discover | `/discover` | Browse community tales | No |
| Auth | `/auth/*` | Sign up, login, error | No |
| Settings | `/dashboard/settings` | User preferences | Yes |

### Critical User Journeys

1. **New Visitor → First Tale**
   - Land on `/` → View hero → Enter repo URL → Select style → Generate
   - Expected: Smooth wizard, clear progress, playable result

2. **Returning User → Library Management**
   - Login → Dashboard → View tales → Play/Download/Delete
   - Expected: All tales visible, statuses clear, audio plays

3. **Viral Sharing Flow**
   - Receive shared link → `/story/[id]` → Listen → Generate own
   - Expected: Public access, no login required for listening

4. **Generation Mode Selection**
   - Dashboard → New Tale → Choose Mode (Studio vs Hybrid) → Configure → Generate
   - Expected: Clear mode explanations, appropriate options per mode

---

## Implementation Status

### Phase 1: Core Architecture - COMPLETE
- [x] `lib/ai/models.ts` - Model definitions and auto-recommendation
- [x] `lib/generation/modes.ts` - Mode definitions and configs
- [x] `lib/generation/elevenlabs-studio.ts` - Studio API client skeleton
- [x] SQL schema idempotent with DROP POLICY IF EXISTS
- [x] Status values standardized to `'completed'`
- [x] `is_public` defaults to `TRUE`

### Phase 2: ElevenLabs Studio Integration - IN PROGRESS
- [ ] Implement Studio project creation
- [ ] Implement GenFM podcast generation
- [ ] Add multi-voice support
- [ ] Add music/SFX generation options

### Phase 3: UI/UX Consistency Audit - NEEDED
- [ ] Audit all pages for design system compliance
- [ ] Fix terminology: "Tale" not "Story" or "Tail"
- [ ] Ensure public access works for all completed tales
- [ ] Add generation mode selector to wizard

### Phase 4: Testing & Validation - NEEDED
- [ ] End-to-end test each user journey
- [ ] Test both generation modes
- [ ] Validate audio playback across devices (especially iOS)
- [ ] Performance testing for long tales

---

## Database Schema Reference

```sql
-- Complete idempotent schema available at:
-- scripts/001_create_codestory_tables.sql

-- Key constraints:
-- stories.status IN ('pending', 'analyzing', 'generating', 'synthesizing', 'completed', 'failed')
-- stories.narrative_style IN ('fiction', 'documentary', 'tutorial', 'podcast', 'technical')
-- stories.is_public DEFAULT TRUE
-- story_intents.intent_category IN (
--   'architecture_understanding', 'onboarding_deep_dive', 'specific_feature_focus',
--   'code_review_prep', 'learning_patterns', 'api_documentation',
--   'bug_investigation', 'migration_planning', 'quick_overview'
-- )
```

---

## Environment Variables Required

| Variable | Purpose | Required |
|----------|---------|----------|
| `SUPABASE_URL` | Database connection | Yes |
| `SUPABASE_ANON_KEY` | Public API key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | Yes |
| `ELEVENLABS_API_KEY` | Voice synthesis | Yes |
| `ANTHROPIC_API_KEY` | Claude models (optional, AI Gateway handles) | No |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Auth redirect in dev | Dev only |

---

## Troubleshooting Guide

### "Configure" Prompt Appearing
- **Cause**: SQL scripts in `/scripts` folder trigger v0 to prompt execution
- **Fix**: Scripts are idempotent; safe to run or ignore if DB already setup

### Tales Not Public
- **Check**: `SELECT id, is_public FROM stories WHERE status = 'completed';`
- **Fix**: `UPDATE stories SET is_public = TRUE WHERE status = 'completed';`

### Audio Not Playing on iOS
- **Cause**: Howler.js SSR issues or Media Session API not set
- **Fix**: Ensure dynamic imports for howler, check audio-player-context.tsx

### Generation Stuck in "synthesizing"
- **Cause**: ElevenLabs API timeout or error
- **Fix**: Check ELEVENLABS_API_KEY, reset story status to 'failed' for retry
