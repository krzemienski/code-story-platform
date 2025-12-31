// Story details API

import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: story, error } = await supabase
    .from("stories")
    .select("*, code_repositories(*), story_chapters(*)")
    .eq("id", id)
    .single()

  if (error || !story) {
    return Response.json({ error: "Story not found" }, { status: 404 })
  }

  return Response.json(story)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updates = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase.from("stories").update(updates).eq("id", id).select().single()

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json(data)
}
