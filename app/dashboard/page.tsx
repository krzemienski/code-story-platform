import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Play, Share2, Download, MoreHorizontal, Clock, Headphones } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import type { Story } from "@/lib/types"
import { DEMO_STORIES, DEMO_PROFILE } from "@/lib/demo-mode"

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
    pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
    analyzing: { label: "Analyzing", className: "bg-blue-500/10 text-blue-500" },
    generating: { label: "Generating", className: "bg-yellow-500/10 text-yellow-500" },
    synthesizing: { label: "Synthesizing", className: "bg-purple-500/10 text-purple-500" },
    completed: { label: "Completed", className: "bg-primary/10 text-primary" },
    failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
  }
  const config = statusConfig[status] || statusConfig.pending
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>{config.label}</span>
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get("codestory_demo")?.value === "true"

  let stories: any[] | null = null
  let profile: any = null

  if (isDemo) {
    stories = DEMO_STORIES
    profile = DEMO_PROFILE
  } else {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch user's stories
    const { data: storiesData } = await supabase
      .from("stories")
      .select(`
        *,
        repository:code_repositories(*)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })

    stories = storiesData

    // Fetch profile for usage stats
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user?.id).single()
    profile = profileData
  }

  const inProgressStory = (stories as Story[] | null)?.find(
    (s) => s.status !== "completed" && s.status !== "failed" && s.last_played_position > 0,
  )
  const continueListening = (stories as Story[] | null)?.find(
    (s) =>
      s.status === "completed" &&
      s.last_played_position > 0 &&
      s.last_played_position < (s.actual_duration_seconds || 0),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Stories</h1>
          <p className="text-muted-foreground">Transform code repositories into audio narratives</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="mr-2 h-4 w-4" />
            New Story
          </Link>
        </Button>
      </div>

      {/* Continue Listening */}
      {continueListening && (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Continue Listening</h2>
          <div className="rounded-xl border border-border bg-card p-6">
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
                      (continueListening.actual_duration_seconds || 0) - (continueListening.last_played_position || 0),
                    )}{" "}
                    remaining
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/dashboard/story/${continueListening.id}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stories List */}
      {stories && stories.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">All Stories</h2>
            <span className="text-xs text-muted-foreground">{stories.length} stories</span>
          </div>
          <div className="space-y-3">
            {(stories as (Story & { repository?: { repo_name: string; repo_owner: string } })[]).map((story) => (
              <div
                key={story.id}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate font-medium text-foreground">{story.title}</h3>
                      {getStatusBadge(story.status)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {story.repository && (
                        <span>
                          {story.repository.repo_owner}/{story.repository.repo_name}
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
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/story/${story.id}`}>
                            <Play className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/story/${story.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        {story.status === "completed" && (
                          <>
                            <DropdownMenuItem>Regenerate</DropdownMenuItem>
                            <DropdownMenuItem>Share</DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Headphones className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No stories yet</h3>
          <p className="mt-2 text-muted-foreground">Transform your first code repository into an audio narrative.</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Story
            </Link>
          </Button>
        </div>
      )}

      {/* Usage Stats */}
      {profile && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Stories This Month</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {profile.stories_used_this_month}/{profile.usage_quota?.stories_per_month || 5}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Minutes Generated</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {profile.minutes_used_this_month}/{profile.usage_quota?.minutes_per_month || 60}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Stories</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stories?.length || 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="mt-1 text-2xl font-bold text-foreground capitalize">{profile.subscription_tier}</p>
          </div>
        </div>
      )}
    </div>
  )
}
