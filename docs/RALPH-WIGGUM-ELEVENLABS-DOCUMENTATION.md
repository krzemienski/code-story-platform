# Ralph Wiggum Project - Complete ElevenLabs API Documentation

## Project Overview

This document provides comprehensive documentation for the Ralph Wiggum story generation project, which demonstrates 5 different ElevenLabs API configurations for generating audio stories.

**Repository:** https://github.com/mikeyobrien/ralph-orchestrator
**Repository ID:** `b2e92bad-ba85-42db-a3dc-3dfc39ee43dc`

---

## Database Schema

### Tables Used

#### 1. code_repositories
```sql
CREATE TABLE code_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  repo_url TEXT NOT NULL UNIQUE,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  description TEXT,
  primary_language TEXT,
  stars_count INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  default_branch TEXT DEFAULT 'main',
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. stories
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  repository_id UUID REFERENCES code_repositories(id),
  title TEXT NOT NULL,
  description TEXT,
  script_text TEXT,
  audio_url TEXT,
  audio_chunks TEXT[],
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  progress_message TEXT,
  error_message TEXT,
  generation_mode TEXT DEFAULT 'hybrid',
  elevenlabs_project_id TEXT,
  model_config JSONB DEFAULT '{}',
  generation_config JSONB DEFAULT '{}',
  target_duration_minutes INTEGER DEFAULT 15,
  actual_duration_seconds INTEGER,
  play_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  voice_id TEXT,
  narrative_style TEXT DEFAULT 'documentary',
  intent_id UUID REFERENCES story_intents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. processing_logs
```sql
CREATE TABLE processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  level TEXT DEFAULT 'info',
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## The 5 Story Variations

### Variation 1: Documentary Style
| Field | Value |
|-------|-------|
| **Story ID** | `0309c9d6-a522-466b-9328-9f5950e5b706` |
| **Title** | Ralph Wiggum: A Springfield Documentary |
| **Narrative Style** | documentary |
| **Generation Mode** | hybrid |
| **AI Model** | anthropic/claude-sonnet-4 |
| **Voice** | Antoni (ErXwobaYiN019PkySvjV) |
| **TTS Model** | eleven_multilingual_v2 |
| **Output Format** | mp3_44100_128 |
| **Voice Settings** | stability: 0.5, similarity_boost: 0.75 |

### Variation 2: Fiction/Adventure
| Field | Value |
|-------|-------|
| **Story ID** | `356ecf9c-e38e-474b-831c-a70ebda9ad04` |
| **Title** | Ralph Wiggum and the Mystery of the Missing Crayons |
| **Narrative Style** | fiction |
| **Generation Mode** | hybrid |
| **AI Model** | anthropic/claude-sonnet-4 |
| **Voice** | Bella (EXAVITQu4vr4xnSDxMaL) |
| **TTS Model** | eleven_v3 |
| **Output Format** | mp3_44100_192 |
| **Voice Settings** | stability: 0.4, similarity_boost: 0.8, style: 0.3 |

### Variation 3: Tutorial
| Field | Value |
|-------|-------|
| **Story ID** | `d4eefb85-94b4-4b27-bb98-c9016d0f58f3` |
| **Title** | Learning Life Lessons with Ralph Wiggum |
| **Narrative Style** | tutorial |
| **Generation Mode** | hybrid |
| **AI Model** | openai/gpt-4o |
| **Voice** | Adam (pNInz6obpgDQGcFmaJgB) |
| **TTS Model** | eleven_flash_v2_5 |
| **Output Format** | mp3_22050_32 |
| **Voice Settings** | stability: 0.7, similarity_boost: 0.6 |

### Variation 4: Podcast
| Field | Value |
|-------|-------|
| **Story ID** | `95e499f6-e978-4bc8-a682-022cfca3d261` |
| **Title** | The Ralph Wiggum Podcast |
| **Narrative Style** | podcast |
| **Generation Mode** | hybrid |
| **AI Model** | anthropic/claude-sonnet-4 |
| **Voice** | Rachel (21m00Tcm4TlvDq8ikWAM) |
| **TTS Model** | eleven_turbo_v2_5 |
| **Output Format** | mp3_44100_64 |
| **Voice Settings** | stability: 0.45, similarity_boost: 0.7 |

