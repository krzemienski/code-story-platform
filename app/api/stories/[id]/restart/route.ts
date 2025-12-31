// Restart story generation - clears logs and re-triggers the pipeline
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storyId } = await params
  const supabase = await createClient()

  const url = new URL(req.url)
  const baseUrl = url.origin

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify ownership
  const { data: story, error } = await supabase
    .from("stories")
    .select("id, user_id")
    .eq("id", storyId)
    .eq("user_id", user.id)
    .single()

  if (error || !story) {
    return Response.json({ error: "Story not found" }, { status: 404 })
  }

  const serviceClient = createServiceClient()
  await serviceClient.from("processing_logs").delete().eq("story_id", storyId)

  // Reset story status
  await supabase
    .from("stories")
    .update({
      status: "pending",
      progress: 0,
      progress_message: "Restarting generation...",
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
    })
    .eq("id", storyId)

  // Trigger generation
  fetch(`${baseUrl}/api/stories/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId }),
  }).catch((err) => console.error("[v0] Failed to trigger generation:", err))

  return Response.json({ success: true, message: "Generation restarted" })
}
