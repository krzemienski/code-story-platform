# Code Story - Implementation Roadmap

## Overview

Transform Code Tales into the full Code Story vision per codestory.md spec.

**Approach**: Phased migration - enhance existing system, then migrate backend

---

## Milestone v1.1: Intent-Driven Experience

### Phase 01: Intent System
> Add conversational intent capture to story generation

| Plan | Focus | Tasks | Validation Gate |
|------|-------|-------|-----------------|
| 01-01 | Database Schema | story_intents table, migrations | `pnpm build` passes, migrations apply |
| 01-02 | Intent API Routes | CRUD endpoints for intents | API returns 200, data persists |
| 01-03 | Intent Chat UI | Conversation component | UI renders, messages flow |
| 01-04 | Intent Analysis | Analyze intent, suggest focus areas | Claude returns structured plan |
| 01-05 | Story Plan Generation | Generate chapter structure from intent | Plan matches intent category |
| 01-06 | Integration | Connect intent → story generation | End-to-end flow works |

**Status**: ✅ COMPLETE
**Completed**: 2026-01-01
**Notes**: Most features already existed. Added intent data to generation prompt (01-06).
**Validation**: User can describe what they want to learn, system generates tailored story plan

---

### Phase 02: Narrative Styles Enhancement
> Implement all 5 styles with optimized prompts

| Plan | Focus | Tasks | Validation Gate |
|------|-------|-------|-----------------|
| 02-01 | Style Prompts | Full prompts for all 5 styles | Prompts exist in lib/agents/prompts.ts |
| 02-02 | Voice Settings | Style-specific ElevenLabs settings | Settings applied per style |
| 02-03 | Style UI | Enhanced style selection with previews | UI shows all options |
| 02-04 | Style Testing | Generate samples for each style | 5 distinct outputs verified |

**Status**: ✅ COMPLETE
**Completed**: 2026-01-01
**Notes**: All features already existed. Validated comprehensive prompts, voice settings, UI.
**Validation**: Each style produces distinctly different narrative tone

---

## Milestone v2.0: Python Backend + Mobile

### Phase 03: Python Backend Foundation
> Migrate to Python FastAPI with Claude Agent SDK

| Plan | Focus | Tasks | Validation Gate |
|------|-------|-------|-----------------|
| 03-01 | Project Setup | FastAPI project, dependencies | `uvicorn` starts |
| 03-02 | Agent SDK Setup | Configure Claude Agent SDK | Agent responds |
| 03-03 | Intent Agent | Implement with skills | Agent analyzes intent |
| 03-04 | Repo Analyzer Agent | GitHub fetching, AST analysis | Analysis returns structure |
| 03-05 | Story Architect Agent | Script generation with styles | Script generated |
| 03-06 | Voice Director Agent | ElevenLabs integration | Audio synthesized |
| 03-07 | API Endpoints | REST API routes | All endpoints return 200 |
| 03-08 | Database Integration | PostgreSQL via SQLAlchemy | Data persists |
| 03-09 | Frontend Migration | Point frontend to Python API | App works with new backend |
| 03-10 | Deployment | Docker, production config | Deploy succeeds |

**Status**: ✅ COMPLETE
**Completed**: 2026-01-01
**Notes**: Full Python backend with Claude Agent SDK implemented. Docker containerization complete. Browser-based validation passed all 5 gates.
**Validation**: Full pipeline works through Python backend - verified with Playwright E2E testing

---

### Phase 04: Mobile Application
> Expo React Native app for iOS/Android

| Plan | Focus | Tasks | Validation Gate |
|------|-------|-------|-----------------|
| 04-01 | Expo Setup | Initialize project, configure | App launches in simulator |
| 04-02 | Auth Flow | Login/signup screens | Auth works |
| 04-03 | Story List | Dashboard, story cards | Stories display |
| 04-04 | Audio Player | Playback with chapters | Audio plays, chapters navigate |
| 04-05 | Story Creation | New story flow | Story created from mobile |
| 04-06 | Deployment | App store preparation | Builds succeed |

**Status**: Not started
**Validation**: Full app experience on iOS/Android

---

## Milestone v2.1: API & Admin

### Phase 05: Public API + Admin
> External API access and admin dashboard

| Plan | Focus | Tasks | Validation Gate |
|------|-------|-------|-----------------|
| 05-01 | API Key Schema | api_keys table, CRUD | Keys stored, validated |
| 05-02 | API Authentication | Key validation middleware | Auth protects endpoints |
| 05-03 | Rate Limiting | Per-key rate limits | Limits enforced |
| 05-04 | Admin Dashboard | Usage stats, user management | Dashboard renders |
| 05-05 | Documentation | OpenAPI spec, developer docs | Docs complete |
| 05-06 | Self-Hosting | Docker compose, setup guide | Self-host works |

**Status**: Not started
**Validation**: External developers can use API, admin can manage platform

---

## Progress Tracking

| Milestone | Phases | Plans | Status |
|-----------|--------|-------|--------|
| v1.1 Intent | 01-02 | 10 | ✅ COMPLETE |
| v2.0 Backend | 03 | 10 | ✅ COMPLETE |
| v2.0 Mobile | 04 | 6 | Not started (no plans created) |
| v2.1 API | 05 | 6 | Not started (no plans created) |
| **Total** | **5** | **32** | **62.5% complete (20/32)** |

---

## Milestone v1.1: ACHIEVED 🎉

**Date**: 2026-01-01
**Summary**: Intent-Driven Experience is now production-ready.

### Key Findings
- Most v1.1 features were already implemented in the codebase
- Phase 01-06 added intent data integration to generation prompt
- All 5 narrative styles validated with comprehensive prompts
- Voice settings properly differentiated for fiction style

### Changes Made
1. `app/api/stories/generate/route.ts`: Added intent context fetching and prompt inclusion
2. `.planning/`: Created complete planning documentation

---

## Milestone v2.0 Backend: ACHIEVED 🎉

**Date**: 2026-01-01
**Summary**: Python Backend Foundation is production-ready.

### Key Achievements
- FastAPI backend with Claude Agent SDK fully operational
- All agents implemented: Intent, RepoAnalyzer, StoryArchitect, VoiceDirector
- PostgreSQL integration via SQLAlchemy + Alembic migrations
- Docker containerization with docker-compose.yml
- Browser-based E2E validation passed all 5 gates

### Bugs Fixed During Validation
1. ANTHROPIC_BASE_URL proxy misconfiguration
2. Missing `actual_duration_seconds` column
3. Story status enum mismatch (`"completed"` vs `"complete"`)

---

## Next Action

**Phase 04 and 05 plans need to be created.** Choose next priority:
1. **Phase 04**: Mobile Application - Create plans for Expo React Native app
2. **Phase 05**: Public API + Admin - Create plans for API access and admin dashboard

Use `create-plans` skill to generate the plan files.