### Variation 5: Premium Audiobook (Studio API)
| Field | Value |
|-------|-------|
| **Story ID** | `f1815910-b958-45fd-ad54-47b187ec7d16` |
| **Title** | The Complete Ralph Wiggum Chronicles: Premium Edition |
| **Narrative Style** | audiobook |
| **Generation Mode** | elevenlabs_studio |
| **AI Model** | anthropic/claude-4-opus |
| **Voice** | Antoni (ErXwobaYiN019PkySvjV) |
| **API** | Studio API (Projects) |
| **Quality Preset** | ultra_lossless |
| **Output Format** | pcm_44100 |
| **Features** | Chapter breaks, SSML support |

---

## ElevenLabs API Reference

### TTS Models Available

| Model | Languages | Latency | Best For |
|-------|-----------|---------|----------|
| `eleven_v3` | 70+ | Standard | Most expressive, best quality |
| `eleven_multilingual_v2` | 29 | Standard | High quality multilingual |
| `eleven_flash_v2_5` | 32 | ~75ms | Real-time applications |
| `eleven_turbo_v2_5` | 32 | Low | Balanced speed/quality |
| `eleven_flash_v2` | English | ~75ms | Ultra-fast English only |
| `eleven_turbo_v2` | English | Low | Balanced English only |

### Output Formats

| Format | Sample Rate | Bitrate | Use Case |
|--------|-------------|---------|----------|
| `mp3_22050_32` | 22.05kHz | 32kbps | Minimum size |
| `mp3_44100_64` | 44.1kHz | 64kbps | Podcast quality |
| `mp3_44100_128` | 44.1kHz | 128kbps | Standard (recommended) |
| `mp3_44100_192` | 44.1kHz | 192kbps | High quality |
| `pcm_44100` | 44.1kHz | Lossless | Studio/mastering |
| `opus_48000_128` | 48kHz | 128kbps | Streaming |

### Quality Presets (Studio API)

| Preset | Description |
|--------|-------------|
| `standard` | 64kbps MP3 |
| `high` | 128kbps MP3 |
| `highest` | 192kbps MP3 |
| `ultra` | 256kbps MP3 |
| `ultra_lossless` | FLAC lossless |

### Voice Settings

```typescript
interface VoiceSettings {
  stability: number      // 0-1: Higher = more consistent
  similarity_boost: number // 0-1: Higher = closer to original
  style?: number         // 0-1: Exaggerates style (v2+ models)
  use_speaker_boost?: boolean // Enhances speaker similarity
  speed?: number         // 0.25-4.0: Speech speed multiplier
}
```

---

## API Endpoints Used

### 1. Text-to-Speech (Hybrid Mode)
```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}

Headers:
  xi-api-key: {ELEVENLABS_API_KEY}
  Content-Type: application/json
  Accept: audio/mpeg

Body:
{
  "text": "Script text...",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  },
  "output_format": "mp3_44100_128"
}
```

### 2. Studio Project Creation (Studio Mode)
```
POST https://api.elevenlabs.io/v1/studio/projects

Headers:
  xi-api-key: {ELEVENLABS_API_KEY}
  Content-Type: application/json

Body:
{
  "name": "Ralph Wiggum Chronicles",
  "default_paragraph_voice_id": "ErXwobaYiN019PkySvjV",
  "default_model_id": "eleven_multilingual_v2",
  "quality_preset": "ultra_lossless",
  "title": "The Complete Ralph Wiggum Chronicles",
  "author": "Code Tales",
  "volume_normalization": true,
  "from_content_json": {
    "chapters": [
      {
        "name": "Prologue",
        "blocks": [
          { "type": "title", "text": "Prologue: Before We Begin" },
          { "type": "paragraph", "text": "In the annals of Springfield..." }
        ]
      }
    ]
  }
}
```

### 3. Studio Project Conversion
```
POST https://api.elevenlabs.io/v1/studio/projects/{project_id}/convert

Headers:
  xi-api-key: {ELEVENLABS_API_KEY}
```

### 4. Get Studio Project Status
```
GET https://api.elevenlabs.io/v1/studio/projects/{project_id}

Headers:
  xi-api-key: {ELEVENLABS_API_KEY}
```

