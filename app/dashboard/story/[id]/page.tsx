import { notFound } from "next/navigation"
import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2, Github, RefreshCw, Clock, Calendar, FileText, ExternalLink } from "lucide-react"
import { StoryPlayer } from "@/components/story-player"
import { StoryProcessing } from "@/components/story-processing"
import type { Story, StoryChapter } from "@/lib/types"
import { DEMO_STORIES, DEMO_CHAPTERS } from "@/lib/demo-mode"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function RestartButton({ storyId, isDemo }: { storyId: string; isDemo: boolean }) {
  "use client"

  const handleRestart = async () => {
    if (isDemo) {
      window.location.reload()
      return
    }

    const res = await fetch(`/api/stories/${storyId}/restart`, { method: "POST" })
    if (res.ok) {
      window.location.reload()
    }
  }

  return (
    <Button onClick={handleRestart}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  )
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const isDemo = cookieStore.get("codestory_demo")?.value === "true"

  let story: any = null
  let chapters: any[] = []

  if (isDemo) {
    story = DEMO_STORIES.find((s) => s.id === id)
    if (!story) {
      notFound()
    }
    chapters = DEMO_CHAPTERS.filter((c) => c.story_id === id)
  } else {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      notFound()
    }

    // Fetch story with repository info
    const { data: storyData, error } = await supabase
      .from("stories")
      .select(`
        *,
        repository:code_repositories(*)
      `)
      .eq("id", id)
      .single()

    if (error || !storyData) {
      notFound()
    }

    story = storyData

    // Fetch chapters
    const { data: chaptersData } = await supabase
      .from("story_chapters")
      .select("*")
      .eq("story_id", id)
      .order("chapter_number", { ascending: true })

    chapters = chaptersData || []
  }

  const typedStory = story as Story & { repository?: { repo_name: string; repo_owner: string; repo_url: string } }
  const typedChapters = chapters as StoryChapter[]

  // Parse chapters from story JSON if no separate chapters exist
  const displayChapters: StoryChapter[] =
    typedChapters.length > 0
      ? typedChapters
      : Array.isArray(typedStory.chapters) && typedStory.chapters.length > 0
        ? typedStory.chapters.map(
            (
              ch: { number: number; title: string; start_time_seconds: number; duration_seconds: number },
              i: number,
            ) => ({
              id: `ch-${i}`,
              story_id: id,
              chapter_number: ch.number || i + 1,
              title: ch.title || `Chapter ${i + 1}`,
              start_time_seconds: ch.start_time_seconds || 0,
              duration_seconds: ch.duration_seconds || 120,
              focus_files: [],
              key_concepts: [],
            }),
          )
        : [
            {
              id: "1",
              story_id: id,
              chapter_number: 1,
              title: "Introduction",
              start_time_seconds: 0,
              duration_seconds: 120,
              focus_files: [],
              key_concepts: [],
            },
            {
              id: "2",
              story_id: id,
              chapter_number: 2,
              title: "Architecture Overview",
              start_time_seconds: 120,
              duration_seconds: 300,
              focus_files: [],
              key_concepts: [],
            },
            {
              id: "3",
              story_id: id,
              chapter_number: 3,
              title: "Key Components",
              start_time_seconds: 420,
              duration_seconds: 400,
              focus_files: [],
              key_concepts: [],
            },
            {
              id: "4",
              story_id: id,
              chapter_number: 4,
              title: "Best Practices",
              start_time_seconds: 820,
              duration_seconds: 200,
              focus_files: [],
              key_concepts: [],
            },
            {
              id: "5",
              story_id: id,
              chapter_number: 5,
              title: "Summary",
              start_time_seconds: 1020,
              duration_seconds: 120,
              focus_files: [],
              key_concepts: [],
            },
          ]

  const isProcessing = !["completed", "failed"].includes(typedStory.status)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{typedStory.title}</h1>
            {typedStory.repository && (
              <a
                href={
                  typedStory.repository.repo_url ||
                  `https://github.com/${typedStory.repository.repo_owner}/${typedStory.repository.repo_name}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                {typedStory.repository.repo_owner}/{typedStory.repository.repo_name}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {typedStory.status === "completed" && (
            <div className="flex gap-2">
              {typedStory.audio_url && (
                <Button variant="outline" size="sm" className="bg-transparent" asChild>
                  <a href={typedStory.audio_url} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" className="bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <RestartButton storyId={id} isDemo={isDemo} />
            </div>
          )}
        </div>
      </div>

      {/* Processing state - Client component with real-time updates */}
      {isProcessing && (
        <StoryProcessing
          storyId={id}
          initialStatus={typedStory.status}
          initialProgress={typedStory.progress}
          initialMessage={typedStory.progress_message}
          isDemo={isDemo}
        />
      )}

      {/* Failed state */}
      {typedStory.status === "failed" && (
        <div className="mb-8 rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-destructive">Generation Failed</h2>
          <p className="mt-2 text-muted-foreground">{typedStory.error_message || "An unexpected error occurred."}</p>
          <div className="mt-6">
            <RestartButton storyId={id} isDemo={isDemo} />
          </div>
        </div>
      )}

      {/* Completed state - Player */}
      {typedStory.status === "completed" && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StoryPlayer
              storyId={id}
              title={typedStory.title}
              subtitle={`${typedStory.narrative_style} • ${typedStory.expertise_level}`}
              audioUrl={typedStory.audio_url || undefined}
              chapters={displayChapters}
              initialPosition={typedStory.last_played_position}
              scriptText={typedStory.transcript || typedStory.script_text || undefined}
              isDemo={isDemo}
            />
          </div>

          <div className="space-y-6">
            {/* Story info */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Story Details</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Style</dt>
                  <dd className="capitalize text-foreground">{typedStory.narrative_style}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expertise</dt>
                  <dd className="capitalize text-foreground">{typedStory.expertise_level}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="flex items-center gap-1 text-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(typedStory.actual_duration_seconds)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Chapters</dt>
                  <dd className="text-foreground">{displayChapters.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="flex items-center gap-1 text-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(typedStory.created_at)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Play Count</dt>
                  <dd className="text-foreground">{typedStory.play_count}</dd>
                </div>
              </dl>
            </div>

            {/* Chapters list */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Chapters</h3>
              <div className="mt-4 space-y-2">
                {displayChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-secondary cursor-pointer"
                  >
                    <span className="text-foreground">
                      <span className="text-muted-foreground">{chapter.chapter_number}.</span> {chapter.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(
                        chapter.duration_seconds ||
                          (chapter.end_time_seconds ? chapter.end_time_seconds - chapter.start_time_seconds : 120),
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Script preview */}
            {(typedStory.transcript || typedStory.script_text) && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Transcript</h3>
                  <Button variant="ghost" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View Full
                  </Button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground line-clamp-6">
                  {(typedStory.transcript || typedStory.script_text || "").slice(0, 400)}...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
