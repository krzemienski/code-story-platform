/**
 * ElevenLabs API Integration Test Script
 *
 * This script tests the ElevenLabs TTS and Studio API integration
 * Run with: npx ts-node scripts/test-elevenlabs-api.ts
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
}

const results: TestResult[] = []

async function testTTSAPI(): Promise<void> {
  console.log("\n=== Testing ElevenLabs TTS API ===\n")

  const testText = "Hello, this is a test of the ElevenLabs text to speech API integration for Code Tales."
  const voiceId = "21m00Tcm4TlvDq8ikWAM" // Rachel voice

  const startTime = Date.now()

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: testText,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    const duration = Date.now() - startTime

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer()
      console.log(`✅ TTS API: Success - Generated ${audioBuffer.byteLength} bytes in ${duration}ms`)
      results.push({
        name: "TTS API",
        passed: true,
        message: `Generated ${audioBuffer.byteLength} bytes`,
        duration,
      })
    } else {
      const error = await response.text()
      console.log(`❌ TTS API: Failed - ${response.status}: ${error}`)
      results.push({
        name: "TTS API",
        passed: false,
        message: `${response.status}: ${error}`,
        duration,
      })
    }
  } catch (error) {
    console.log(`❌ TTS API: Error - ${error}`)
    results.push({
      name: "TTS API",
      passed: false,
      message: String(error),
    })
  }
}

async function testVoicesList(): Promise<void> {
  console.log("\n=== Testing ElevenLabs Voices List ===\n")

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Voices List: Found ${data.voices?.length || 0} voices`)

      // List first 5 voices
      data.voices?.slice(0, 5).forEach((voice: { name: string; voice_id: string }) => {
        console.log(`   - ${voice.name} (${voice.voice_id})`)
      })

      results.push({
        name: "Voices List",
        passed: true,
        message: `Found ${data.voices?.length || 0} voices`,
      })
    } else {
      const error = await response.text()
      console.log(`❌ Voices List: Failed - ${error}`)
      results.push({
        name: "Voices List",
        passed: false,
        message: error,
      })
    }
  } catch (error) {
    console.log(`❌ Voices List: Error - ${error}`)
    results.push({
      name: "Voices List",
      passed: false,
      message: String(error),
    })
  }
}

async function testStudioAPI(): Promise<void> {
  console.log("\n=== Testing ElevenLabs Studio API ===\n")

  // Test 1: List projects
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/studio/projects", {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Studio Projects List: Found ${data.projects?.length || 0} projects`)
      results.push({
        name: "Studio Projects List",
        passed: true,
        message: `Found ${data.projects?.length || 0} projects`,
      })
    } else {
      const error = await response.text()
      console.log(`❌ Studio Projects List: Failed - ${response.status}: ${error}`)
      results.push({
        name: "Studio Projects List",
        passed: false,
        message: `${response.status}: ${error}`,
      })
    }
  } catch (error) {
    console.log(`❌ Studio Projects List: Error - ${error}`)
    results.push({
      name: "Studio Projects List",
      passed: false,
      message: String(error),
    })
  }

  // Test 2: Create a test project
  console.log("\n--- Creating Test Studio Project ---")

  const testScript = `
    Welcome to Code Tales, where code becomes stories.
    
    This is a test of the ElevenLabs Studio API integration.
    
    The Studio API allows us to create professional podcast-style content
    with multiple voices, music, and sound effects.
    
    Thank you for testing!
  `.trim()

  try {
    const formData = new FormData()
    formData.append("name", `CodeTales Test ${Date.now()}`)
    formData.append("from_document", testScript)
    formData.append("quality_preset", "standard")
    formData.append("title", "Code Tales Test")
    formData.append("author", "Code Tales")

    const response = await fetch("https://api.elevenlabs.io/v1/studio/projects", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Studio Project Create: Created project ${data.project_id}`)
      results.push({
        name: "Studio Project Create",
        passed: true,
        message: `Created project ${data.project_id}`,
      })

      // Store project ID for cleanup
      return data.project_id
    } else {
      const error = await response.text()
      console.log(`❌ Studio Project Create: Failed - ${response.status}: ${error}`)
      results.push({
        name: "Studio Project Create",
        passed: false,
        message: `${response.status}: ${error}`,
      })
    }
  } catch (error) {
    console.log(`❌ Studio Project Create: Error - ${error}`)
    results.push({
      name: "Studio Project Create",
      passed: false,
      message: String(error),
    })
  }
}

async function testUserInfo(): Promise<void> {
  console.log("\n=== Testing ElevenLabs User Info ===\n")

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ User Info:`)
      console.log(`   - Character Count: ${data.subscription?.character_count || 0}`)
      console.log(`   - Character Limit: ${data.subscription?.character_limit || 0}`)
      console.log(`   - Tier: ${data.subscription?.tier || "unknown"}`)

      results.push({
        name: "User Info",
        passed: true,
        message: `Tier: ${data.subscription?.tier}, Characters: ${data.subscription?.character_count}/${data.subscription?.character_limit}`,
      })
    } else {
      const error = await response.text()
      console.log(`❌ User Info: Failed - ${error}`)
      results.push({
        name: "User Info",
        passed: false,
        message: error,
      })
    }
  } catch (error) {
    console.log(`❌ User Info: Error - ${error}`)
    results.push({
      name: "User Info",
      passed: false,
      message: String(error),
    })
  }
}

async function printSummary(): Promise<void> {
  console.log("\n" + "=".repeat(50))
  console.log("TEST SUMMARY")
  console.log("=".repeat(50) + "\n")

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  results.forEach((r) => {
    const icon = r.passed ? "✅" : "❌"
    const duration = r.duration ? ` (${r.duration}ms)` : ""
    console.log(`${icon} ${r.name}: ${r.message}${duration}`)
  })

  console.log("\n" + "-".repeat(50))
  console.log(`Total: ${passed} passed, ${failed} failed`)
  console.log("-".repeat(50) + "\n")
}

async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════════════╗")
  console.log("║     ElevenLabs API Integration Test Suite      ║")
  console.log("╚════════════════════════════════════════════════╝")

  if (!ELEVENLABS_API_KEY) {
    console.error("\n❌ ERROR: ELEVENLABS_API_KEY environment variable not set\n")
    process.exit(1)
  }

  console.log(`\nAPI Key: ${ELEVENLABS_API_KEY.substring(0, 8)}...${ELEVENLABS_API_KEY.substring(-4)}`)

  await testUserInfo()
  await testVoicesList()
  await testTTSAPI()
  await testStudioAPI()

  await printSummary()
}

main().catch(console.error)
