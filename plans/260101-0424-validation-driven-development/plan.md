---
title: "Validation-Driven Autonomous Development"
description: "Autonomous bug-fixing loop with multi-layer validation gates using MCP tools"
status: pending
priority: P1
effort: 8h
branch: main
tags: [validation, automation, testing, debugging, mcp, playwright, supabase]
created: 2026-01-01
---

# Validation-Driven Autonomous Development

## Executive Summary

Transform manual shell-based validation into MCP-driven autonomous bug fixing. Current state: 4 blocking bugs, 0 tests, shell scripts for validation. Target state: Playwright MCP for frontend, Supabase MCP for database, parallel subagent dispatch for systematic fixes.

**Critical Blockers Identified:**
1. Frontend: Missing `NEXT_PUBLIC_SUPABASE_URL/KEY` env vars
2. Backend: 503 on Supabase connection (config loading issue)
3. Claude API: 401 "OAuth authentication not supported"
4. Infrastructure: Zero test coverage, no CI validation

---

## Current State Analysis

### File Structure

| Layer | Key Files | Status |
|-------|-----------|--------|
| Frontend Supabase | `lib/supabase/client.ts` | Uses undefined env vars |
| Frontend Types | `lib/types.ts` | 132 lines, well-structured |
| Backend Config | `backend/app/config.py` | Pydantic settings, requires all keys |
| API Route | `app/api/stories/generate/route.ts` | 797 lines, complex pipeline |
| Agents | `backend/app/agents/*.py` | 5 agents, untested |
| Validation | `backend/scripts/validate*.sh` | Shell/curl-based, no MCP |

### Environment Configuration Gap

```
Frontend expects:          Backend expects:
NEXT_PUBLIC_SUPABASE_URL   SUPABASE_URL
NEXT_PUBLIC_SUPABASE_KEY   SUPABASE_ANON_KEY
                           SUPABASE_SERVICE_ROLE_KEY
                           ANTHROPIC_API_KEY
                           ELEVENLABS_API_KEY
                           AWS_* (4 keys)
```

Root `.env` exists but lacks `NEXT_PUBLIC_*` prefix for frontend.

---

## Approach A: Sequential Validation-First

### Overview
Fix layer-by-layer with human verification at each gate. Conservative, predictable, lower parallelism.

### Phase Breakdown

| Phase | Action | Validation | Gate |
|-------|--------|------------|------|
| A1 | Add `NEXT_PUBLIC_*` env vars | Playwright: page loads without error | Human approve |
| A2 | Fix backend Supabase init | Supabase MCP: `list_tables` succeeds | Human approve |
| A3 | Fix Claude auth (API key format) | Backend: `/api/health` + agent smoke test | Human approve |
| A4 | Add Vitest config + first tests | `npm test` passes, coverage > 0 | Human approve |
| A5 | Replace shell scripts with MCP calls | Validation script uses Playwright/Supabase MCP | Auto |

### Pros
- Low risk of cascading failures
- Clear rollback points
- Human oversight at each step

### Cons
- Slow: ~8h sequential
- Bottleneck on human approvals
- No learning across parallel fixes

### Effort: 8h (sequential)

---

## Approach B: Parallel Bug Hunt with Auto-Validation

### Overview
Dispatch 3 parallel subagents: Frontend, Backend, Testing. Self-healing loops with iteration caps.

### Architecture

```
                    ┌─────────────────┐
                    │   Supervisor    │
                    │  (Orchestrator) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │Frontend │          │Backend  │          │Testing  │
   │Subagent │          │Subagent │          │Subagent │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
   Playwright MCP       Supabase MCP        Test Runner
   - Page loads         - list_tables       - Vitest setup
   - No console err     - run_sql           - First tests
   - Auth flow          - execute_sql       - Coverage
```

### Subagent Specifications

**Frontend Subagent**
```
Goal: Frontend loads without Supabase errors
Max iterations: 3
Validation: Playwright MCP → browser_navigate + browser_snapshot
Fix target: .env (add NEXT_PUBLIC_*) or lib/supabase/client.ts
Rollback: git checkout -- .env lib/supabase/
```

