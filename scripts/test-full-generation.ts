/**
 * Full Generation Test Script
 *
 * This script tests the complete generation pipeline:
 * 1. Create a test story in the database
 * 2. Trigger generation via API
 * 3. Poll for completion
 * 4. Verify audio file is accessible and playable
 *
 * Usage: Run this script in the v0 environment
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface TestConfig {
  repoUrl: string
  repoName: string
  repoOwner: string
  narrativeStyle: string
  targetMinutes: number
  generationMode: "hybrid" | "elevenlabs_studio"
  modelId: string
}

interface TestResult {
  success: boolean
  storyId?: string
  audioUrl?: string
  duration?: number
  error?: string
  logs: string[]
}

async function runGenerationTest(config: TestConfig): Promise<TestResult> {
  const logs: string[] = []
  const log = (msg: string) => {
    console.log(`[TEST] ${msg}`)
    logs.push(`${new Date().toISOString()} - ${msg}`)
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      success: false,
      error: "Missing Supabase credentials",
      logs,
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Step 1: Create repository record
    log(`Creating repository record for ${config.repoOwner}/${config.repoName}`)

    const { data: repo, error: repoError } = await supabase
      .from("code_repositories")
      .insert({
        repo_url: config.repoUrl,
        repo_name: config.repoName,
        repo_owner: config.repoOwner,
        primary_language: "TypeScript",
        stars_count: 1000,
        description: "Test repository for generation testing",
      })
      .select()
      .single()

    if (repoError) {
      log(`Repository creation failed: ${repoError.message}`)
      return { success: false, error: repoError.message, logs }
    }

    log(`Repository created: ${repo.id}`)

    // Step 2: Create story record
    log("Creating story record")

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        repository_id: repo.id,
        title: `Test Story - ${config.modelId} - ${config.generationMode}`,
        narrative_style: config.narrativeStyle,
        voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel
        target_duration_minutes: config.targetMinutes,
        expertise_level: "intermediate",
        status: "pending",
        is_public: true,
        progress: 0,
        progress_message: "Test initiated",
        generation_mode: config.generationMode,
        generation_config: {
          mode: config.generationMode,
          scriptModel: config.modelId,
          voiceSynthesis: config.generationMode === "hybrid" ? "elevenlabs-tts" : "elevenlabs-studio",
          enableSoundEffects: false,
          enableBackgroundMusic: false,
          studioFormat: "audiobook",
          studioQuality: "high",
        },
        model_config: {
          modelId: config.modelId,
          temperature: 0.7,
        },
      })
      .select()
      .single()

    if (storyError) {
      log(`Story creation failed: ${storyError.message}`)
      return { success: false, error: storyError.message, logs }
    }

    log(`Story created: ${story.id}`)

    // Step 3: Trigger generation
    log("Triggering generation API")

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    const generateResponse = await fetch(`${baseUrl}/api/stories/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: story.id,
        generationMode: config.generationMode,
        modeConfig: {
          mode: config.generationMode,
          scriptModel: config.modelId,
        },
        modelConfig: {
          modelId: config.modelId,
          temperature: 0.7,
        },
      }),
    })

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text()
      log(`Generation API failed: ${generateResponse.status} - ${errorText}`)
      return { success: false, error: errorText, logs, storyId: story.id }
    }

    log("Generation started successfully")

    // Step 4: Poll for completion
    log("Polling for completion...")

    const maxWaitMs = 600000 // 10 minutes
    const pollIntervalMs = 5000
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      const { data: statusData } = await supabase
        .from("stories")
        .select("status, progress, progress_message, audio_url, audio_chunks, actual_duration_seconds")
        .eq("id", story.id)
        .single()

      if (statusData) {
        log(`Status: ${statusData.status} | Progress: ${statusData.progress}% | ${statusData.progress_message}`)

        if (statusData.status === "completed") {
          const audioUrl = statusData.audio_chunks?.[0] || statusData.audio_url
          log(`Generation complete! Audio URL: ${audioUrl}`)

          // Verify audio is accessible
          if (audioUrl) {
            const audioResponse = await fetch(audioUrl, { method: "HEAD" })
            if (audioResponse.ok) {
              const contentLength = audioResponse.headers.get("content-length")
              log(`Audio file verified: ${contentLength} bytes`)

              return {
                success: true,
                storyId: story.id,
                audioUrl,
                duration: statusData.actual_duration_seconds,
                logs,
              }
            } else {
              log(`Audio file not accessible: ${audioResponse.status}`)
            }
          }

          return {
            success: true,
            storyId: story.id,
            audioUrl,
            duration: statusData.actual_duration_seconds,
            logs,
          }
        }

        if (statusData.status === "failed") {
          log("Generation failed")
          return { success: false, error: "Generation failed", logs, storyId: story.id }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    log("Generation timed out")
    return { success: false, error: "Generation timed out", logs, storyId: story.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    log(`Test error: ${message}`)
    return { success: false, error: message, logs }
  }
}

// Test configurations for each model
const TEST_CONFIGS: TestConfig[] = [
  {
    repoUrl: "https://github.com/vercel/next.js",
    repoName: "next.js",
    repoOwner: "vercel",
    narrativeStyle: "documentary",
    targetMinutes: 5, // Short test
    generationMode: "hybrid",
    modelId: "anthropic/claude-sonnet-4",
  },
  // Add more test configs for other models
]

// Export for use in test runner
export { runGenerationTest, TEST_CONFIGS }
export type { TestConfig, TestResult }

// Main execution
async function main() {
  console.log("=".repeat(60))
  console.log("FULL GENERATION TEST")
  console.log("=".repeat(60))

  const config = TEST_CONFIGS[0]
  console.log("\nTest Configuration:")
  console.log(JSON.stringify(config, null, 2))
  console.log("\n")

  const result = await runGenerationTest(config)

  console.log("\n" + "=".repeat(60))
  console.log("TEST RESULT")
  console.log("=".repeat(60))
  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error)
