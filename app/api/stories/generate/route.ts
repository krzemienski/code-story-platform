// Story Generation API - Proxies to FastAPI backend
// Frontend creates story in Supabase first, then calls this to trigger backend processing

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60 // Just a proxy, doesn't need long timeout

interface GenerateRequest {
  storyId: string
  styleConfig?: {
    repoUrl?: string
    style?: string
    duration?: number
    voice?: string
    focusAreas?: string[]
    technicalDepth?: string
  }
}

interface StoryData {
  id: string
  narrative_style: string
  target_duration_minutes: number
  expertise_level: string
  code_repositories: {
    repo_owner: string
    repo_name: string
  }
}

export async function POST(req: Request) {
  try {
    const { storyId, styleConfig }: GenerateRequest = await req.json()

    console.log("[proxy] Story generation request for:", storyId)

    // Get backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    // Fetch story details from Supabase to get repo info
    const supabase = await createClient()
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, code_repositories(*)")
      .eq("id", storyId)
      .single()

    if (storyError || !story) {
      console.error("[proxy] Story not found:", storyError)
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Cast to expected type
    const storyData = story as unknown as StoryData

    // Build the repo URL from stored data
    const repo = storyData.code_repositories
    const repoUrl = `https://github.com/${repo.repo_owner}/${repo.repo_name}`

    // Map style names for backend
    const styleMap: Record<string, string> = {
      fiction: "fiction",
      documentary: "documentary",
      tutorial: "tutorial",
      podcast: "podcast",
      technical: "technical",
    }

    // Transform request to backend format
    const backendRequest = {
      repoUrl,
      style: styleMap[storyData.narrative_style] || "documentary",
      duration: storyData.target_duration_minutes || 10,
      voice: styleConfig?.voice || "Rachel",
      focusAreas: styleConfig?.focusAreas || [],
      technicalDepth: storyData.expertise_level || "intermediate",
    }

    console.log("[proxy] Forwarding to backend:", backendUrl)
    console.log("[proxy] Request payload:", JSON.stringify(backendRequest))

    // Update story status to show we're starting
    await supabase
      .from("stories")
      .update({
        status: "analyzing",
        progress: 5,
        progress_message: "Connecting to backend service...",
        processing_started_at: new Date().toISOString(),
      })
      .eq("id", storyId)

    // Call the backend API
    const response = await fetch(`${backendUrl}/api/stories/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[proxy] Backend error:", response.status, errorText)

      // Update story with error
      await supabase
        .from("stories")
        .update({
          status: "failed",
          error_message: `Backend error: ${response.status} - ${errorText.slice(0, 200)}`,
          processing_completed_at: new Date().toISOString(),
        })
        .eq("id", storyId)

      return NextResponse.json(
        { error: "Backend processing failed", details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log("[proxy] Backend response:", result)

    // The backend creates its own story record - we need to link or sync
    // For now, just return success since backend handles everything
    return NextResponse.json({
      success: true,
      storyId,
      backendStoryId: result.id,
      message: result.message || "Story generation started",
    })
  } catch (error) {
    console.error("[proxy] Fatal error:", error)
    return NextResponse.json(
      {
        error: "Proxy error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
