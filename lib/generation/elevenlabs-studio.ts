// ElevenLabs Studio API Integration - Full Implementation
// Based on: https://elevenlabs.io/docs/api-reference/studio

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface StudioProject {
  project_id: string
  name: string
  state: "creating" | "default" | "converting" | "in_queue"
  create_date_unix: number
  default_title_voice_id: string
  default_paragraph_voice_id: string
  default_model_id: string
  can_be_downloaded: boolean
  chapters?: StudioChapter[]
  author?: string
  title?: string
  isbn_number?: string
  volume_normalization?: boolean
  quality_preset?: QualityPreset
}

export interface StudioChapter {
  chapter_id: string
  name: string
  state: "unconverted" | "converting" | "converted"
  content?: string
  last_conversion_date_unix?: number
  statistics?: {
    characters: number
    paragraphs: number
  }
}

export interface StudioSnapshot {
  snapshot_id: string
  project_id: string
  created_at_unix: number
  name?: string
}

export type QualityPreset =
  | "standard" // 64kbps MP3
  | "high" // 128kbps MP3
  | "highest" // 192kbps MP3
  | "ultra" // 256kbps MP3
  | "ultra_lossless" // FLAC lossless

export type ElevenLabsTTSModel =
  | "eleven_v3" // Latest v3 (70+ languages, most expressive)
  | "eleven_multilingual_v2" // High quality multilingual (29 languages)
  | "eleven_flash_v2_5" // Ultra-fast ~75ms (32 languages)
  | "eleven_flash_v2" // Ultra-fast English only
  | "eleven_turbo_v2_5" // Balanced speed/quality (32 languages)
  | "eleven_turbo_v2" // Balanced English only
  | "eleven_multilingual_sts_v2" // Speech-to-speech multilingual
  | "eleven_english_sts_v2" // Speech-to-speech English

export type OutputFormat =
  | "mp3_22050_32" // MP3 22.05kHz 32kbps
  | "mp3_44100_32" // MP3 44.1kHz 32kbps
  | "mp3_44100_64" // MP3 44.1kHz 64kbps
  | "mp3_44100_96" // MP3 44.1kHz 96kbps
  | "mp3_44100_128" // MP3 44.1kHz 128kbps (recommended)
  | "mp3_44100_192" // MP3 44.1kHz 192kbps (high quality)
  | "pcm_16000" // PCM 16kHz (raw)
  | "pcm_22050" // PCM 22.05kHz (raw)
  | "pcm_24000" // PCM 24kHz (raw)
  | "pcm_44100" // PCM 44.1kHz (raw)
  | "ulaw_8000" // μ-law 8kHz (telephony)
  | "alaw_8000" // A-law 8kHz (European telephony)
  | "opus_48000_32" // Opus 48kHz 32kbps
  | "opus_48000_64" // Opus 48kHz 64kbps
  | "opus_48000_96" // Opus 48kHz 96kbps
  | "opus_48000_128" // Opus 48kHz 128kbps
  | "opus_48000_192" // Opus 48kHz 192kbps

export interface VoiceSettings {
  stability: number // 0-1, higher = more consistent, lower = more expressive
  similarity_boost: number // 0-1, higher = closer to original voice
  style?: number // 0-1, exaggerates style (v2+ models)
  use_speaker_boost?: boolean // Enhances speaker similarity
  speed?: number // 0.25-4.0, speech speed multiplier (NEW in 2025)
}

export interface CreateProjectRequest {
  name: string
  default_paragraph_voice_id: string
  default_model_id?: ElevenLabsTTSModel
  default_title_voice_id?: string
  title?: string
  author?: string
  isbn_number?: string
  quality_preset?: QualityPreset
  volume_normalization?: boolean
  // Content sources (mutually exclusive)
  from_document?: Blob // Upload document (txt, pdf, epub, html)
  from_url?: string // URL to fetch content
  from_content_json?: ContentJSON // Structured JSON content (NEW)
}

export interface ContentJSON {
  chapters: ContentChapter[]
}

export interface ContentChapter {
  chapter_id?: string
  name: string
  blocks: ContentBlock[]
}

export interface ContentBlock {
  type: "title" | "paragraph"
  text: string
  voice_id?: string // Override voice for this block
}

export interface CreateProjectResponse {
  project_id: string
}

export interface ConvertProjectResponse {
  status: "ok" | "error"
}

export interface ProjectSnapshotsResponse {
  snapshots: StudioSnapshot[]
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

function getApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set")
  }
  return apiKey
}

/**
 * Create a new Studio project with text content
 * Supports document upload, URL, or structured JSON content
 */
