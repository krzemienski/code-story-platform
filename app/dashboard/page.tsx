import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Play, Download, MoreHorizontal, Clock, Headphones, TrendingUp, Compass } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Navbar } from "@/components/navbar"
import { PublicStoryCard } from "@/components/public-story-card"

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
        primary_language
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
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">Welcome back, {user.user_metadata?.name || user.email?.split("@")[0]}</p>
          </div>
          <Button asChild>
            <Link href="/">
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Link>
          </Button>
        </div>

        {/* Continue Listening */}
        {continueListening && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-semibold text-zinc-500">Continue Listening</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-emerald-500" />
                    <h3 className="font-semibold text-white">{continueListening.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
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
                      className="h-1 bg-zinc-800"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDuration(
                        (continueListening.actual_duration_seconds || 0) -
                          (continueListening.last_played_position || 0),
                      )}{" "}
                      remaining
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/story/${continueListening.id}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User's Stories */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-500">Your Stories</h2>
            {userStories && userStories.length > 0 && (
              <span className="text-xs text-zinc-500">{userStories.length} stories</span>
            )}
          </div>

          {userStories && userStories.length > 0 ? (
            <div className="space-y-3">
              {userStories.map((story: any) => (
                <div
                  key={story.id}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-emerald-500/50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate font-medium text-white">{story.title}</h3>
                        {getStatusBadge(story.status)}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
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
                          <Progress value={story.progress} className="h-1 bg-zinc-800" />
                          <p className="mt-1 text-xs text-zinc-500">{story.progress_message || "Processing..."}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {story.status === "completed" && (
                        <>
                          <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-white">
                            <Link href={`/story/${story.id}`}>
                              <Play className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem asChild className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                            <Link href={`/story/${story.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          {story.status === "completed" && (
                            <DropdownMenuItem className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                              Regenerate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-zinc-800">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <Headphones className="mx-auto h-12 w-12 text-zinc-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">No stories yet</h3>
              <p className="mt-2 text-zinc-500">Transform your first code repository into an audio narrative.</p>
              <Button asChild className="mt-6">
                <Link href="/">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Story
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Discover Section */}
        {trendingStories && trendingStories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-zinc-500">Trending in Community</h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
                <Link href="/discover">
                  <Compass className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trendingStories.map((story: any) => (
                <PublicStoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
