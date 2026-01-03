# Code Tales: ElevenLabs vs Claude Generation Architecture

## Executive Summary

This document analyzes the current tale generation pipeline and proposes a dual-mode architecture:
1. **Unified ElevenLabs Mode** - Uses ElevenLabs Studio for both script generation AND voice synthesis
2. **Hybrid Claude+ElevenLabs Mode** - Uses Claude/GPT for script, ElevenLabs for voice only

---

## Current State Analysis

### Current Pipeline (Hybrid Approach)
\`\`\`
User Input → Claude/GPT (Script) → ElevenLabs TTS API (Voice) → Audio Output
\`\`\`

**Components:**
- **Script Generation**: Claude Sonnet / GPT-4o via Vercel AI Gateway
- **Voice Synthesis**: ElevenLabs Text-to-Speech API (`eleven_flash_v2_5`)
- **Storage**: Supabase Storage for audio chunks

**Current Limitations:**
1. No use of ElevenLabs Studio's advanced features (chapters, multi-voice, music, SFX)
2. Simple chunked TTS - no timing precision or audio layering
3. No GenFM podcast generation capability
4. Voice settings are static per tale type

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

\`\`\`
User Input → ElevenLabs GenFM/Studio → Full Audio Production
\`\`\`

**Best For:**
- Podcast-style tales (conversational host + guest)
- Tales requiring background music and sound effects
- Professional production quality
- Multi-character narratives

**Configuration:**
\`\`\`typescript
{
  mode: "elevenlabs_studio",
  format: "podcast" | "audiobook" | "documentary",
  hosts: { main: VoiceId, guest?: VoiceId },
  includeMusic: boolean,
  includeSFX: boolean,
  duration: "short" | "default" | "long",
  focusAreas: string[] // Up to 3
}
\`\`\`

### Mode 2: Hybrid Claude + ElevenLabs

\`\`\`
User Input → Claude/GPT (Script) → ElevenLabs TTS → Audio
\`\`\`

**Best For:**
- Fiction narratives with complex storytelling
- Technical deep-dives requiring precise language
- Tutorial content with specific structure
- Content requiring custom prompt engineering

**Configuration:**
\`\`\`typescript
{
  mode: "claude_hybrid",
  scriptModel: "anthropic/claude-sonnet-4" | "openai/gpt-4o",
  voiceModel: "eleven_multilingual_v2" | "eleven_flash_v2_5",
  narrativeStyle: "fiction" | "documentary" | "tutorial" | "technical",
  voiceSettings: VoiceSettings
}
\`\`\`

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

## Implementation Tasks

### Phase 1: Core Architecture
- [ ] Create `lib/generation/modes.ts` - Mode definitions and configs
- [ ] Create `lib/generation/elevenlabs-studio.ts` - Studio API integration
- [ ] Update `lib/generation/hybrid.ts` - Refactor current pipeline
- [ ] Add mode selection to generation UI

### Phase 2: ElevenLabs Studio Integration
- [ ] Implement Studio project creation
- [ ] Implement GenFM podcast generation
- [ ] Add multi-voice support
- [ ] Add music/SFX generation options

### Phase 3: UI/UX Consistency Audit
- [ ] Audit all pages for design system compliance
- [ ] Fix terminology: "Tale" not "Story" or "Tail"
- [ ] Ensure public access works for all completed tales
- [ ] Add generation mode selector to wizard

### Phase 4: Testing & Validation
- [ ] End-to-end test each user journey
- [ ] Test both generation modes
- [ ] Validate audio playback across devices
- [ ] Performance testing for long tales

---

## Database Schema Updates

\`\`\`sql
-- Add generation mode column
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_mode TEXT DEFAULT 'hybrid';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS elevenlabs_project_id TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_config JSONB;

-- Add constraint for valid modes
ALTER TABLE stories ADD CONSTRAINT valid_generation_mode 
  CHECK (generation_mode IN ('hybrid', 'elevenlabs_studio'));
