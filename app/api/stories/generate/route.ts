// Story Generation API - Orchestrates the full pipeline with detailed logging

import { generateText } from "ai"
import { createServiceClient } from "@/lib/supabase/service"
import { analyzeRepository, summarizeRepoStructure } from "@/lib/agents/github"
import { getStoryPrompt } from "@/lib/agents/prompts"
import { log } from "@/lib/agents/log-helper"

export const maxDuration = 300 // 5 minutes max

interface GenerateRequest {
  storyId: string
}

function splitTextIntoChunks(text: string, maxChars = 9500): string[] {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining)
      break
    }

    // Find the last sentence boundary within the limit
    let splitIndex = maxChars
    const searchText = remaining.slice(0, maxChars)

    // Try to split on paragraph breaks first
    const lastParagraph = searchText.lastIndexOf("\n\n")
    if (lastParagraph > maxChars * 0.5) {
      splitIndex = lastParagraph + 2
    } else {
      // Fall back to sentence boundaries
      const lastPeriod = searchText.lastIndexOf(". ")
      const lastQuestion = searchText.lastIndexOf("? ")
      const lastExclaim = searchText.lastIndexOf("! ")
      const lastEllipsis = searchText.lastIndexOf("... ")

      splitIndex = Math.max(lastPeriod, lastQuestion, lastExclaim, lastEllipsis)

      if (splitIndex < maxChars * 0.3) {
        splitIndex = searchText.lastIndexOf(" ")
      }

      if (splitIndex > 0) {
        splitIndex += 1
      } else {
        splitIndex = maxChars
      }
    }

    chunks.push(remaining.slice(0, splitIndex).trim())
    remaining = remaining.slice(splitIndex).trim()
  }

  return chunks
}

