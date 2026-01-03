// ElevenLabs Studio API Integration for Full Production Pipeline

import type { StudioModeConfig } from "./modes"

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"

interface StudioProject {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  export_url?: string
}

interface GenFMRequest {
  source_type: "url" | "text" | "file"
  source: string // URL, text content, or file ID
  format: "conversation" | "bulletin"
  duration: "short" | "default" | "long"
  host_voice_id: string
  guest_voice_id?: string
  language?: string
  focus_areas?: string[]
}

interface GenFMResponse {
  project_id: string
  status: "pending" | "processing"
  estimated_duration_seconds: number
}

// Create a new Studio project for full audio production
export async function createStudioProject(
  name: string,
  content: string,
  config: StudioModeConfig,
): Promise<StudioProject> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  // For podcast format, use GenFM
  if (config.format === "podcast") {
    return createGenFMPodcast(name, content, config)
  }

  // For other formats, create standard audiobook project
  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/create-project`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      text: content,
      default_voice_id: config.hosts.main,
      auto_assign_voices: false, // We control voice assignment
      model_id: "eleven_multilingual_v2",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Studio project: ${error}`)
  }

  return response.json()
}

// Create GenFM podcast from content
async function createGenFMPodcast(name: string, content: string, config: StudioModeConfig): Promise<StudioProject> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  const genFMRequest: GenFMRequest = {
    source_type: "text",
    source: content,
    format: config.hosts.guest ? "conversation" : "bulletin",
    duration: config.duration,
    host_voice_id: config.hosts.main,
    guest_voice_id: config.hosts.guest,
    language: config.language,
    focus_areas: config.focusAreas,
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/create-podcast`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(genFMRequest),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create GenFM podcast: ${error}`)
  }

  const genFMResponse: GenFMResponse = await response.json()

  return {
    id: genFMResponse.project_id,
    name,
    status: genFMResponse.status === "processing" ? "processing" : "pending",
    created_at: new Date().toISOString(),
  }
}

// Check project status
export async function getProjectStatus(projectId: string): Promise<StudioProject> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/${projectId}`, {
    headers: {
      "xi-api-key": apiKey,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get project status: ${error}`)
  }

  return response.json()
}

// Export completed project
export async function exportProject(
  projectId: string,
  format: "mp3" | "wav" = "mp3",
): Promise<{ download_url: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/${projectId}/export`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format,
      include_all_chapters: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to export project: ${error}`)
  }

  return response.json()
}

// Poll for project completion (with timeout)
export async function waitForProjectCompletion(
  projectId: string,
  maxWaitMs = 300000, // 5 minutes default
  pollIntervalMs = 5000,
): Promise<StudioProject> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const project = await getProjectStatus(projectId)

    if (project.status === "completed") {
      return project
    }

    if (project.status === "failed") {
      throw new Error(`Studio project failed: ${projectId}`)
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(`Studio project timed out after ${maxWaitMs}ms`)
}

// Add music to a project
export async function addMusicToProject(projectId: string, prompt: string, durationSeconds: number): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/${projectId}/music`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      duration_seconds: durationSeconds,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to add music: ${error}`)
  }
}

// Add sound effects to a project
export async function addSoundEffectToProject(
  projectId: string,
  prompt: string,
  positionSeconds: number,
): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/studio/${projectId}/sound-effects`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      position_seconds: positionSeconds,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to add sound effect: ${error}`)
  }
}
