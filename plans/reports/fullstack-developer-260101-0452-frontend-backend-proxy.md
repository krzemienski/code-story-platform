# Frontend-Backend Integration Fix Report

**Agent**: fullstack-developer (a2f499e)
**Date**: 2026-01-01 04:52
**Status**: Completed

## Problem Identified

The frontend had its own complete story generation implementation in `app/api/stories/generate/route.ts` (~800 lines) that:
- Directly called Claude API for script generation
- Directly called ElevenLabs for TTS
- Directly manipulated Supabase
- **NEVER called the FastAPI backend**

The `NEXT_PUBLIC_API_URL` was defined but never used.

## Architecture Mismatch

| Component | Frontend (Old) | Backend (FastAPI) |
|-----------|----------------|-------------------|
| Input | `{ storyId }` | `{ repoUrl, style, duration, voice, focusAreas, technicalDepth }` |
| Story Creation | Frontend creates in Supabase first | Backend creates story record |
| Processing | Direct AI calls in route | Celery async task queue |
| Timeout | 5 min Vercel limit | No limit (async) |

## Solution Implemented

### 1. Updated `next.config.mjs`
Added rewrites to proxy `/api/backend/*` to FastAPI:
```javascript
async rewrites() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return [
    {
      source: '/api/backend/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
  ]
}
```

### 2. Replaced `app/api/stories/generate/route.ts`
Converted from 800-line implementation to ~145-line proxy that:
1. Receives `{ storyId }` from frontend (maintains backward compatibility)
2. Fetches story + repo details from Supabase
3. Transforms to backend's expected format
4. Calls `{backendUrl}/api/stories/generate`
5. Returns response to frontend

**Key transformation**:
```typescript
const backendRequest = {
  repoUrl: `https://github.com/${repo.repo_owner}/${repo.repo_name}`,
  style: styleMap[story.narrative_style] || "documentary",
  duration: story.target_duration_minutes || 10,
  voice: styleConfig?.voice || "Rachel",
  focusAreas: styleConfig?.focusAreas || [],
  technicalDepth: story.expertise_level || "intermediate",
}
```

## Files Modified

| File | Lines | Change |
|------|-------|--------|
| `next.config.mjs` | 12 -> 22 | Added rewrites() |
| `app/api/stories/generate/route.ts` | 797 -> 145 | Complete rewrite to proxy |

## How Frontend Now Connects to Backend

```
[Browser]
    |
    | POST /api/stories/generate { storyId }
    v
[Next.js Route Handler] (route.ts)
    |
    | 1. Fetch story from Supabase
    | 2. Transform request format
    | 3. POST to backend
    v
[FastAPI Backend :8000]
    |
    | /api/stories/generate
    v
[Celery Task Queue]
    |
    v
[Async Processing: Claude + ElevenLabs]
```

## Type Check Status
- `app/api/stories/generate/route.ts`: **No errors**
- Pre-existing errors in other files (not introduced by this change)

## Verification Steps
1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Create story via UI
4. Check logs for `[proxy] Forwarding to backend: http://localhost:8000`
5. Verify backend receives request at `/api/stories/generate`

## Unresolved Questions
1. **Dual story records**: Backend creates its own story record while frontend already created one. May need sync logic or change flow.
2. **WebSocket progress**: Backend uses WS at `/ws/stories/{story_id}/progress`. Frontend polling may still work but WS would be better.
3. **Environment variable**: Need to ensure `NEXT_PUBLIC_API_URL=http://localhost:8000` is set in `.env.local`
