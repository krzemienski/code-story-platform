# ElevenLabs Studio API - Complete Implementation Plan

## Executive Summary

This document outlines the comprehensive plan to fully implement and test ElevenLabs Studio API integration with multi-model AI script generation support.

---

## Phase 1: Backend API Verification & Testing

### 1.1 ElevenLabs Studio API Test Script

Create a Node.js test script to verify each API endpoint:

1. **Test Voices API** - List available voices
2. **Test Create Project** - Create a short test project
3. **Test Convert Project** - Trigger audio conversion
4. **Test Get Project Status** - Poll for completion
5. **Test Download Audio** - Download and verify MP3 file

### 1.2 Model Selection Testing

Test each AI model for script generation:
- `anthropic/claude-sonnet-4` (default)
- `anthropic/claude-3-5-haiku`
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `google/gemini-2.0-flash`

### 1.3 Database Schema Verification

Verify all required columns exist:
- `generation_mode` (hybrid | elevenlabs_studio)
- `elevenlabs_project_id` (for Studio mode)
- `generation_config` (JSONB for mode settings)
- `model_config` (JSONB for AI model settings)

---

## Phase 2: Frontend UI Components

### 2.1 Model Selector Component

- Dropdown showing all available models
- Model descriptions and capabilities
- Visual indicator for recommended models
- Disable unavailable models

### 2.2 Generation Mode Selector

- Toggle between Hybrid and ElevenLabs Studio modes
- Studio-specific options (quality preset, music, SFX)
- Real-time cost estimation

### 2.3 Context Preview Component

- Show script being sent to AI
- Display word count and estimated duration
- Preview system prompt and context

---

## Phase 3: Playwright E2E Testing

### 3.1 Test Scenarios

1. **Model Selection Flow**
   - Open model selector
   - Select each model
   - Verify selection persists

2. **Generation Mode Flow**
   - Switch to ElevenLabs Studio mode
   - Configure options
   - Start generation

3. **Full Generation E2E**
   - Enter GitHub URL
   - Configure options
   - Start generation
   - Wait for completion
   - Verify audio plays

### 3.2 Screenshot Capture Points

- Initial page load
- Model selector open
- Generation mode selected
- Generation in progress
- Completion with audio player

---

## Phase 4: Audio Verification

### 4.1 Audio File Validation

- Verify MP3 headers are valid
- Check file size is reasonable (>100KB)
- Verify duration matches target
- Test playback in browser

### 4.2 Storage Verification

- Audio uploads to Supabase storage
- Public URLs are accessible
- Multiple chunks merge correctly

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| ElevenLabs Studio Client | COMPLETE | Full API implementation |
| Model Selection Backend | COMPLETE | 5 models supported |
| Generation Mode Backend | COMPLETE | Hybrid + Studio modes |
| Model Selector UI | COMPLETE | In generation-config |
| Generation Mode Selector UI | COMPLETE | With studio options |
| Context Preview UI | PARTIAL | Needs implementation |
| Playwright Tests | NOT STARTED | To be implemented |
| Audio Verification | PARTIAL | Manual testing only |

---

## Next Steps

1. Create Playwright test suite
2. Run full E2E test with screenshot capture
3. Test each AI model generates valid scripts
4. Test ElevenLabs Studio mode produces audio
5. Verify audio playback in Story Player
6. Document all test results