**Backend Subagent**
```
Goal: /api/stories endpoint returns 200
Max iterations: 3
Validation: Supabase MCP → execute_sql("SELECT 1")
Fix target: backend/app/config.py or backend/.env
Rollback: git checkout -- backend/
```

**Testing Subagent**
```
Goal: Test infrastructure exists, >0 passing tests
Max iterations: 3
Validation: npm test exits 0
Fix target: vitest.config.ts, first test files
Rollback: git checkout -- vitest.config.ts
```

### Self-Healing Loop

```
FOR each subagent:
  attempt = 0
  WHILE not validated AND attempt < 3:
    1. Diagnose (read files, check logs)
    2. Plan fix (identify root cause)
    3. Implement (edit files)
    4. Validate (MCP tools)
    5. IF fail: rollback, attempt++

  IF attempt >= 3:
    Escalate to supervisor → human review
```

### Pros
- Fast: ~3-4h parallel execution
- Self-healing reduces human intervention
- Systematic coverage of all layers

### Cons
- Higher complexity
- Risk of conflicting changes
- Requires robust rollback

### Effort: 4h (parallel) + 1h supervisor overhead = 5h

---

## Comparison Matrix

| Criteria | Approach A (Sequential) | Approach B (Parallel) |
|----------|------------------------|----------------------|
| **Time to Complete** | 8h | 5h |
| **Human Interventions** | 5 gates | 1-2 escalations |
| **Risk Level** | Low | Medium |
| **Rollback Complexity** | Simple | Moderate |
| **Bug Discovery** | Linear | Concurrent |
| **Test Coverage Added** | At end | Parallel |
| **MCP Tool Usage** | Gate-by-gate | Continuous |
| **Scalability** | Poor (1 at a time) | Good (parallel) |

---

## Recommended Approach: Hybrid (B with A fallback)

**Rationale:** Start with parallel subagents (Approach B). If any subagent hits 3 failed iterations, fall back to sequential human-guided fixing (Approach A) for that specific layer only.

### Phase Breakdown

#### Phase 1: Environment Setup (30 min)
**Files:**
- `/.env` - Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `/backend/.env` - Verify all required keys present

**Validation Gate:**
```typescript
// Playwright MCP
browser_navigate({ url: "http://localhost:3001" })
browser_snapshot() // Check no "SUPABASE_URL" error in output
```

#### Phase 2: Parallel Subagent Dispatch (2h)

**Subagent A: Frontend Validation**
```
Tools: Playwright MCP (browser_navigate, browser_snapshot, browser_click)
Target files:
- lib/supabase/client.ts
- lib/supabase/server.ts
- app/page.tsx
Validation: Page renders, no console errors, auth modal works
```

**Subagent B: Backend/Database Validation**
```
Tools: Supabase MCP (list_tables, execute_sql, run_sql)
Target files:
- backend/app/config.py
- backend/app/main.py
- backend/app/api/__init__.py
Validation: Tables exist, can query, API health check passes
```

**Subagent C: Test Infrastructure**
```
Tools: Bash (npm test), Read/Write
Target files:
- vitest.config.ts (create)
- lib/__tests__/types.test.ts (create)
- backend/tests/test_config.py (create)
Validation: npm test && cd backend && pytest passes
```

#### Phase 3: Integration Validation (1h)

**End-to-End Flow:**
```
1. Playwright MCP: Navigate to homepage
2. Playwright MCP: Click "Try Example" button
3. Supabase MCP: Verify story record created
4. Backend health: /api/health returns 200
5. Playwright MCP: Verify progress UI updates
```

#### Phase 4: Claude API Fix (30 min)

**Root Cause:** 401 "OAuth authentication not supported" suggests using OAuth token instead of API key.

**Fix:**
- Verify `ANTHROPIC_API_KEY` format: `sk-ant-api03-...`
- Check backend uses `anthropic.Anthropic(api_key=...)` not OAuth

**Validation:**
```python
# Direct test
import anthropic
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
response = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=10, messages=[{"role": "user", "content": "Hi"}])
```

#### Phase 5: Self-Check Hook Design (30 min)