export async function POST(req: Request) {
  const { storyId }: GenerateRequest = await req.json()

  const supabase = createServiceClient()

  console.log("[v0] Starting story generation for:", storyId)

  await log.system(storyId, "Story generation initiated", { storyId })

  // Fetch story details
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*, code_repositories(*)")
    .eq("id", storyId)
    .single()

  if (storyError || !story) {
    console.error("[v0] Story not found:", storyError)
    await log.system(storyId, "Story not found", { error: storyError?.message }, "error")
    return Response.json({ error: "Story not found" }, { status: 404 })
  }

  console.log("[v0] Story loaded:", story.title)

  await log.system(storyId, "Story configuration loaded", {
    title: story.title,
    style: story.narrative_style,
    duration: story.target_duration_minutes,
  })

  try {
    // Update status to analyzing
    const { error: updateError } = await supabase
      .from("stories")
      .update({
        status: "analyzing",
        progress: 5,
        progress_message: "Connecting to GitHub...",
        processing_started_at: new Date().toISOString(),
      })
      .eq("id", storyId)

    if (updateError) {
      console.error("[v0] Failed to update story status:", updateError)
    }

    const repo = story.code_repositories

    // ===== ANALYZER AGENT =====
    await log.analyzer(storyId, "Connecting to GitHub API", {
      repo: `${repo.repo_owner}/${repo.repo_name}`,
    })

    await supabase
      .from("stories")
      .update({
        progress: 10,
        progress_message: "Fetching repository metadata...",
      })
      .eq("id", storyId)

    await log.analyzer(storyId, "Fetching repository metadata", {})

    // Step 1: Analyze repository
    console.log("[v0] Analyzing repository:", repo.repo_owner, repo.repo_name)
    const analysis = await analyzeRepository(repo.repo_owner, repo.repo_name)

    await log.analyzer(
      storyId,
      "Repository metadata retrieved",
      {
        stars: analysis.metadata?.stargazers_count,
        forks: analysis.metadata?.forks_count,
        language: analysis.metadata?.language,
      },
      "success",
    )

    await supabase
      .from("stories")
      .update({
        progress: 15,
        progress_message: "Scanning directory structure...",
      })
      .eq("id", storyId)

    await log.analyzer(storyId, "Scanning directory structure", {
      totalFiles: analysis.structure.length,
    })

    await log.analyzer(
      storyId,
      "Identified key directories",
      {
        directories: analysis.keyDirectories.slice(0, 5),
      },
      "success",
    )

    await supabase
      .from("stories")
      .update({
        progress: 20,
        progress_message: "Analyzing package dependencies...",
      })
      .eq("id", storyId)

    await log.analyzer(storyId, "Analyzing package.json", {
      hasDependencies: !!analysis.packageJson?.dependencies,
      dependencyCount: Object.keys(analysis.packageJson?.dependencies || {}).length,
    })

    if (analysis.readme) {
      await log.analyzer(storyId, "Reading README.md", {
        length: analysis.readme.length,
      })
    }

    const repoSummary = summarizeRepoStructure(analysis)
    console.log("[v0] Repo analysis complete, summary length:", repoSummary.length)

    await log.analyzer(
      storyId,
      "Analysis complete",
      {
        filesAnalyzed: analysis.structure.length,
        keyDirectories: analysis.keyDirectories.length,
      },
      "success",
    )

    // Cache analysis
    await supabase
      .from("code_repositories")
      .update({
        analysis_cache: analysis,
        analysis_cached_at: new Date().toISOString(),
      })
      .eq("id", repo.id)

    // ===== ARCHITECT AGENT =====
    await supabase
      .from("stories")
      .update({
        status: "generating",
        progress: 30,
        progress_message: "Building architecture map...",
      })
      .eq("id", storyId)

    await log.architect(storyId, "Building dependency graph", {})

    await log.architect(storyId, "Identifying core modules", {
      modules: analysis.keyDirectories.slice(0, 4),
    })

    await supabase
      .from("stories")
      .update({
        progress: 40,
        progress_message: "Mapping code patterns...",
      })
      .eq("id", storyId)

    await log.architect(storyId, "Mapping data flow patterns", {})

    await log.architect(
      storyId,
      "Architecture map complete",
      {
        components: analysis.keyDirectories.length,
      },
      "success",
    )

    // ===== NARRATOR AGENT =====
    await supabase
      .from("stories")
      .update({
        progress: 50,
        progress_message: "Generating narrative outline...",
      })
      .eq("id", storyId)

    await log.narrator(storyId, "Generating narrative outline", {
      style: story.narrative_style,
      targetMinutes: story.target_duration_minutes,
    })

    const systemPrompt = getStoryPrompt(story.narrative_style, story.expertise_level || "intermediate")
    const targetMinutes = story.target_duration_minutes || 15
    const targetWords = targetMinutes * 150

    console.log("[v0] Generating script with Claude, target words:", targetWords)

    await log.narrator(storyId, "Writing script with Claude", {
      model: "claude-sonnet-4-20250514",
      targetWords,
    })

    const { text: script } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: `Create an audio narrative script for the repository ${repo.repo_owner}/${repo.repo_name}.

USER'S INTENT: ${story.title}

REPOSITORY ANALYSIS:
${repoSummary}

KEY DIRECTORIES TO COVER:
${analysis.keyDirectories.slice(0, 10).join("\n")}

TARGET LENGTH: ${targetWords} words (~${targetMinutes} minutes of audio)

Generate a complete, engaging narrative script that would be read aloud. Include natural pauses (...) and organize into clear sections. Do NOT include any markdown headers or formatting - just natural prose with paragraph breaks.

Begin the narrative now:`,
      maxTokens: 8000,
      temperature: 0.7,
    })

    const actualWords = script.split(/\s+/).length
    console.log("[v0] Script generated, actual words:", actualWords)

    await log.narrator(
      storyId,
      "Script draft complete",
      {
        words: actualWords,
        estimatedMinutes: Math.round(actualWords / 150),
      },
      "success",
    )

    await supabase
      .from("stories")
      .update({
        progress: 60,
        progress_message: "Structuring chapters...",
        script_text: script,
      })
      .eq("id", storyId)

    await log.narrator(storyId, "Generating chapter breakdown", {})

    // Generate chapter breakdown
    const { text: chaptersJson } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `Given this narrative script, create a JSON array of chapters with titles and approximate timestamps.

SCRIPT:
${script.slice(0, 4000)}

Output a JSON array like this (estimate timestamps based on ~150 words per minute):
[
  {"number": 1, "title": "Introduction", "start_time_seconds": 0, "duration_seconds": 120},
  {"number": 2, "title": "Architecture Overview", "start_time_seconds": 120, "duration_seconds": 180},
  ...
]

Output ONLY valid JSON, no other text:`,
      maxTokens: 1000,
    })

    let chapters = []
    try {
      chapters = JSON.parse(chaptersJson.trim())
      console.log("[v0] Chapters parsed:", chapters.length)
      await log.narrator(
        storyId,
        "Chapters structured",
        {
          chapterCount: chapters.length,
        },
        "success",
      )
    } catch {
      console.log("[v0] Chapter parsing failed, using single chapter")
      chapters = [{ number: 1, title: "Full Narrative", start_time_seconds: 0, duration_seconds: targetMinutes * 60 }]
      await log.narrator(storyId, "Using single chapter fallback", {}, "warning")
    }

    await supabase
      .from("stories")
      .update({
        chapters,
        progress: 70,
        progress_message: "Script complete. Preparing audio synthesis...",
      })
      .eq("id", storyId)

    // ===== SYNTHESIZER AGENT =====
    await supabase
      .from("stories")
      .update({
        status: "synthesizing",
        progress: 75,
        progress_message: "Initializing ElevenLabs...",
      })
      .eq("id", storyId)

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY
    console.log("[v0] ElevenLabs key available:", !!elevenLabsKey)

    if (elevenLabsKey) {
      const voiceId = story.voice_id || "21m00Tcm4TlvDq8ikWAM"

      await log.synthesizer(storyId, "Initializing ElevenLabs voice synthesis", {
        voice: voiceId,
        model: "eleven_multilingual_v2",
      })

      const scriptChunks = splitTextIntoChunks(script, 9500)
      console.log("[v0] Script split into", scriptChunks.length, "chunks")

      await log.synthesizer(storyId, "Script chunked for synthesis", {
        totalLength: script.length,
        chunks: scriptChunks.length,
        chunkLengths: scriptChunks.map((c) => c.length),
      })

      await supabase
        .from("stories")
        .update({
          progress: 78,
          progress_message: `Generating audio (0/${scriptChunks.length} chunks)...`,
        })
        .eq("id", storyId)

      try {
        const audioBuffers: ArrayBuffer[] = []
        const requestIds: string[] = []

        for (let i = 0; i < scriptChunks.length; i++) {
          const chunk = scriptChunks[i]
          const chunkNum = i + 1

          console.log(`[v0] Processing chunk ${chunkNum}/${scriptChunks.length}, length: ${chunk.length}`)

          await log.synthesizer(storyId, `Processing chunk ${chunkNum}/${scriptChunks.length}`, {
            chunkLength: chunk.length,
            preview: chunk.slice(0, 100) + "...",
          })

          await supabase
            .from("stories")
            .update({
              progress: 78 + Math.round((i / scriptChunks.length) * 12),
              progress_message: `Generating audio (${chunkNum}/${scriptChunks.length} chunks)...`,
            })
            .eq("id", storyId)

          const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: chunk,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.2,
                use_speaker_boost: true,
              },
              // Use previous chunk text for continuity
              previous_text: i > 0 ? scriptChunks[i - 1].slice(-500) : undefined,
              next_text: i < scriptChunks.length - 1 ? scriptChunks[i + 1].slice(0, 500) : undefined,
            }),
          })

          if (!audioResponse.ok) {
            const errorText = await audioResponse.text()
            console.error(`[v0] ElevenLabs error on chunk ${chunkNum}:`, errorText)
            await log.synthesizer(
              storyId,
              `Chunk ${chunkNum} failed`,
              {
                status: audioResponse.status,
                error: errorText.slice(0, 200),
              },
              "error",
            )
            throw new Error(`ElevenLabs API error on chunk ${chunkNum}: ${errorText}`)
          }

          // Get request ID for continuity tracking
          const requestId = audioResponse.headers.get("request-id")
          if (requestId) {
            requestIds.push(requestId)
          }

          const buffer = await audioResponse.arrayBuffer()
          audioBuffers.push(buffer)

          console.log(`[v0] Chunk ${chunkNum} complete, size: ${buffer.byteLength} bytes`)

          await log.synthesizer(
            storyId,
            `Chunk ${chunkNum} complete`,
            {
              sizeBytes: buffer.byteLength,
              requestId,
            },
            "success",
          )
        }

        const totalBytes = audioBuffers.reduce((sum, b) => sum + b.byteLength, 0)
        console.log("[v0] All chunks synthesized, total bytes:", totalBytes)

        await log.synthesizer(
          storyId,
          "All chunks synthesized",
          {
            totalChunks: audioBuffers.length,
            totalBytes,
          },
          "success",
        )

        await supabase
          .from("stories")
          .update({
            progress: 92,
            progress_message: "Combining audio chunks...",
          })
          .eq("id", storyId)

        const combinedBuffer = new Uint8Array(totalBytes)
        let offset = 0
        for (const buffer of audioBuffers) {
          combinedBuffer.set(new Uint8Array(buffer), offset)
          offset += buffer.byteLength
        }

        console.log("[v0] Audio combined, uploading to storage...")

        await log.synthesizer(
          storyId,
          "Audio combined",
          {
            totalSizeBytes: combinedBuffer.byteLength,
          },
          "success",
        )

        await supabase
          .from("stories")
          .update({
            progress: 95,
            progress_message: "Uploading audio file...",
          })
          .eq("id", storyId)

        await log.synthesizer(storyId, "Uploading to storage", {})

        const fileName = `${storyId}.mp3`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("story-audio")
          .upload(fileName, combinedBuffer.buffer, {
            contentType: "audio/mpeg",
            upsert: true,
          })

        if (uploadError) {
          console.error("[v0] Upload error:", uploadError)
          await log.synthesizer(
            storyId,
            "Upload failed",
            {
              error: uploadError.message,
            },
            "error",
          )
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        console.log("[v0] Upload successful:", uploadData)

        const {
          data: { publicUrl },
        } = supabase.storage.from("story-audio").getPublicUrl(fileName)

        console.log("[v0] Public URL:", publicUrl)

        // Estimate duration: ~2.5 words per second at normal speaking pace
        const estimatedDuration = Math.round(actualWords / 2.5)

        await log.synthesizer(
          storyId,
          "Audio upload complete",
          {
            url: publicUrl,
            sizeBytes: combinedBuffer.byteLength,
            durationSeconds: estimatedDuration,
          },
          "success",
        )

        await log.system(
          storyId,
          "Story generation complete!",
          {
            totalDuration: estimatedDuration,
            chapters: chapters.length,
          },
          "success",
        )

        const { error: finalUpdateError } = await supabase
          .from("stories")
          .update({
            audio_url: publicUrl,
            actual_duration_seconds: estimatedDuration,
            status: "completed",
            progress: 100,
            progress_message: "Story generated successfully!",
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", storyId)

        if (finalUpdateError) {
          console.error("[v0] Final update error:", finalUpdateError)
        }

        console.log("[v0] Story generation complete!")

        return Response.json({
          success: true,
          audioUrl: publicUrl,
          duration: estimatedDuration,
        })
      } catch (audioError) {
        console.error("[v0] Audio generation error:", audioError)
        await log.synthesizer(
          storyId,
          "Audio generation failed",
          {
            error: audioError instanceof Error ? audioError.message : "Unknown error",
          },
          "error",
        )

        // Mark as failed, not completed
        await supabase
          .from("stories")
          .update({
            status: "failed",
            error_message: audioError instanceof Error ? audioError.message : "Audio generation failed",
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", storyId)

        return Response.json({ error: "Audio generation failed" }, { status: 500 })
      }
    } else {
      console.log("[v0] No ElevenLabs key, completing without audio")
      await log.synthesizer(storyId, "ElevenLabs API key not configured", {}, "warning")

      // Fallback: complete without audio
      await log.system(storyId, "Completing with script only", {}, "warning")

      await supabase
        .from("stories")
        .update({
          status: "completed",
          progress: 100,
          progress_message: "Script generated (audio pending)",
          processing_completed_at: new Date().toISOString(),
        })
        .eq("id", storyId)

      return Response.json({
        success: true,
        message: "Script generated successfully",
        hasAudio: false,
      })
    }
  } catch (error) {
    console.error("[v0] Generation failed:", error)
    await log.system(
      storyId,
      "Generation failed",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "error",
    )

    await supabase
      .from("stories")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", storyId)

    return Response.json({ error: "Generation failed" }, { status: 500 })
  }
}
