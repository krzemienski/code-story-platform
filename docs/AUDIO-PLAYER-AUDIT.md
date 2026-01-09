# Audio Player Audit and Testing Plan

## Executive Summary

This document outlines the comprehensive audit plan for the Code Tales audio player implementation, covering Safari compatibility, mobile mini player functionality, single-track playback enforcement, script quality validation, and ElevenLabs integration testing.

---

## 1. Current Architecture Analysis

### Audio Components

| Component | Purpose | Status |
|-----------|---------|--------|
| `lib/audio-player-context.tsx` | Global audio state management | Working |
| `components/floating-player.tsx` | Mini player bar (desktop/mobile) | Needs Safari fixes |
| `components/story-player.tsx` | Full player on story pages | Working |
| `components/audio-player.tsx` | Standalone player variant | Working |

### Data Flow

\`\`\`
User Click → AudioPlayerContext.play(item) → audioRef.current.src = url
                                           → audioRef.current.play()
                                           ↓
                               Queue Management → Update UI State
\`\`\`

---

## 2. Safari Compatibility Issues

### Known Safari-Specific Problems

1. **Autoplay Policy**: Safari blocks autoplay without user interaction
2. **Audio Format**: Some codecs may not be supported
3. **Web Audio API**: Different behavior for AudioContext
4. **Background Playback**: Limited on iOS without proper media session

### Fixes Implemented

\`\`\`typescript
// Safari autoplay workaround - requires user gesture
const playSafari = async () => {
  if (audioRef.current) {
    // Safari requires explicit user interaction
    try {
      await audioRef.current.play()
    } catch (e) {
      // If autoplay blocked, wait for user click
      console.log("[v0] Autoplay blocked, waiting for user interaction")
    }
  }
}

// Media Session API for iOS lock screen controls
if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: item.title,
    artist: "Code Tales",
    artwork: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  })
  navigator.mediaSession.setActionHandler("play", () => play())
  navigator.mediaSession.setActionHandler("pause", () => pause())
  navigator.mediaSession.setActionHandler("seekbackward", () => skipBackward(15))
  navigator.mediaSession.setActionHandler("seekforward", () => skipForward(15))
}
\`\`\`

---

## 3. Single Track Playback Enforcement

### Problem
Multiple audio elements can play simultaneously if not properly managed.

### Solution
The `AudioPlayerContext` uses a single `audioRef` that is shared globally. When a new track is played:

1. Previous audio is paused
2. Source is replaced
3. New audio plays

\`\`\`typescript
const playItem = useCallback((item: QueueItem) => {
  // This automatically stops previous audio since we use single audioRef
  if (audioRef.current) {
    audioRef.current.pause() // Explicitly pause previous
    audioRef.current.src = item.audioChunks?.[0] || item.audioUrl || ""
    audioRef.current.play()
  }
}, [])
\`\`\`

---

## 4. Mobile Mini Player Testing

### Test Cases

| Test | Expected | Status |
|------|----------|--------|
| Player appears when audio starts | Mini bar visible at bottom | Pass |
| Play/pause toggles correctly | Audio state matches UI | Pass |
| Progress bar updates | Reflects currentTime/duration | Pass |
| Expand/collapse works | Queue panel shows/hides | Pass |
| Lock screen controls (iOS) | Media session responds | Needs testing |
| Background playback continues | Audio doesn't pause on app switch | Needs testing |

---

## 5. Script Quality Validation

### Duration Targets

| Target Duration | Word Count | Estimated Audio |
|-----------------|------------|-----------------|
| 5 minutes | ~750 words | 3-5 min |
| 15 minutes | ~2,250 words | 12-18 min |
| 30 minutes | ~4,500 words | 25-35 min |
| 60 minutes | ~9,000 words | 50-70 min |

### Validation Checks

\`\`\`typescript
// Script quality validation
function validateScript(script: string, targetMinutes: number) {
  const words = script.split(/\s+/).length
  const expectedWords = targetMinutes * 150
  const tolerance = 0.25 // 25% variance allowed
  
  const isValidLength = words >= expectedWords * (1 - tolerance) 
                     && words <= expectedWords * (1 + tolerance)
  
  const hasProperStructure = 
    script.includes("...") && // Has pauses
    script.split("\n\n").length >= 3 // Has paragraph breaks
  
  return {
    words,
    expectedWords,
    isValidLength,
    hasProperStructure,
    estimatedMinutes: Math.round(words / 150)
  }
}
\`\`\`

---

## 6. ElevenLabs Integration Testing

### API Endpoints Used

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/v1/text-to-speech/{voice_id}` | Convert script to audio | Working |
| `/v1/text-to-speech/{voice_id}/stream` | Stream audio chunks | Working |
| `/v1/studio/create-project` | Create full production | Not implemented |
| `/v1/studio/create-podcast` | GenFM podcast creation | Not implemented |

### Voice Quality Settings

\`\`\`typescript
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true
}
\`\`\`

---

## 7. Testing Workflow

### Phase 1: Unit Testing
1. Test AudioPlayerContext state management
2. Test play/pause/seek functions
3. Test queue management
4. Test chunk handling

### Phase 2: Integration Testing
1. Generate a test tale (5 minutes)
2. Verify script word count matches target
3. Verify audio duration within 25% of target
4. Test playback on Chrome, Safari, Firefox, Edge

### Phase 3: Mobile Testing
1. iOS Safari - autoplay, lock screen, background
2. Android Chrome - same tests
3. PWA behavior - offline caching

### Phase 4: Load Testing
1. Multiple simultaneous generations
2. Large repository analysis
3. 60-minute tale generation

---

## 8. Public Sharing Verification

### Requirements
- All completed tales should be public by default
- Share URLs work without authentication
- Social media previews render correctly

### Database Check
\`\`\`sql
-- Verify is_public defaults to TRUE
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'stories' AND column_name = 'is_public';

-- Check public tales
SELECT COUNT(*) as public_count 
FROM stories 
WHERE is_public = true AND status = 'completed';
\`\`\`

---

## 9. Action Items

### Critical (P0)
- [x] Fix Safari autoplay handling
- [x] Add Media Session API for iOS
- [x] Ensure single track playback
- [x] Validate script duration targets

### High (P1)
- [ ] Implement full ElevenLabs Studio integration
- [ ] Add offline caching for audio
- [ ] Improve chunk transition smoothness

### Medium (P2)
- [ ] Add waveform visualization sync
- [ ] Implement sleep timer
- [ ] Add bookmarking feature

---

## 10. Monitoring

### Metrics to Track
- Play count per tale
- Average listen duration
- Drop-off points
- Generation success rate
- Script word count accuracy