**Hook: `PostToolUse` for Playwright validation**
```javascript
// .claude/hooks/validate-frontend.js
export default {
  event: "PostToolUse",
  tool: "mcp__playwright__browser_navigate",
  handler: async ({ result }) => {
    // Auto-snapshot after navigation
    // Check for common error patterns
    // Log validation result
  }
}
```

---

## Self-Check Hook Design

### Purpose
Ensure Playwright MCP validation actually happened for frontend changes.

### Implementation

```javascript
// .claude/hooks/frontend-validation-gate.cjs
const FRONTEND_FILE_PATTERNS = [
  /^app\//,
  /^components\//,
  /^lib\/supabase/,
  /\.env$/
];

module.exports = {
  event: "PostToolUse",
  tool: "Edit",
  handler: async ({ toolInput }) => {
    const filePath = toolInput.file_path;
    const isFrontendFile = FRONTEND_FILE_PATTERNS.some(p => p.test(filePath));

    if (isFrontendFile) {
      // Set flag requiring Playwright validation
      process.env.REQUIRES_PLAYWRIGHT_VALIDATION = "true";
    }
  }
};

// Companion hook: check before session ends
module.exports.stopHook = {
  event: "Stop",
  handler: async () => {
    if (process.env.REQUIRES_PLAYWRIGHT_VALIDATION === "true" &&
        process.env.PLAYWRIGHT_VALIDATED !== "true") {
      return {
        block: true,
        message: "Frontend files changed but Playwright validation not run. Run browser_navigate + browser_snapshot first."
      };
    }
  }
};
```

### Validation Checklist Hook

```javascript
// .claude/hooks/validation-checklist.cjs
const VALIDATION_REQUIREMENTS = {
  frontend: {
    required: ["browser_navigate", "browser_snapshot"],
    pattern: /^(app|components|lib\/supabase)\//
  },
  database: {
    required: ["execute_sql", "list_tables"],
    pattern: /^backend\/.*supabase|\.sql$/
  }
};

// Track which validations have occurred
let validationState = {};

module.exports = {
  event: "PostToolUse",
  handler: async ({ tool }) => {
    // Record validation tool usage
    if (tool.startsWith("mcp__playwright__")) {
      validationState.playwright = true;
    }
    if (tool.startsWith("mcp__supabase__")) {
      validationState.supabase = true;
    }
  }
};
```

---

## Success Criteria

| Layer | Metric | Target |
|-------|--------|--------|
| Frontend | Page loads without error | 100% |
| Frontend | Auth modal renders | Functional |
| Database | Supabase tables accessible | list_tables succeeds |
| Backend | /api/health returns 200 | < 500ms response |
| Claude | Agent pipeline completes | No 401 errors |
| Tests | Test files exist | >= 3 test files |
| Tests | Coverage | >= 10% initial |
| Validation | MCP tools used (not curl) | 100% |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Env vars contain secrets | Never log values; use existence checks only |
| Parallel edits conflict | Each subagent owns distinct file paths |
| Infinite fix loops | Hard cap: 3 iterations per subagent |
| MCP tool failures | Fallback to Bash commands with explicit logging |
| Supabase connection issues | Check project status via MCP before operations |
| Playwright browser not installed | Run `browser_install` as first action |

---

## Implementation Order

```
1. [ ] Create .env.local with NEXT_PUBLIC_* vars
2. [ ] Verify backend/.env has all required keys
3. [ ] Dispatch parallel subagents:
   a. [ ] Frontend validation subagent
   b. [ ] Backend/DB validation subagent
   c. [ ] Test infrastructure subagent
4. [ ] Fix Claude API auth (API key format check)
5. [ ] Run end-to-end validation with Playwright MCP
6. [ ] Install self-check hooks
7. [ ] Document validation results
```

---

## Unresolved Questions

1. **Supabase Project ID:** Need to verify which project the MCP is connected to. May require `get_project_url` first.

2. **ElevenLabs Quota:** Unknown if API key has sufficient quota for audio generation tests.

3. **Vercel Deployment:** Plan focuses on local; unclear if Vercel preview deploys need separate validation.

4. **Redis Dependency:** Backend config requires Redis URL but unclear if Redis is running locally.

5. **GitHub Token:** Optional in config but may be needed for rate limit-sensitive repo analysis.
