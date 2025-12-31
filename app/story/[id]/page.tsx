import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StoryPlayer } from "@/components/story-player"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Github, Share2 } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicStoryPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: story, error } = await supabase
    .from("stories")
    .select(`
      *,
      code_repositories (*),
      story_chapters (*)
    `)
    .eq("id", id)
    .single()

  if (error || !story) {
    notFound()
  }

  const repo = story.code_repositories

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`https://github.com/${repo.repo_owner}/${repo.repo_name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-2" />
                View Repo
              </a>
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Repo info */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">
            {repo.repo_owner}/{repo.repo_name}
          </h1>
          <p className="text-muted-foreground">{repo.description}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>{repo.primary_language}</span>
            <span>{repo.stars_count?.toLocaleString()} stars</span>
            <span className="capitalize">{story.narrative_style} style</span>
          </div>
        </div>

        {/* Player */}
        {story.status === "completed" ? (
          <StoryPlayer
            storyId={story.id}
            title={story.title}
            subtitle={story.narrative_style}
            audioUrl={story.audio_url}
            audioChunks={story.audio_chunks || []}
            chapters={story.story_chapters || []}
            scriptText={story.script_text}
          />
        ) : story.status === "processing" ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Story is still being generated...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">This story is not available.</p>
          </div>
        )}
      </main>
    </div>
  )
}
