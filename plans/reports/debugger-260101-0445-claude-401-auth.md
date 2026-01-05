# Debug Report: Claude API 401 Authentication Error

**Date:** 2026-01-01 04:45
**Severity:** Critical
**Status:** Root Cause Identified

## Executive Summary

The backend fails with `anthropic.AuthenticationError: 401 - OAuth authentication is currently not supported` because the `ANTHROPIC_API_KEY` environment variable is not properly configured.

## Root Cause

**Missing/Invalid API Key Configuration**

1. **`.env` file does not exist** in `/Users/nick/Desktop/code-story-platform/backend/`
   - Only `.env.example` exists with placeholder values
   - The backend tries to load settings from `.env` (see `config.py` line 11)

2. **Environment inherits Claude Code proxy settings:**
   ```
   ANTHROPIC_BASE_URL=https://ccflare.hack.ski
   ```
   - No `ANTHROPIC_API_KEY` is set in the shell environment
   - The Anthropic client defaults to checking for auth tokens/OAuth when no explicit API key provided

3. **Error origin:** `backend/app/api/routes/intent.py:64`
   - `client.messages.stream()` fails at authentication stage
   - The ccflare proxy returns "OAuth authentication is currently not supported"

## Technical Flow

```
Settings.anthropic_api_key (required, no default)
    ↓
Anthropic(api_key=settings.anthropic_api_key)  [line 24 in base.py, line 53 in intent.py]
    ↓
API call to ANTHROPIC_BASE_URL (ccflare.hack.ski proxy)
    ↓
401 - OAuth not supported (proxy rejects invalid/missing key)
```

## Action Required

**User must create `.env` file with valid Anthropic API key:**

```bash
cd /Users/nick/Desktop/code-story-platform/backend
cp .env.example .env
# Then edit .env and set:
# ANTHROPIC_API_KEY=sk-ant-api03-YOUR-REAL-KEY-HERE
```

**Required format:** `sk-ant-api03-...` (standard Anthropic API key)

**After creating `.env`, restart backend:**
```bash
# Kill current process
kill 22232

# Restart
cd /Users/nick/Desktop/code-story-platform/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Additional Notes

- Backend is currently running (PID 22232 on port 8000)
- Other required env vars also missing: `SUPABASE_*`, `ELEVENLABS_*`, `AWS_*`
- The proxy URL `ccflare.hack.ski` may need to be unset if using direct Anthropic API

## Files Examined

| File | Status |
|------|--------|
| `backend/.env` | **MISSING** |
| `backend/.env.example` | Exists, placeholder values |
| `backend/app/config.py` | Settings class requires `anthropic_api_key` |
| `backend/app/agents/base.py` | Anthropic client instantiation |
| `backend/app/api/routes/intent.py` | Error origin location |
| `/tmp/codestory-api.log` | Confirms 401 error trace |
