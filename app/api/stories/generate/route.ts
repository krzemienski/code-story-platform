// Story Generation API - Orchestrates the full pipeline with detailed logging

import { generateText } from "ai"
import { createServiceClient } from "@/lib/supabase/service"
import { analyzeRepository, summarizeRepoStructure } from "@/lib/agents/github"
import { getStoryPrompt } from "@/lib/agents/prompts"
import { log } from "@/lib/agents/log-helper"
import { AI_MODELS, getModelConfiguration, getPromptOptimizations, recommendModel } from "@/lib/ai/models"
import { generateAudioWithStudio, getRecommendedVoiceForStyle } from "@/lib/generation/elevenlabs-studio"
import { type GenerationModeConfig, validateScriptLength } from "@/lib/generation/modes"

export const maxDuration = 300 // 5 minutes max (Vercel limit)

interface GenerateRequest {
  storyId: string
  generationMode?: "hybrid" | "elevenlabs_studio"
  modeConfig?: GenerationModeConfig
  modelConfig?: {
    modelId?: string
    temperature?: number
  }
}

function splitTextIntoChunks(text: string, maxChars = 4000): string[] {
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
  const startTime = Date.now()
  const TIMEOUT_WARNING_MS = 240000 // 4 minutes - warn before Vercel cuts us off

  try {
    const { storyId, generationMode, modeConfig, modelConfig }: GenerateRequest = await req.json()

    console.log("[v0] ====== TALE GENERATION STARTED ======")
    console.log("[v0] Tale ID:", storyId)
    console.log("[v0] Generation Mode:", generationMode || "hybrid")
    console.log("[v0] Mode Config:", modeConfig)
    console.log("[v0] Model Config:", modelConfig)
    console.log("[v0] Timestamp:", new Date().toISOString())

    let supabase
    try {
      supabase = createServiceClient()
      console.log("[v0] Service client created successfully")
    } catch (clientError) {
      console.error("[v0] FATAL: Failed to create service client:", clientError)
      return Response.json({ error: "Database connection failed" }, { status: 500 })
    }

    try {
      await log.system(storyId, "Tale generation initiated", { storyId, timestamp: new Date().toISOString() })
      console.log("[v0] Initial log written successfully")
    } catch (logError) {
      console.error("[v0] Warning: Log writing failed:", logError)
    }

    // Fetch tale details
    console.log("[v0] Fetching tale details...")
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, code_repositories(*)")
      .eq("id", storyId)
      .single()

    if (storyError || !story) {
      console.error("[v0] Tale not found:", storyError)
      await log.system(storyId, "Tale not found", { error: storyError?.message }, "error")
      return Response.json({ error: "Tale not found" }, { status: 404 })
    }

    const targetMinutes = story.target_duration_minutes || 15
    const activeGenerationMode = generationMode || story.generation_mode || "hybrid"
    const activeModeConfig = modeConfig || story.generation_config || {}

    // Determine model based on mode and config
    let selectedModelId = modelConfig?.modelId || activeModeConfig?.modelConfig?.modelId || story.model_config?.modelId

    // If no model specified, auto-recommend based on content
    if (!selectedModelId || !AI_MODELS[selectedModelId]?.isAvailable) {
      const recommended = recommendModel({
        narrativeStyle: story.narrative_style,
        expertiseLevel: story.expertise_level || "intermediate",
        targetDurationMinutes: targetMinutes,
        prioritize: story.model_config?.priority || "quality",
      })
      selectedModelId = recommended.id
      console.log("[v0] Auto-selected model:", selectedModelId)
    }

    const modelDef = AI_MODELS[selectedModelId]
    const modelConfigData = getModelConfiguration(selectedModelId, story.narrative_style, targetMinutes)
    const promptOptimizations = getPromptOptimizations(selectedModelId)

    // Override temperature if specified
    if (modelConfig?.temperature !== undefined) {
      modelConfigData.temperature = modelConfig.temperature
    }

    console.log("[v0] Tale loaded:", story.title)
    console.log("[v0] Generation Mode:", activeGenerationMode)
    console.log("[v0] Using model:", modelDef.displayName, "(", selectedModelId, ")")
    console.log("[v0] Model config:", modelConfigData)

    // Fetch intent data if available for enhanced personalization
    let intentContext = ""
    if (story.intent_id) {
      console.log("[v0] Fetching intent data for tale...")
      const { data: intent, error: intentError } = await supabase
        .from("story_intents")
        .select("user_description, focus_areas, intent_category")
        .eq("id", story.intent_id)
        .single()

      if (intent && !intentError) {
        intentContext = `
USER'S LEARNING GOAL: ${intent.user_description || "General exploration"}
FOCUS AREAS: ${(intent.focus_areas as string[])?.join(", ") || "All areas"}
INTENT TYPE: ${intent.intent_category || "general"}`
        console.log("[v0] Intent context loaded:", intent.intent_category)
      }
    }

    await log.system(storyId, "Tale configuration loaded", {
      title: story.title,
      style: story.narrative_style,
      duration: story.target_duration_minutes,
      model: selectedModelId,
      generationMode: activeGenerationMode,
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
        console.error("[v0] Failed to update tale status:", updateError)
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
          files: analysis.structure?.length || 0,
          readme: !!analysis.readme,
          languages: Object.keys(analysis.languages || {}),
        },
        "success",
      )

      await supabase
        .from("stories")
        .update({
          progress: 25,
          progress_message: "Analyzing code structure...",
        })
        .eq("id", storyId)

      // Get summarized structure for the prompt
      const repoStructure = summarizeRepoStructure(analysis)

      await log.analyzer(
        storyId,
        "Code analysis complete",
        {
          structureLength: repoStructure.length,
        },
        "success",
      )

      await supabase
        .from("stories")
        .update({
          progress: 35,
          progress_message: "Preparing AI context...",
        })
        .eq("id", storyId)

      // ===== WRITER AGENT =====
      await log.writer(storyId, "Preparing script generation prompt", {
        model: selectedModelId,
        style: story.narrative_style,
        targetMinutes: targetMinutes,
        targetWords: targetMinutes * 150,
      })

      // Build the comprehensive prompt
      const prompt = getStoryPrompt({
        repoName: repo.repo_name,
        repoOwner: repo.repo_owner,
        description: repo.description || "A software project",
        structure: repoStructure,
        readme: analysis.readme || "",
        narrativeStyle: story.narrative_style,
        targetDurationMinutes: targetMinutes,
        expertiseLevel: story.expertise_level || "intermediate",
        additionalContext: intentContext,
      })

      // Add model-specific optimizations to the prompt
      const fullPrompt = promptOptimizations.specialInstructions
        ? `${prompt}\n\n${promptOptimizations.specialInstructions}`
        : prompt

      await log.writer(storyId, "Prompt prepared", {
        promptLength: fullPrompt.length,
        hasModelOptimizations: !!promptOptimizations.specialInstructions,
      })

      console.log("[v0] Prompt prepared, length:", fullPrompt.length)

      await supabase
        .from("stories")
        .update({
          progress: 40,
          progress_message: `Generating script with ${modelDef.displayName}...`,
        })
        .eq("id", storyId)

      await log.writer(storyId, `Calling ${modelDef.displayName} for script generation`, {
        temperature: modelConfigData.temperature,
        maxTokens: modelConfigData.maxTokens,
      })

      // Generate the script using selected model
      console.log("[v0] Calling AI model:", selectedModelId)
      const { text: script } = await generateText({
        model: selectedModelId,
        prompt: fullPrompt,
        temperature: modelConfigData.temperature,
        maxTokens: modelConfigData.maxTokens,
      })

      console.log("[v0] Script generated, length:", script.length)
      const actualWords = script.split(/\s+/).length
      console.log("[v0] Word count:", actualWords)

      const validation = validateScriptLength(actualWords, targetMinutes)
      console.log("[v0] Script validation:", validation)

      await log.writer(
        storyId,
        "Script generated successfully",
        {
          length: script.length,
          words: actualWords,
          estimatedMinutes: Math.round(actualWords / 150),
          validation: validation.message,
        },
        "success",
      )

      // Parse chapters from script
      const chapterMatches = script.matchAll(/(?:^|\n)(?:#{1,3}|Chapter\s+\d+[:\s]*|Part\s+\d+[:\s]*)\s*([^\n]+)/gi)
      const chapters = []
      let lastIndex = 0
      for (const match of chapterMatches) {
        if (match.index !== undefined) {
          chapters.push({
            number: chapters.length + 1,
            title: match[1].trim(),
            start_time_seconds: Math.round((lastIndex / script.length) * (actualWords / 2.5)),
            duration_seconds: 0,
          })
          lastIndex = match.index
        }
      }

      if (chapters.length === 0) {
        chapters.push({
          number: 1,
          title: story.title || "Introduction",
          start_time_seconds: 0,
          duration_seconds: Math.round(actualWords / 2.5),
        })
      }

      await log.writer(storyId, "Chapters parsed", {
        count: chapters.length,
        titles: chapters.map((c: { title: string }) => c.title),
      })

      await supabase
        .from("stories")
        .update({
          script_text: script,
          chapters,
          progress: 75,
          progress_message: "Script complete. Starting audio synthesis...",
        })
        .eq("id", storyId)

      // ===== SYNTHESIZER AGENT =====
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY

      if (elevenLabsKey) {
        const voiceId = story.voice_id || getRecommendedVoiceForStyle(story.narrative_style)

        if (activeGenerationMode === "elevenlabs_studio") {
          // ===== ELEVENLABS STUDIO API MODE =====
          await log.synthesizer(storyId, "Using ElevenLabs Studio API for audio production", {
            format: activeModeConfig.studioFormat || "audiobook",
            enableMusic: activeModeConfig.enableBackgroundMusic,
            enableSFX: activeModeConfig.enableSoundEffects,
          })

          try {
            await supabase
              .from("stories")
              .update({
                progress: 78,
                progress_message: "Creating ElevenLabs Studio project...",
              })
              .eq("id", storyId)

            const studioResult = await generateAudioWithStudio({
              name: `${repo.repo_name} - ${story.narrative_style}`,
              content: script,
              voiceId,
              modelId: "eleven_multilingual_v2",
              title: story.title,
              author: repo.repo_owner,
              qualityPreset: "high",
              onProgress: async (stage, message, progress) => {
                console.log(`[v0] Studio progress: ${stage} - ${message} (${progress}%)`)
                await log.synthesizer(storyId, message, { stage, progress })
                await supabase
                  .from("stories")
                  .update({
                    progress: 78 + Math.round(progress * 0.17), // 78-95%
                    progress_message: message,
                  })
                  .eq("id", storyId)
              },
            })

            // Upload audio to Supabase storage
            const fileName = `${storyId}_studio.mp3`
            const audioBlob = new Blob([studioResult.audioBuffer], { type: "audio/mpeg" })

            const { error: uploadError } = await supabase.storage.from("story-audio").upload(fileName, audioBlob, {
              contentType: "audio/mpeg",
              upsert: true,
            })

            if (uploadError) {
              throw new Error(`Failed to upload audio: ${uploadError.message}`)
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from("story-audio").getPublicUrl(fileName)

            await log.synthesizer(
              storyId,
              "ElevenLabs Studio audio complete",
              {
                projectId: studioResult.projectId,
                duration: studioResult.durationSeconds,
                audioUrl: publicUrl,
              },
              "success",
            )

            await log.system(
              storyId,
              "Tale generation complete!",
              {
                totalDuration: studioResult.durationSeconds,
                mode: "elevenlabs_studio",
              },
              "success",
            )

            await supabase
              .from("stories")
              .update({
                audio_url: publicUrl,
                audio_chunks: [publicUrl],
                actual_duration_seconds: studioResult.durationSeconds,
                status: "completed",
                progress: 100,
                progress_message: "Tale generated successfully with ElevenLabs Studio!",
                processing_completed_at: new Date().toISOString(),
              })
              .eq("id", storyId)

            return Response.json({
              success: true,
              audioUrl: publicUrl,
              duration: studioResult.durationSeconds,
              mode: "elevenlabs_studio",
            })
          } catch (studioError) {
            console.error("[v0] ElevenLabs Studio error:", studioError)
            await log.synthesizer(
              storyId,
              "Studio API failed, falling back to TTS",
              { error: studioError instanceof Error ? studioError.message : "Unknown error" },
              "warning",
            )
            // Fall through to standard TTS below
          }
        }

        // ===== STANDARD TTS MODE (hybrid or fallback) =====
        const modelId = "eleven_flash_v2_5"
        const maxChunkSize = 10000 // Larger chunks for fewer API calls

        await log.synthesizer(storyId, "Initializing ElevenLabs voice synthesis", {
          voice: voiceId,
          model: modelId,
          totalScriptLength: script.length,
        })

        const scriptChunks = splitTextIntoChunks(script, maxChunkSize)
        console.log("[v0] Script split into", scriptChunks.length, "chunks using model:", modelId)

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
          const chapterAudioUrls: string[] = []

          for (let i = 0; i < scriptChunks.length; i++) {
            const chunk = scriptChunks[i]
            const chunkNum = i + 1

            const chunkElapsed = Date.now() - startTime
            if (chunkElapsed > 270000) {
              // 4.5 minutes - leave buffer for upload
              console.log("[v0] TIMEOUT WARNING: Stopping audio generation to save progress")
              await log.synthesizer(
                storyId,
                "Timeout - saving partial progress",
                {
                  completedChunks: i,
                  totalChunks: scriptChunks.length,
                },
                "warning",
              )

              // Save what we have so far
              if (chapterAudioUrls.length > 0) {
                const partialDuration = Math.round(
                  ((actualWords / scriptChunks.length) * chapterAudioUrls.length) / 2.5,
                )

                await supabase
                  .from("stories")
                  .update({
                    audio_url: chapterAudioUrls[0],
                    audio_chunks: chapterAudioUrls,
                    actual_duration_seconds: partialDuration,
                    status: "completed",
                    progress: 100,
                    progress_message: `Completed with ${chapterAudioUrls.length}/${scriptChunks.length} audio chunks (timeout)`,
                    processing_completed_at: new Date().toISOString(),
                  })
                  .eq("id", storyId)

                return Response.json({
                  success: true,
                  partial: true,
                  audioUrl: chapterAudioUrls[0],
                  audioChunks: chapterAudioUrls,
                  completedChunks: chapterAudioUrls.length,
                  totalChunks: scriptChunks.length,
                })
              }
              break
            }

            console.log(`[v0] Processing chunk ${chunkNum}/${scriptChunks.length}, length: ${chunk.length}`)

            await log.synthesizer(storyId, `Processing chunk ${chunkNum}/${scriptChunks.length}`, {
              chunkLength: chunk.length,
              preview: chunk.slice(0, 100) + "...",
            })

            await supabase
              .from("stories")
              .update({
                progress: 78 + Math.round((i / scriptChunks.length) * 15),
                progress_message: `Generating audio (${chunkNum}/${scriptChunks.length} chunks)...`,
              })
              .eq("id", storyId)

            const audioResponse = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
              {
                method: "POST",
                headers: {
                  "xi-api-key": elevenLabsKey,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  text: chunk,
                  model_id: modelId,
                  voice_settings: {
                    // Lower stability for more expressive fiction narration
                    stability: story.narrative_style === "fiction" ? 0.35 : 0.5,
                    // High similarity for consistent voice
                    similarity_boost: 0.8,
                    // Slight style exaggeration for fiction
                    style: story.narrative_style === "fiction" ? 0.15 : 0,
                    // Enable speaker boost for better voice matching
                    use_speaker_boost: true,
                  },
                  // Context for better continuity between chunks
                  previous_text: i > 0 ? scriptChunks[i - 1].slice(-1000) : undefined,
                  next_text: i < scriptChunks.length - 1 ? scriptChunks[i + 1].slice(0, 500) : undefined,
                  // Enable text normalization for proper pronunciation
                  apply_text_normalization: "auto",
                }),
              },
            )

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
              // requestIds.push(requestId)
            }

            const buffer = await audioResponse.arrayBuffer()
            audioBuffers.push(buffer)

            console.log(`[v0] Chunk ${chunkNum} complete, size: ${buffer.byteLength} bytes`)

            await log.synthesizer(
              storyId,
              `Chunk ${chunkNum} complete`,
              {
                sizeBytes: buffer.byteLength,
                // requestId,
              },
              "success",
            )

            const chunkFileName = `${storyId}_chunk_${chunkNum}.mp3`
            const chunkBlob = new Blob([buffer], { type: "audio/mpeg" })

            console.log(`[v0] Uploading chunk ${chunkNum}, size: ${chunkBlob.size} bytes`)

            const { error: chunkUploadError } = await supabase.storage
              .from("story-audio")
              .upload(chunkFileName, chunkBlob, {
                contentType: "audio/mpeg",
                upsert: true,
              })

            if (chunkUploadError) {
              console.error(`[v0] Chunk ${chunkNum} upload error:`, chunkUploadError)
              await log.synthesizer(
                storyId,
                `Chunk ${chunkNum} upload failed`,
                { error: chunkUploadError.message },
                "error",
              )
              throw new Error(`Failed to upload chunk ${chunkNum}: ${chunkUploadError.message}`)
            }

            const {
              data: { publicUrl: chunkUrl },
            } = supabase.storage.from("story-audio").getPublicUrl(chunkFileName)

            chapterAudioUrls.push(chunkUrl)

            console.log(`[v0] Chunk ${chunkNum} uploaded: ${chunkUrl}`)
          }

          const totalBytes = audioBuffers.reduce((sum, b) => sum + b.byteLength, 0)
          console.log("[v0] All chunks synthesized and uploaded, total bytes:", totalBytes)

          await log.synthesizer(
            storyId,
            "All audio chunks uploaded",
            {
              totalChunks: chapterAudioUrls.length,
              totalBytes,
            },
            "success",
          )

          await supabase
            .from("stories")
            .update({
              progress: 95,
              progress_message: "Finalizing tale...",
            })
            .eq("id", storyId)

          const mainAudioUrl = chapterAudioUrls[0]

          // Estimate duration: ~2.5 words per second at normal speaking pace
          const estimatedDuration = Math.round(actualWords / 2.5)

          const updatedChapters = chapters.map(
            (
              ch: { number: number; title: string; start_time_seconds: number; duration_seconds: number },
              idx: number,
            ) => ({
              ...ch,
              audio_url: chapterAudioUrls[idx] || chapterAudioUrls[chapterAudioUrls.length - 1],
            }),
          )

          await log.synthesizer(
            storyId,
            "Audio processing complete",
            {
              mainUrl: mainAudioUrl,
              chunkCount: chapterAudioUrls.length,
              durationSeconds: estimatedDuration,
            },
            "success",
          )

          await log.system(
            storyId,
            "Tale generation complete!",
            {
              totalDuration: estimatedDuration,
              chapters: updatedChapters.length,
              mode: "hybrid",
            },
            "success",
          )

          const { error: finalUpdateError } = await supabase
            .from("stories")
            .update({
              audio_url: mainAudioUrl,
              audio_chunks: chapterAudioUrls,
              chapters: updatedChapters,
              actual_duration_seconds: estimatedDuration,
              status: "completed",
              progress: 100,
              progress_message: "Tale generated successfully!",
              processing_completed_at: new Date().toISOString(),
            })
            .eq("id", storyId)

          if (finalUpdateError) {
            console.error("[v0] Final update error:", finalUpdateError)
          }

          console.log("[v0] Tale generation complete!")

          return Response.json({
            success: true,
            audioUrl: mainAudioUrl,
            audioChunks: chapterAudioUrls,
            duration: estimatedDuration,
            mode: "hybrid",
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
  } catch (outerError) {
    console.error("[v0] ====== FATAL UNHANDLED ERROR ======")
    console.error("[v0] Error:", outerError)
    console.error("[v0] Stack:", outerError instanceof Error ? outerError.stack : "No stack")
    return Response.json(
      {
        error: "Fatal generation error",
        details: outerError instanceof Error ? outerError.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
