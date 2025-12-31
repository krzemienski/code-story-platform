"use client"

import Link from "next/link"
import { Play, Clock, Headphones } from "lucide-react"
import { cn } from "@/lib/utils"

interface PublicStoryCardProps {
  story: {
    id: string
    title: string
    narrative_style: string
    actual_duration_seconds?: number
    play_count?: number
    code_repositories?: {
      repo_name: string
      repo_owner: string
      primary_language?: string
      stars_count?: number
    } | null
  }
}

const STYLE_COLORS: Record<string, string> = {
  documentary: "bg-blue-500/10 text-blue-500",
  tutorial: "bg-green-500/10 text-green-500",
  podcast: "bg-purple-500/10 text-purple-500",
  fiction: "bg-orange-500/10 text-orange-500",
  technical: "bg-slate-500/10 text-slate-400",
}

export function PublicStoryCard({ story }: PublicStoryCardProps) {
  const repo = story.code_repositories
  const duration = story.actual_duration_seconds ? `${Math.floor(story.actual_duration_seconds / 60)} min` : "~10 min"

  const displayName = repo ? `${repo.repo_owner}/${repo.repo_name}` : story.title

  return (
    <Link
      href={`/story/${story.id}`}
      className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-secondary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{displayName}</h3>
          {repo && <p className="text-sm text-muted-foreground truncate mt-1">{story.title}</p>}
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Play className="h-4 w-4 ml-0.5" />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full capitalize",
            STYLE_COLORS[story.narrative_style] || STYLE_COLORS.documentary,
          )}
        >
          {story.narrative_style}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {duration}
        </span>
        {(story.play_count ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            {story.play_count?.toLocaleString()}
          </span>
        )}
      </div>
    </Link>
  )
}