export async function createStudioProject(
  name: string,
  content: string,
  voiceId: string,
  options?: {
    modelId?: ElevenLabsTTSModel
    title?: string
    author?: string
    qualityPreset?: QualityPreset
    volumeNormalization?: boolean
    contentFormat?: "document" | "json"
  },
): Promise<CreateProjectResponse> {
  const apiKey = getApiKey()

  const formData = new FormData()
  formData.append("name", name)
  formData.append("default_paragraph_voice_id", voiceId)
  formData.append("default_title_voice_id", voiceId)
  formData.append("default_model_id", options?.modelId || "eleven_multilingual_v2")
  formData.append("quality_preset", options?.qualityPreset || "high")

  if (options?.volumeNormalization !== false) {
    formData.append("volume_normalization", "true")
  }

  if (options?.title) {
    formData.append("title", options.title)
  }
  if (options?.author) {
    formData.append("author", options.author)
  }

  if (options?.contentFormat === "json") {
    // Use structured JSON content for better chapter control
    const contentJson: ContentJSON = {
      chapters: parseContentToChapters(content, voiceId),
    }
    formData.append("from_content_json", JSON.stringify(contentJson))
  } else {
    // Default: upload as text document
    const textBlob = new Blob([content], { type: "text/plain" })
    formData.append("from_document", textBlob, "script.txt")
  }

  console.log("[ElevenLabs Studio] Creating project:", name)
  console.log("[ElevenLabs Studio] Model:", options?.modelId || "eleven_multilingual_v2")
  console.log("[ElevenLabs Studio] Quality:", options?.qualityPreset || "high")

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/projects`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[ElevenLabs Studio] Create project error:", errorText)
    throw new Error(`Failed to create Studio project: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log("[ElevenLabs Studio] Project created:", result.project_id)
  return result
}

/**
 * Parse script content into chapters for JSON format
 */
function parseContentToChapters(content: string, voiceId: string): ContentChapter[] {
  const chapters: ContentChapter[] = []

  // Split by chapter headers (# Chapter, ## Section, etc.)
  const chapterRegex = /(?:^|\n)(#{1,3}|Chapter\s+\d+[:\s]*|Part\s+\d+[:\s]*)\s*([^\n]+)/gi
  const matches = [...content.matchAll(chapterRegex)]

  if (matches.length === 0) {
    // No chapters found, treat entire content as one chapter
    return [
      {
        name: "Full Script",
        blocks: splitToParagraphs(content, voiceId),
      },
    ]
  }

  const lastIndex = 0
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const nextMatch = matches[i + 1]
    const chapterTitle = match[2].trim()
    const startIndex = match.index! + match[0].length
    const endIndex = nextMatch?.index || content.length
    const chapterContent = content.slice(startIndex, endIndex).trim()

    chapters.push({
      name: chapterTitle,
      blocks: splitToParagraphs(chapterContent, voiceId),
    })
  }

  return chapters
}

/**
 * Split text into paragraph blocks
 */
function splitToParagraphs(text: string, voiceId: string): ContentBlock[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim())
  return paragraphs.map((p, i) => ({
    type: i === 0 ? "title" : ("paragraph" as const),
    text: p.trim(),
    voice_id: voiceId,
  }))
}

/**
 * Get project details and status
 */
