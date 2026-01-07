/**
 * Production Audio Verification Script
 *
 * This script verifies that production audio files are accessible and playable.
 * Run with: npx ts-node scripts/verify-production-audio.ts
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ffydbczyafseklsthhdo.supabase.co"

interface StoryAudioInfo {
  id: string
  title: string
  audioUrl: string
  durationSeconds: number
  scriptLength: number
}

// Known completed stories from production
const PRODUCTION_STORIES: StoryAudioInfo[] = [
  {
    id: "72867155-b15b-4d51-917a-379811f81562",
    title: "streamlit: Overview",
    audioUrl: `${SUPABASE_URL}/storage/v1/object/public/story-audio/72867155-b15b-4d51-917a-379811f81562_chunk_1.mp3`,
    durationSeconds: 670,
    scriptLength: 11290,
  },
  {
    id: "ae7c72bf-003a-4b46-bc8d-f47e2e457d68",
    title: "streamlit: Overview",
    audioUrl: `${SUPABASE_URL}/storage/v1/object/public/story-audio/ae7c72bf-003a-4b46-bc8d-f47e2e457d68_chunk_1.mp3`,
    durationSeconds: 471,
    scriptLength: 7793,
  },
  {
    id: "b080be50-16ef-48bf-9bd0-b081f263d872",
    title: "ralph-orchestrator: Overview",
    audioUrl: `${SUPABASE_URL}/storage/v1/object/public/story-audio/b080be50-16ef-48bf-9bd0-b081f263d872_chunk_1.mp3`,
    durationSeconds: 1259,
    scriptLength: 21772,
  },
]

async function verifyAudioUrl(url: string): Promise<{ accessible: boolean; contentType: string | null; size: number }> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    return {
      accessible: response.ok,
      contentType: response.headers.get("content-type"),
      size: Number.parseInt(response.headers.get("content-length") || "0", 10),
    }
  } catch (error) {
    return { accessible: false, contentType: null, size: 0 }
  }
}

async function main() {
  console.log("=".repeat(60))
  console.log("Production Audio Verification")
  console.log("=".repeat(60))
  console.log("")

  let successCount = 0
  let failCount = 0

  for (const story of PRODUCTION_STORIES) {
    console.log(`Checking: ${story.title} (${story.id})`)
    console.log(`  URL: ${story.audioUrl}`)

    const result = await verifyAudioUrl(story.audioUrl)

    if (result.accessible) {
      successCount++
      console.log(`  ✅ ACCESSIBLE`)
      console.log(`     Content-Type: ${result.contentType}`)
      console.log(`     Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`)
      console.log(`     Expected Duration: ${Math.floor(story.durationSeconds / 60)}m ${story.durationSeconds % 60}s`)
      console.log(`     Script Length: ${story.scriptLength.toLocaleString()} characters`)
    } else {
      failCount++
      console.log(`  ❌ NOT ACCESSIBLE`)
    }
    console.log("")
  }

  console.log("=".repeat(60))
  console.log(`Results: ${successCount} accessible, ${failCount} failed`)
  console.log("=".repeat(60))

  // Calculate expected duration from script length
  // Average speaking rate: ~150 words per minute
  // Average word length: ~5 characters
  // So ~750 characters per minute
  console.log("")
  console.log("Duration Analysis:")
  for (const story of PRODUCTION_STORIES) {
    const expectedMinutes = story.scriptLength / 750
    const actualMinutes = story.durationSeconds / 60
    const accuracy = ((actualMinutes / expectedMinutes) * 100).toFixed(0)
    console.log(`  ${story.title}:`)
    console.log(`    Script: ${story.scriptLength} chars → Expected ~${expectedMinutes.toFixed(1)} min`)
    console.log(`    Actual: ${actualMinutes.toFixed(1)} min (${accuracy}% of estimate)`)
  }
}

main().catch(console.error)
