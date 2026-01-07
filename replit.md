# Code Tales Platform

## Overview
Code Tales transforms GitHub repositories into immersive audio stories using AI. The platform analyzes repository structure, generates narrative scripts with Claude, and synthesizes audio with ElevenLabs TTS.

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix primitives)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth
- **AI**: Anthropic Claude (via AI SDK), ElevenLabs TTS
- **Storage**: Supabase Storage (audio chunks)
- **Package Manager**: npm (with --legacy-peer-deps for React 19 compatibility)

## Project Structure
```
code-story-platform/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── auth/                 # Auth pages
│   ├── dashboard/            # Protected user area
│   ├── discover/             # Public story browser
│   └── story/[id]/           # Public story player
├── components/               # React components
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── agents/               # AI agent logic
│   ├── ai/                   # AI model layer
│   ├── generation/           # Generation modes
│   └── supabase/             # DB clients
├── scripts/                  # SQL migrations
└── docs/                     # Additional documentation
```

## Development
- Dev server runs on port 5000 (configured for Replit)
- Run with `npm run dev`
- Build with `npm run build`

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ELEVENLABS_API_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...              # Optional, for private repos
```

## Replit Configuration
- Next.js configured to allow all dev origins for Replit's proxy
- Server binds to 0.0.0.0:5000
- Mock Supabase client handles missing environment variables gracefully

## Recent Changes
- 2026-01-07: Configured for Replit environment
  - Updated next.config.mjs with allowedDevOrigins
  - Set dev server to run on 0.0.0.0:5000
  - Fixed mock Supabase client to support proper method chaining
  - Configured autoscale deployment
