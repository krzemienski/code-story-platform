import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Download, MoreHorizontal, Clock, Headphones, TrendingUp, Compass } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { ChronicleCard } from "@/components/chronicle-card"
import { ParallaxBackground } from "@/components/parallax-background"
import { AudioPlayer } from "@/components/audio-player" // Import client component for audio context

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-zinc-800 text-zinc-400" },
    analyzing: { label: "Analyzing", className: "bg-blue-500/10 text-blue-500" },
    generating: { label: "Generating", className: "bg-yellow-500/10 text-yellow-500" },
    synthesizing: { label: "Synthesizing", className: "bg-purple-500/10 text-purple-500" },
    completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-500" },
    failed: { label: "Failed", className: "bg-red-500/10 text-red-500" },
  }
  const config = statusConfig[status] || statusConfig.pending
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>{config.label}</span>
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to home if not authenticated
  if (!user) {
    redirect("/")
  }

  // Fetch user's stories
  const { data: userStories } = await supabase
    .from("stories")
    .select(`
      *,
      code_repositories(*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch trending public stories for discovery
  const { data: trendingStories } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      narrative_style,
      actual_duration_seconds,
      play_count,
      code_repositories (
        repo_name,
        repo_owner,
        primary_language,
        stars_count
      )
    `)
    .eq("status", "completed")
    .eq("is_public", true)
    .neq("user_id", user.id)
    .order("play_count", { ascending: false, nullsFirst: false })
    .limit(6)

  const continueListening = userStories?.find(
    (s: any) =>
      s.status === "completed" &&
      s.last_played_position > 0 &&
      s.last_played_position < (s.actual_duration_seconds || 0),
  )

  return (
    <div className="min-h-screen bg-background relative">
      <ParallaxBackground />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Stories</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.user_metadata?.name || user.email?.split("@")[0]}
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/#generate">
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Link>
          </Button>
        </div>

        {/* Continue Listening */}
        {continueListening && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Continue Listening</h2>
            <div className="rounded-xl border border-border bg-card/50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{continueListening.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {continueListening.narrative_style} • {formatDuration(continueListening.actual_duration_seconds)}{" "}
                    total
                  </p>
                  <div className="mt-3">
                    <Progress
                      value={
                        ((continueListening.last_played_position || 0) /
                          (continueListening.actual_duration_seconds || 1)) *
                        100
                      }
                      className="h-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDuration(
                        (continueListening.actual_duration_seconds || 0) -
                          (continueListening.last_played_position || 0),
                      )}{" "}
                      remaining
                    </p>
                  </div>
                </div>
                <AudioPlayer audioUrl={continueListening.audio_url} /> {/* Add client component for play buttons */}
              </div>
            </div>
          </div>
        )}

        {/* User's Stories */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Your Stories</h2>
            {userStories && userStories.length > 0 && (
              <span className="text-xs text-muted-foreground">{userStories.length} stories</span>
            )}
          </div>

          {userStories && userStories.length > 0 ? (
            <div className="space-y-3">
              {userStories.map((story: any) => (
                <div
                  key={story.id}
                  className="group rounded-xl border border-border bg-card/30 p-4 transition-all hover:border-primary/50 card-glow"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate font-medium text-foreground">{story.title}</h3>
                        {getStatusBadge(story.status)}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {story.code_repositories && (
                          <span>
                            {story.code_repositories.repo_owner}/{story.code_repositories.repo_name}
                          </span>
                        )}
                        <span className="capitalize">{story.narrative_style}</span>
                        {story.actual_duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(story.actual_duration_seconds)}
                          </span>
                        )}
                        <span>{formatDate(story.created_at)}</span>
                      </div>

                      {/* Progress for in-progress stories */}
                      {story.status !== "completed" && story.status !== "failed" && (
                        <div className="mt-3">
                          <Progress value={story.progress} className="h-1" />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {story.progress_message || "Processing..."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {story.status === "completed" && (
                        <>
                          <AudioPlayer audioUrl={story.audio_url} /> {/* Add client component for play buttons */}
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/story/${story.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          {story.status === "completed" && <DropdownMenuItem>Regenerate</DropdownMenuItem>}
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/30 p-12 text-center">
              <Headphones className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No stories yet</h3>
              <p className="mt-2 text-muted-foreground">Transform your first code repository into an audio story.</p>
              <Button asChild className="mt-6 bg-primary hover:bg-primary/90">
                <Link href="/#generate">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Story
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Discover Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground">Discover Community Stories</h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/discover">
                <Compass className="mr-2 h-4 w-4" />
                Browse All
              </Link>
            </Button>
          </div>

          {trendingStories && trendingStories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trendingStories.map((story: any) => (
                <ChronicleCard key={story.id} story={story} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center">
              <Compass className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No community stories yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