export async function getStudioProject(projectId: string): Promise<StudioProject> {
  const apiKey = getApiKey()

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/projects/${projectId}`, {
    headers: {
      "xi-api-key": apiKey,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get project: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Start converting the project (generates audio)
 */
export async function convertStudioProject(projectId: string): Promise<ConvertProjectResponse> {
  const apiKey = getApiKey()

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/projects/${projectId}/convert`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to convert project: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Get project snapshots (completed audio versions)
 */
export async function getProjectSnapshots(projectId: string): Promise<ProjectSnapshotsResponse> {
  const apiKey = getApiKey()

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/projects/${projectId}/snapshots`, {
    headers: {
      "xi-api-key": apiKey,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get snapshots: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Stream audio from a snapshot
 */
export async function streamSnapshotAudio(projectId: string, snapshotId: string): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey()

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/projects/${projectId}/snapshots/${snapshotId}/stream`, {
    headers: {
      "xi-api-key": apiKey,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to stream audio: ${response.status} - ${errorText}`)
  }

  if (!response.body) {
    throw new Error("No response body for audio stream")
  }

  return response.body
}

/**
 * Download complete audio from a snapshot
 */
export async function downloadSnapshotAudio(projectId: string, snapshotId: string): Promise<ArrayBuffer> {
  const apiKey = getApiKey()

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/projects/${projectId}/snapshots/${snapshotId}/stream`, {
    headers: {
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to download audio: ${response.status} - ${errorText}`)
  }

  return response.arrayBuffer()
}

/**
 * Poll for project completion with timeout
 */
export async function waitForProjectConversion(
  projectId: string,
  options?: {
    maxWaitMs?: number
    pollIntervalMs?: number
    onProgress?: (state: string, message: string) => void
  },
): Promise<StudioProject> {
  const maxWaitMs = options?.maxWaitMs || 300000 // 5 minutes default
  const pollIntervalMs = options?.pollIntervalMs || 5000 // 5 seconds
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const project = await getStudioProject(projectId)

    options?.onProgress?.(project.state, `Project state: ${project.state}`)

    // Check chapter states
    if (project.chapters) {
      const allConverted = project.chapters.every((ch) => ch.state === "converted")
      const anyConverting = project.chapters.some((ch) => ch.state === "converting")

      if (allConverted && project.state === "default") {
        console.log("[ElevenLabs Studio] All chapters converted")
        return project
      }

      if (anyConverting) {
        options?.onProgress?.("converting", "Converting audio...")
      }
    }

    // If project is in default state and not converting, it may be done
    if (project.state === "default" && !project.chapters?.some((ch) => ch.state === "converting")) {
      // Check if we have snapshots available
      try {
        const snapshots = await getProjectSnapshots(projectId)
        if (snapshots.snapshots.length > 0) {
          console.log("[ElevenLabs Studio] Snapshot available")
          return project
        }
      } catch {
        // No snapshots yet, keep waiting
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(`Project conversion timed out after ${maxWaitMs}ms`)
}

// =============================================================================
// HIGH-LEVEL WORKFLOW
// =============================================================================

export interface StudioGenerationOptions {
  name: string
  content: string
  voiceId: string
  modelId?: ElevenLabsTTSModel
  title?: string
  author?: string
  qualityPreset?: QualityPreset
  volumeNormalization?: boolean
  contentFormat?: "document" | "json"
  onProgress?: (stage: string, message: string, progress: number) => void
}

export interface StudioGenerationResult {
  projectId: string
  snapshotId: string
  audioBuffer: ArrayBuffer
  durationSeconds: number
}

/**
 * Complete workflow: Create project -> Convert -> Download audio
 */
export async function generateAudioWithStudio(options: StudioGenerationOptions): Promise<StudioGenerationResult> {
  const { name, content, voiceId, onProgress } = options

  // Step 1: Create project
  onProgress?.("creating", "Creating ElevenLabs Studio project...", 0)
  const { project_id } = await createStudioProject(name, content, voiceId, {
    modelId: options.modelId,
    title: options.title,
    author: options.author,
    qualityPreset: options.qualityPreset,
    volumeNormalization: options.volumeNormalization,
    contentFormat: options.contentFormat,
  })

  // Step 2: Start conversion
  onProgress?.("converting", "Starting audio conversion...", 20)
  await convertStudioProject(project_id)

  // Step 3: Wait for conversion
  onProgress?.("processing", "Processing audio (this may take several minutes)...", 30)
  await waitForProjectConversion(project_id, {
    maxWaitMs: 300000,
    pollIntervalMs: 5000,
    onProgress: (state, message) => {
      const progress = state === "converting" ? 50 : state === "default" ? 80 : 40
      onProgress?.(state, message, progress)
    },
  })

  // Step 4: Get snapshot
  onProgress?.("downloading", "Retrieving audio...", 85)
  const { snapshots } = await getProjectSnapshots(project_id)
  if (snapshots.length === 0) {
    throw new Error("No audio snapshots available after conversion")
  }

  const latestSnapshot = snapshots[snapshots.length - 1]

  // Step 5: Download audio
  onProgress?.("downloading", "Downloading audio file...", 90)
  const audioBuffer = await downloadSnapshotAudio(project_id, latestSnapshot.snapshot_id)

  // Estimate duration based on file size (rough: 16KB per second for 128kbps MP3)
  const estimatedDuration = Math.round(audioBuffer.byteLength / 16000)

  onProgress?.("complete", "Audio generation complete", 100)

  return {
    projectId: project_id,
    snapshotId: latestSnapshot.snapshot_id,
    audioBuffer,
    durationSeconds: estimatedDuration,
  }
}

// =============================================================================
// VOICE MANAGEMENT
// =============================================================================

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
  labels?: Record<string, string>
  preview_url?: string
}

/**
 * Get available voices
 */
export async function getVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = getApiKey()

  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    headers: {
      "xi-api-key": apiKey,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get voices: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.voices || []
}

// =============================================================================
// TEXT-TO-SPEECH API (Direct TTS without Studio)
// =============================================================================

export interface TTSRequest {
  text: string
  voice_id: string
  model_id?: ElevenLabsTTSModel
  voice_settings?: VoiceSettings
  output_format?: OutputFormat
}

/**
 * Generate speech using direct TTS API
 * Best for shorter content or when Studio overhead isn't needed
 */
export async function generateSpeech(options: TTSRequest): Promise<ArrayBuffer> {
  const apiKey = getApiKey()

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${options.voice_id}?output_format=${options.output_format || "mp3_44100_128"}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: options.text,
        model_id: options.model_id || "eleven_flash_v2_5",
        voice_settings: options.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TTS failed: ${response.status} - ${errorText}`)
  }

  return response.arrayBuffer()
}

/**
 * Generate speech with streaming (for real-time playback)
 */
export async function generateSpeechStream(options: TTSRequest): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey()

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${options.voice_id}/stream?output_format=${options.output_format || "mp3_44100_128"}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: options.text,
        model_id: options.model_id || "eleven_flash_v2_5",
        voice_settings: options.voice_settings,
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TTS stream failed: ${response.status} - ${errorText}`)
  }

  if (!response.body) {
    throw new Error("No response body for TTS stream")
  }

  return response.body
}

// =============================================================================
// VOICE PRESETS BY NARRATIVE STYLE
// =============================================================================

export const VOICE_PRESETS = {
  fiction: {
    primary: {
      id: "EXAVITQu4vr4xnSDxMaL", // Bella
      name: "Bella",
      description: "Expressive and dramatic for fiction narration",
    },
    settings: {
      stability: 0.35,
      similarity_boost: 0.8,
      style: 0.6,
      use_speaker_boost: true,
    } as VoiceSettings,
  },
  documentary: {
    primary: {
      id: "ErXwobaYiN019PkySvjV", // Antoni
      name: "Antoni",
      description: "Warm and authoritative for documentaries",
    },
    settings: {
      stability: 0.5,
      similarity_boost: 0.85,
      style: 0.3,
      use_speaker_boost: true,
    } as VoiceSettings,
  },
  tutorial: {
    primary: {
      id: "pNInz6obpgDQGcFmaJgB", // Adam
      name: "Adam",
      description: "Clear and professional for tutorials",
    },
    settings: {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.2,
      use_speaker_boost: true,
    } as VoiceSettings,
  },
  podcast: {
    primary: {
      id: "21m00Tcm4TlvDq8ikWAM", // Rachel
      name: "Rachel",
      description: "Engaging and conversational for podcasts",
    },
    secondary: {
      id: "AZnzlk1XvdvUeBnXmlld", // Domi
      name: "Domi",
      description: "Casual guest voice for podcast conversations",
    },
    settings: {
      stability: 0.4,
      similarity_boost: 0.8,
      style: 0.4,
      use_speaker_boost: true,
    } as VoiceSettings,
  },
  technical: {
    primary: {
      id: "pNInz6obpgDQGcFmaJgB", // Adam
      name: "Adam",
      description: "Precise and technical for deep-dives",
    },
    settings: {
      stability: 0.7,
      similarity_boost: 0.9,
      style: 0.1,
      use_speaker_boost: true,
    } as VoiceSettings,
  },
}

export function getRecommendedVoiceForStyle(narrativeStyle: string): string {
  const preset = VOICE_PRESETS[narrativeStyle as keyof typeof VOICE_PRESETS]
  return preset?.primary.id || VOICE_PRESETS.documentary.primary.id
}

export function getVoiceSettingsForStyle(narrativeStyle: string): VoiceSettings {
  const preset = VOICE_PRESETS[narrativeStyle as keyof typeof VOICE_PRESETS]
  return preset?.settings || VOICE_PRESETS.documentary.settings
}

// =============================================================================
// MODEL RECOMMENDATIONS
// =============================================================================

export const TTS_MODEL_RECOMMENDATIONS = {
  // For highest quality long-form content
  audiobook: "eleven_multilingual_v2",

  // For expressive character dialogue
  dialogue: "eleven_v3",

  // For real-time/low-latency needs
  realtime: "eleven_flash_v2_5",

  // For balanced quality/speed
  balanced: "eleven_turbo_v2_5",

  // For podcast-style content
  podcast: "eleven_multilingual_v2",
}

export function getRecommendedTTSModel(
  narrativeStyle: string,
  priority: "quality" | "speed" | "balanced" = "quality",
): ElevenLabsTTSModel {
  if (priority === "speed") {
    return "eleven_flash_v2_5"
  }

  if (priority === "balanced") {
    return "eleven_turbo_v2_5"
  }

  // Quality priority - use best model for style
  switch (narrativeStyle) {
    case "fiction":
      return "eleven_v3" // Most expressive
    case "podcast":
      return "eleven_multilingual_v2"
    case "documentary":
    case "technical":
    case "tutorial":
    default:
      return "eleven_multilingual_v2"
  }
}