### 5. Stream Studio Audio
```
GET https://api.elevenlabs.io/v1/studio/projects/{project_id}/snapshots/{snapshot_id}/stream

Headers:
  xi-api-key: {ELEVENLABS_API_KEY}
```

---

## Generation Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GENERATION PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. INITIALIZATION                                                │
│    POST /api/stories/generate { storyId }                       │
│    └── Fetch story from database                                │
│    └── Determine generation mode (hybrid vs studio)             │
│    └── Select AI model based on narrative style                 │
│    └── UPDATE stories SET status='analyzing'                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. REPOSITORY ANALYSIS                                          │
│    └── Fetch repo metadata from GitHub API                      │
│    └── Analyze code structure                                   │
│    └── INSERT processing_logs (agent='analyzer')                │
│    └── UPDATE stories SET progress=20                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. SCRIPT GENERATION                                            │
│    └── Build prompt with repo context                           │
│    └── Call AI model (Claude/GPT/Gemini)                       │
│    └── Validate script length for target duration               │
│    └── UPDATE stories SET status='generating_script'            │
│    └── UPDATE stories SET script_text=...                       │
│    └── INSERT processing_logs (agent='scriptwriter')            │
│    └── UPDATE stories SET progress=50                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────┴────────────────────┐
         │                                          │
         ▼                                          ▼
┌─────────────────────┐                 ┌─────────────────────┐
│ 4A. HYBRID MODE     │                 │ 4B. STUDIO MODE     │
│ (Direct TTS API)    │                 │ (Projects API)      │
│                     │                 │                     │
│ For each chunk:     │                 │ 1. Create project   │
│ 1. POST /tts/{id}   │                 │    with chapters    │
│ 2. Get audio buffer │                 │ 2. Start conversion │
│ 3. Upload to storage│                 │ 3. Poll for status  │
│                     │                 │ 4. Download snapshot│
│ Concat all chunks   │                 │ 5. Upload to storage│
└─────────────────────┘                 └─────────────────────┘
         │                                          │
         └────────────────────┬────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. STORAGE & COMPLETION                                         │
│    └── Upload audio to storage.buckets('story-audio')          │
│    └── Get public URL                                           │
│    └── UPDATE stories SET audio_url=..., status='completed'    │
│    └── UPDATE stories SET actual_duration_seconds=...          │
│    └── INSERT processing_logs (agent='system', action='done')  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Processing Logs Structure

Each step in the pipeline creates logs with this structure:

```json
{
  "id": "uuid",
  "story_id": "story-uuid",
  "agent_name": "analyzer|scriptwriter|audio|system",
  "action": "Description of action",
  "level": "debug|info|warn|error",
  "details": {
    "variation": 1,
    "style": "documentary",
    "tts_model": "eleven_multilingual_v2",
    "characters_processed": 5000,
    "audio_duration_seconds": 300
  },
  "timestamp": "2026-01-08T00:00:00Z"
}
```

---

## Testing the Generation

### Via Test Page
Navigate to `/test/ralph` to see the interactive dashboard with:
- All 5 variations with their configurations
- Real-time pipeline visualization
- Live processing logs via Supabase Realtime
- Audio playback after completion

### Via API
```bash
curl -X POST https://codetale.ai/api/stories/generate \
  -H "Content-Type: application/json" \
  -d '{"storyId": "0309c9d6-a522-466b-9328-9f5950e5b706"}'
```

---

## Environment Variables Required

```env
# ElevenLabs
ELEVENLABS_API_KEY=your_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tlcbnkvjxlfjfzxqmavt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI Providers (via Vercel AI Gateway)
# No keys needed - uses gateway
```

---

## Verification Checklist

- [x] Repository created in database
- [x] 5 story variations created with unique configurations
- [x] Processing logs table populated with creation logs
- [x] ElevenLabs API integration implemented (lib/generation/elevenlabs-studio.ts)
- [x] Generation route implemented (app/api/stories/generate/route.ts)
- [x] Test page created (/test/ralph)
- [x] Real-time subscriptions configured
- [x] Storage bucket exists (story-audio)
- [x] RLS policies configured for all tables
- [ ] Audio generation tested for all 5 variations
- [ ] Audio files uploaded to storage
- [ ] Playback verified
