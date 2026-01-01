# Code Story - Project Brief

## Vision

Transform Code Tales from a basic repository-to-audio platform into a **developer-first, intent-driven** story generation platform with:
- Rich conversational onboarding to understand user goals
- Multiple narrative styles with optimized prompts
- Claude Agent SDK powered multi-agent pipeline
- Mobile app support
- Public API for developers

## Current State

**What Exists:**
- Next.js 16 + React 19 web application
- Basic story generation pipeline (analyze → narrate → synthesize)
- Supabase auth + PostgreSQL database
- ElevenLabs TTS integration
- 5 narrative styles (basic prompts)
- Floating audio player

**What's Missing (per codestory.md spec):**
- Intent-driven onboarding conversation
- Claude Agent SDK with custom skills
- Sophisticated agent orchestration
- Mobile app (Expo)
- Public API with key management
- Admin dashboard
- Self-hosting capability

## Target State

### Core Differentiators
1. **Intent-Driven**: Users define what they want to learn, not just which repo to analyze
2. **Open Source**: Full codebase available for self-hosting
3. **Developer-First**: API access for integration into tools and workflows
4. **Multi-Agent**: Specialized agents with custom skills

### Agent Architecture
\`\`\`
Intent Agent → Repo Analyzer → Story Architect → Voice Director
     │              │                │                │
 Understand     Analyze code    Generate script   Synthesize audio
 user goals     & patterns      with style        with ElevenLabs
\`\`\`

### Intent Categories
- Architecture Understanding
- Onboarding Deep-Dive
- Specific Feature Focus
- Code Review Prep
- Learning Patterns
- API Documentation
- Bug Investigation
- Migration Planning

### Narrative Styles (5)
1. **Fiction**: Code as characters, dramatic storytelling
2. **Documentary**: Authoritative, factual exploration
3. **Tutorial**: Step-by-step educational
4. **Podcast**: Casual, conversational
5. **Technical**: Dense, expert-level deep-dive

## Success Criteria

1. User can describe what they want to learn in natural language
2. System generates tailored chapter structure based on intent
3. All 5 narrative styles produce distinctly different outputs
4. Mobile app provides full listening experience
5. Public API enables external integrations
6. Self-hosting works via Docker

## Technical Constraints

- Must not break existing functionality during migration
- Must maintain backward compatibility with existing stories
- Must work with existing Supabase setup
- ElevenLabs API limits must be respected (chunking)

## Reference

- Full spec: `/home/nick/code-story/docs-plans-prompts-specs/codestory.md`
- Current codebase: `/home/nick/code-story-platform/`
- Live site: codetale.ai
