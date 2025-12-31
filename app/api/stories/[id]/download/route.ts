import { createServiceClient } from "@/lib/supabase/service"
import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const supabase = createServiceClient()

    // Get story with audio chunks
    const { data: story, error } = await supabase
      .from("stories")
      .select("title, audio_url, audio_chunks")
      .eq("id", id)
      .single()

    if (error || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    const chunks = (story.audio_chunks as string[]) || []
    if (chunks.length === 0 && story.audio_url) {
      chunks.push(story.audio_url)
    }

    if (chunks.length === 0) {
      return NextResponse.json({ error: "No audio available" }, { status: 404 })
    }

    console.log(`[v0] Downloading ${chunks.length} audio chunks for story ${id}`)

    // Fetch all audio chunks in parallel
    const audioBuffers: ArrayBuffer[] = []
    for (const chunkUrl of chunks) {
      console.log(`[v0] Fetching chunk: ${chunkUrl}`)
      const response = await fetch(chunkUrl)
      if (!response.ok) {
        console.error(`[v0] Failed to fetch chunk: ${chunkUrl}`)
        continue
      }
      const buffer = await response.arrayBuffer()
      audioBuffers.push(buffer)
      console.log(`[v0] Fetched chunk, size: ${buffer.byteLength}`)
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json({ error: "Failed to fetch audio" }, { status: 500 })
    }

    // Combine all buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0)
    const combined = new Uint8Array(totalLength)
    let offset = 0
    for (const buffer of audioBuffers) {
      combined.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    console.log(`[v0] Combined audio size: ${combined.byteLength} bytes`)

    // Generate filename
    const safeName = (story.title || "story")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50)

    return new NextResponse(combined, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${safeName}.mp3"`,
        "Content-Length": combined.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json({ error: "Failed to download audio" }, { status: 500 })
  }
}
