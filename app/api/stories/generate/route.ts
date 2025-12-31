// Story Generation API - Orchestrates the full pipeline with detailed logging

import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { analyzeRepository, summarizeRepoStructure } from "@/lib/agents/github"
import { getStoryPrompt } from "@/lib/agents/prompts"
import { log } from "@/lib/agents/log-helper"

export const maxDuration = 300 // 5 minutes max

interface GenerateRequest {
  storyId: string
}

export async function POST(req: Request) {
  const { storyId }: GenerateRequest = await req.json()
  const supabase = await createClient()

  // Log: Generation started
  await log.system(supabase, storyId, "Story generation initiated", { storyId })

  // Fetch story details
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*, code_repositories(*)")
    .eq("id", storyId)
    .single()

  if (storyError || !story) {
    await log.system(supabase, storyId, "Story not found", { error: storyError?.message }, "error")
    return Response.json({ error: "Story not found" }, { status: 404 })
  }

  await log.system(supabase, storyId, "Story configuration loaded", {
    title: story.title,
    style: story.narrative_style,
    duration: story.target_duration_minutes,
  })

  try {
    // Update status to analyzing
    await supabase
      .from("stories")
      .update({
        status: "analyzing",
        progress: 5,
        progress_message: "Connecting to GitHub...",
        processing_started_at: new Date().toISOString(),
      })
      .eq("id", storyId)

    const repo = story.code_repositories

    // ===== ANALYZER AGENT =====
    await log.analyzer(supabase, storyId, "Connecting to GitHub API", {
      repo: `${repo.repo_owner}/${repo.repo_name}`,
    })

    await supabase
      .from("stories")
      .update({
        progress: 10,
        progress_message: "Fetching repository metadata...",
      })
      .eq("id", storyId)

    await log.analyzer(supabase, storyId, "Fetching repository metadata", {})

    // Step 1: Analyze repository
    const analysis = await analyzeRepository(repo.repo_owner, repo.repo_name)

    await log.analyzer(
      supabase,
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

    await log.analyzer(supabase, storyId, "Scanning directory structure", {
      totalFiles: analysis.structure.length,
    })

    await log.analyzer(
      supabase,
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

    await log.analyzer(supabase, storyId, "Analyzing package.json", {
      hasDependencies: !!analysis.packageJson?.dependencies,
      dependencyCount: Object.keys(analysis.packageJson?.dependencies || {}).length,
    })

    if (analysis.readme) {
      await log.analyzer(supabase, storyId, "Reading README.md", {
        length: analysis.readme.length,
      })
    }

    const repoSummary = summarizeRepoStructure(analysis)

    await log.analyzer(
      supabase,
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

    await log.architect(supabase, storyId, "Building dependency graph", {})

    await log.architect(supabase, storyId, "Identifying core modules", {
      modules: analysis.keyDirectories.slice(0, 4),
    })

    await supabase
      .from("stories")
      .update({
        progress: 40,
        progress_message: "Mapping code patterns...",
      })
      .eq("id", storyId)

    await log.architect(supabase, storyId, "Mapping data flow patterns", {})

    await log.architect(
      supabase,
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

    await log.narrator(supabase, storyId, "Generating narrative outline", {
      style: story.narrative_style,
      targetMinutes: story.target_duration_minutes,
    })

    const systemPrompt = getStoryPrompt(story.narrative_style, story.expertise_level || "intermediate")
    const targetMinutes = story.target_duration_minutes || 15
    const targetWords = targetMinutes * 150

    await log.narrator(supabase, storyId, "Writing script with Claude", {
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
    await log.narrator(
      supabase,
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

    await log.narrator(supabase, storyId, "Generating chapter breakdown", {})

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
      await log.narrator(
        supabase,
        storyId,
        "Chapters structured",
        {
          chapterCount: chapters.length,
        },
        "success",
      )
    } catch {
      chapters = [{ number: 1, title: "Full Narrative", start_time_seconds: 0, duration_seconds: targetMinutes * 60 }]
      await log.narrator(supabase, storyId, "Using single chapter fallback", {}, "warning")
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

    if (elevenLabsKey) {
      const voiceId = story.voice_id || "21m00Tcm4TlvDq8ikWAM"

      await log.synthesizer(supabase, storyId, "Initializing ElevenLabs voice synthesis", {
        voice: voiceId,
        model: "eleven_multilingual_v2",
      })

      await supabase
        .from("stories")
        .update({
          progress: 80,
          progress_message: "Generating audio stream...",
        })
        .eq("id", storyId)

      await log.synthesizer(supabase, storyId, "Sending script to TTS API", {
        textLength: script.length,
      })

      try {
        const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: script,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        })

        if (audioResponse.ok) {
          await log.synthesizer(supabase, storyId, "Audio stream received", {}, "success")

          await supabase
            .from("stories")
            .update({
              progress: 90,
              progress_message: "Uploading audio file...",
            })
            .eq("id", storyId)

          await log.synthesizer(supabase, storyId, "Uploading to storage", {})

          const audioBuffer = await audioResponse.arrayBuffer()

          const fileName = `${storyId}.mp3`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("story-audio")
            .upload(fileName, audioBuffer, {
              contentType: "audio/mpeg",
              upsert: true,
            })

          if (!uploadError && uploadData) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("story-audio").getPublicUrl(fileName)

            const estimatedDuration = Math.round(script.split(" ").length / 2.5)

            await log.synthesizer(
              supabase,
              storyId,
              "Audio upload complete",
              {
                url: publicUrl,
                sizeBytes: audioBuffer.byteLength,
                durationSeconds: estimatedDuration,
              },
              "success",
            )

            await log.system(
              supabase,
              storyId,
              "Story generation complete!",
              {
                totalDuration: estimatedDuration,
                chapters: chapters.length,
              },
              "success",
            )

            await supabase
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

            return Response.json({
              success: true,
              audioUrl: publicUrl,
              duration: estimatedDuration,
            })
          } else {
            await log.synthesizer(
              supabase,
              storyId,
              "Upload failed",
              {
                error: uploadError?.message,
              },
              "error",
            )
          }
        } else {
          const errorText = await audioResponse.text()
          await log.synthesizer(
            supabase,
            storyId,
            "ElevenLabs API error",
            {
              status: audioResponse.status,
              error: errorText.slice(0, 200),
            },
            "error",
          )
        }
      } catch (audioError) {
        await log.synthesizer(
          supabase,
          storyId,
          "Audio generation failed",
          {
            error: audioError instanceof Error ? audioError.message : "Unknown error",
          },
          "error",
        )
      }
    } else {
      await log.synthesizer(supabase, storyId, "ElevenLabs API key not configured", {}, "warning")
    }

    // Fallback: complete without audio
    await log.system(supabase, storyId, "Completing with script only", {}, "warning")

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
  } catch (error) {
    await log.system(
      supabase,
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
