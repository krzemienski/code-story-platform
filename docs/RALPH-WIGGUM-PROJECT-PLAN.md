# Ralph Wiggum Story Generation Project

## Objective
Generate five different audio stories about Ralph Wiggum from The Simpsons using the 
ralph-orchestrator repository as the technical source material, demonstrating various 
ElevenLabs API configurations.

## Source Repository
- **URL**: https://github.com/mikeyobrien/ralph-orchestrator
- **Description**: An implementation of the "Ralph Wiggum technique" for autonomous AI agent orchestration
- **Key Features**: Multi-agent orchestration, async execution, comprehensive logging

## Five Story Variations

### Variation 1: Documentary Style
- **Voice**: Antoni (warm, authoritative)
- **Model**: eleven_multilingual_v2
- **Quality**: high (128kbps)
- **Focus**: Technical documentary explaining the Ralph Wiggum technique

### Variation 2: Fiction/Adventure Style  
- **Voice**: Bella (expressive, dramatic)
- **Model**: eleven_v3 (latest, most expressive)
- **Quality**: highest (192kbps)
- **Focus**: Ralph Wiggum as the hero in a coding adventure

### Variation 3: Tutorial/Educational Style
- **Voice**: Adam (clear, professional)
- **Model**: eleven_flash_v2_5 (ultra-fast)
- **Quality**: standard (64kbps)
- **Focus**: How-to guide for using the orchestrator

### Variation 4: Podcast/Conversational Style
- **Voice**: Rachel (engaging, conversational)
- **Model**: eleven_turbo_v2_5 (balanced)
- **Quality**: high (128kbps)
- **Focus**: Discussion about AI agent patterns

### Variation 5: Premium Studio Production
- **Voice**: Custom blend (multiple voices)
- **Model**: eleven_multilingual_v2
- **Quality**: ultra_lossless (FLAC)
- **Focus**: Full audiobook production with chapters

## ElevenLabs API Configurations

### API Endpoints Used
1. `/v1/text-to-speech/{voice_id}` - Direct TTS
2. `/v1/text-to-speech/{voice_id}/stream` - Streaming TTS
3. `/v1/studio/projects` - Studio project creation
4. `/v1/studio/projects/{id}/convert` - Audio conversion
5. `/v1/studio/projects/{id}/snapshots` - Get completed audio
6. `/v1/studio/projects/{id}/snapshots/{snap_id}/stream` - Download audio

### Voice Settings Matrix
| Style | Stability | Similarity | Style Exaggeration | Speed |
|-------|-----------|------------|-------------------|-------|
| Documentary | 0.5 | 0.85 | 0.3 | 1.0 |
| Fiction | 0.35 | 0.8 | 0.6 | 1.0 |
| Tutorial | 0.6 | 0.75 | 0.2 | 0.95 |
| Podcast | 0.4 | 0.8 | 0.4 | 1.05 |
| Premium | 0.45 | 0.9 | 0.35 | 1.0 |

## Database Flow

```
1. User submits GitHub URL
   └── INSERT INTO code_repositories (repo_url, repo_name, ...)
   
2. Story record created
   └── INSERT INTO stories (repository_id, title, status='pending', ...)
   
3. Analyzer agent runs
   └── UPDATE stories SET status='analyzing', progress=10
   └── INSERT INTO processing_logs (story_id, agent_name='analyzer', ...)
   
4. Script generation
   └── UPDATE stories SET status='generating_script', progress=40
   └── INSERT INTO processing_logs (story_id, agent_name='scriptwriter', ...)
   └── UPDATE stories SET script_text=...
   
5. Audio generation (ElevenLabs)
   └── UPDATE stories SET status='generating_audio', progress=60
   └── INSERT INTO processing_logs (story_id, agent_name='audio', ...)
   
6. Upload to storage
   └── INSERT INTO storage.objects (bucket='story-audio', ...)
   └── UPDATE stories SET audio_url=..., audio_chunks=[...]
   
7. Completion
   └── UPDATE stories SET status='completed', progress=100
   └── INSERT INTO processing_logs (story_id, agent_name='system', action='completed')
```

## Verification Checklist

- [ ] All 5 story variations generated
- [ ] Each uses different ElevenLabs configuration
- [ ] Audio files stored in Supabase storage
- [ ] Processing logs capture full pipeline
- [ ] Duration and quality metrics recorded
- [ ] Screenshots of pipeline UI captured
