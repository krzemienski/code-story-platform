# Code Tales - Implementation Plan & Architecture

## Database Connection Status: ✅ VERIFIED

| Component | Status | Details |
|-----------|--------|---------|
| Database | ✅ Connected | Project: `tlcbnkvjxlfjfzxqmavt` |
| Tables | ✅ Created | `stories`, `code_repositories`, `processing_logs` |
| Storage | ✅ Ready | `story-audio` bucket (public) |
| RLS Policies | ✅ Configured | All tables protected |
| Functions | ✅ Created | `increment_play_count()` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages                    │  Components                          │
│  ├── / (Homepage)         │  ├── hero-section.tsx                │
│  ├── /dashboard           │  ├── story-generator.tsx             │
│  ├── /dashboard/story/[id]│  ├── generation-pipeline.tsx         │
│  ├── /story/[id]          │  ├── story-player.tsx                │
│  ├── /auth/login          │  ├── processing-logs.tsx             │
│  ├── /auth/sign-up        │  └── generation-mode-selector.tsx    │
│  └── /discover            │                                      │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API ROUTES                                │
├─────────────────────────────────────────────────────────────────┤
│  /api/stories/generate    │  Main generation endpoint            │
│  /api/stories/[id]        │  Get/update story                    │
│  /api/stories/[id]/restart│  Restart failed generation           │
│  /api/stories/[id]/download│ Download audio file                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  Supabase          │  Database, Auth, Storage                    │
│  GitHub API        │  Repository analysis                        │
│  Anthropic/OpenAI  │  Script generation (Claude, GPT-4)          │
│  ElevenLabs        │  Audio synthesis (TTS + Studio API)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Required

| Variable | Description | Status |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ⚠️ Check |
| `ANTHROPIC_API_KEY` | For Claude models | ✅ Set |
| `ELEVENLABS_API_KEY` | For TTS and Studio API | ✅ Set |
| `GITHUB_TOKEN` | Optional, for higher rate limits | ⚠️ Optional |

---

## Feature Implementation Status

### 1. Authentication ✅
- [x] Email/password sign up
- [x] Email/password login
- [x] Password reset flow
- [x] Session management via middleware
- [x] Protected dashboard routes

### 2. Story Generation ✅
- [x] GitHub repo URL input
- [x] Repository analysis
- [x] AI script generation
- [x] Model selection (Claude, GPT-4, Gemini)
- [x] ElevenLabs TTS (hybrid mode)
- [x] ElevenLabs Studio API (full production mode)
- [x] Progress tracking with logs
- [x] Audio chunking for long stories

### 3. Audio Playback ✅
- [x] Howler.js integration
- [x] Media Session API (lock screen controls)
- [x] Progress bar with seek
- [x] Play count tracking
- [x] Floating player component

### 4. Dashboard ✅
- [x] List user's stories
- [x] Story detail view
- [x] Delete stories
- [x] Restart failed generations

---

## Next Steps for Full Production

### Phase 1: Verification (Now)
1. Test auth flow (sign up → login → dashboard)
2. Test story generation with a simple repo
3. Verify audio playback works
4. Check processing logs display

### Phase 2: Data Validation & Security
1. **Input Validation**
   - Validate GitHub URLs (format, accessibility)
   - Sanitize user inputs before database
   - Rate limit API endpoints

2. **Security Hardening**
   - Verify RLS policies work correctly
   - Add CSRF protection to forms
   - Audit service role key usage

### Phase 3: UI Polish
1. Add loading skeletons
2. Improve error messages
3. Add toast notifications for actions
4. Mobile responsiveness audit

### Phase 4: Production Deployment
1. Set up custom domain
2. Configure production environment variables
3. Enable Supabase email confirmations
4. Set up monitoring/analytics

---

## Database Schema Reference

### stories
```sql
id              UUID PRIMARY KEY
user_id         UUID (nullable for anonymous)
repository_id   UUID FK → code_repositories
title           TEXT
description     TEXT
script_text     TEXT
audio_url       TEXT
audio_chunks    TEXT[]
status          TEXT (pending|analyzing|generating_script|generating_audio|completed|failed)
progress        INTEGER (0-100)
progress_message TEXT
error_message   TEXT
generation_mode TEXT (hybrid|elevenlabs_studio)
model_config    JSONB
target_duration_minutes INTEGER
actual_duration_seconds INTEGER
play_count      INTEGER
is_public       BOOLEAN
voice_id        TEXT
narrative_style TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### code_repositories
```sql
id              UUID PRIMARY KEY
user_id         UUID (nullable)
repo_url        TEXT UNIQUE
repo_name       TEXT
repo_owner      TEXT
description     TEXT
language        TEXT
stars           INTEGER
default_branch  TEXT
created_at      TIMESTAMPTZ
```

### processing_logs
```sql
id              UUID PRIMARY KEY
story_id        UUID FK → stories
agent_name      TEXT
action          TEXT
level           TEXT (debug|info|warn|error)
details         JSONB
timestamp       TIMESTAMPTZ
```

---

## AI Model Options

| Model | Provider | Best For | Speed |
|-------|----------|----------|-------|
| Claude 4 Opus | Anthropic | Highest quality scripts | Slow |
| Claude 4.5 Sonnet | Anthropic | Best balance | Medium |
| Claude 3.5 Haiku | Anthropic | Quick drafts | Fast |
| GPT-4o | OpenAI | Alternative high quality | Medium |
| GPT-4o Mini | OpenAI | Cost effective | Fast |
| Gemini 2.0 Flash | Google | Speed priority | Fastest |

## ElevenLabs Options

| Mode | Description | Use Case |
|------|-------------|----------|
| Hybrid | Claude script + ElevenLabs TTS | Default, reliable |
| Studio API | Full ElevenLabs production | Music, SFX, multi-voice |

---

## Testing Checklist

- [ ] Sign up with new email
- [ ] Login with credentials
- [ ] Access dashboard (should show empty state)
- [ ] Generate tale from GitHub repo
- [ ] Watch progress in real-time
- [ ] Play completed audio
- [ ] Verify play count increments
- [ ] Test public story page
- [ ] Test restart failed generation
- [ ] Test logout and session cleanup
