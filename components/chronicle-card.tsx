"use client"

import type React from "react"

import Link from "next/link"
import { Clock, Star, Github, Play, Plus, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAudioPlayerContext } from "@/lib/audio-player-context"

interface ChronicleCardProps {
  story: {
    id: string
    title: string
    narrative_style: string
    actual_duration_seconds?: number | null
    play_count?: number | null
    audio_url?: string | null
    audio_chunks?: string[] | null
    code_repositories?: {
      repo_name: string
      repo_owner: string
      primary_language?: string | null
      stars_count?: number | null
      description?: string | null
    } | null
  }
  variant?: "grid" | "list"
}

const LANGUAGE_COLORS: Record<string, string> = {
  python: "bg-yellow-500/20 text-yellow-400",
  javascript: "bg-yellow-400/20 text-yellow-300",
  typescript: "bg-blue-500/20 text-blue-400",
  rust: "bg-orange-500/20 text-orange-400",
  go: "bg-cyan-500/20 text-cyan-400",
  "c++": "bg-pink-500/20 text-pink-400",
  c: "bg-gray-500/20 text-gray-400",
  java: "bg-red-500/20 text-red-400",
  ruby: "bg-red-400/20 text-red-300",
  default: "bg-primary/20 text-primary",
}

const STYLE_LABELS: Record<string, string> = {
  documentary: "Documentary",
  tutorial: "Tutorial",
  podcast: "Podcast",
  fiction: "Fiction",
  technical: "Technical",
  systems: "Systems",
  frontend: "Frontend",
  "machine learning": "Machine Learning",
  runtime: "Runtime",
}

function getLanguageColor(language?: string | null): string {
  if (!language) return LANGUAGE_COLORS.default
  const lower = language.toLowerCase()
  return LANGUAGE_COLORS[lower] || LANGUAGE_COLORS.default
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "~10m"
  const minutes = Math.floor(seconds / 60)
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }
  return `${minutes}m`
}

function formatNumber(num?: number | null): string {
  if (!num) return "0"
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

export function ChronicleCard({ story, variant = "list" }: ChronicleCardProps) {
  const { play, addToQueue, currentItem, isPlaying, toggle } = useAudioPlayerContext()
  const repo = story.code_repositories
  const language = repo?.primary_language

  const isCurrentlyPlaying = currentItem?.id === story.id && isPlaying
  const isCurrentItem = currentItem?.id === story.id
  const hasAudio = story.audio_url || (story.audio_chunks && story.audio_chunks.length > 0)

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!hasAudio) {
      window.location.href = `/story/${story.id}`
      return
    }

    if (isCurrentItem) {
      toggle()
    } else {
      play({
        id: story.id,
        title: story.title,
        subtitle: story.narrative_style,
        repoName: repo ? `${repo.repo_owner}/${repo.repo_name}` : undefined,
        audioUrl: story.audio_url || undefined,
        audioChunks: story.audio_chunks || undefined,
        duration: story.actual_duration_seconds || undefined,
      })
    }
  }

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!hasAudio) return

    addToQueue({
      id: story.id,
      title: story.title,
      subtitle: story.narrative_style,
      repoName: repo ? `${repo.repo_owner}/${repo.repo_name}` : undefined,
      audioUrl: story.audio_url || undefined,
      audioChunks: story.audio_chunks || undefined,
      duration: story.actual_duration_seconds || undefined,
    })
  }

  if (variant === "grid") {
    return (
      <div
        className={cn(
          "group relative rounded-xl border bg-card/50 overflow-hidden transition-all hover:border-primary/50 card-glow",
          isCurrentItem ? "border-primary/50 ring-1 ring-primary/20" : "border-border",
        )}
      >
        <Link href={`/story/${story.id}`} className="block">
          <div className="h-32 bg-secondary/30 relative overflow-hidden">
            <div className="absolute inset-0 p-4 font-mono text-[10px] text-muted-foreground/50 leading-relaxed overflow-hidden">
              <pre>{`function analyze(repo) {
  const files = traverse(repo);
  return files.map(f => ({
    path: f.path,
    content: parse(f)
  }));
}`}</pre>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />

            {isCurrentlyPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="flex items-center gap-[3px]">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity bg-black/40",
                isCurrentlyPlaying ? "opacity-0" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
                onClick={handlePlay}
              >
                {isCurrentlyPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {language && (
                <span
                  className={cn("px-2 py-0.5 rounded text-[10px] font-medium uppercase", getLanguageColor(language))}
                >
                  {language}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-secondary text-muted-foreground">
                {STYLE_LABELS[story.narrative_style] || story.narrative_style}
              </span>
            </div>

            <h3
              className={cn(
                "font-semibold text-sm mb-2 line-clamp-2 transition-colors",
                isCurrentItem ? "text-primary" : "group-hover:text-primary",
              )}
            >
              {story.title}
            </h3>

            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(story.actual_duration_seconds)}
              </span>
              {(story.play_count ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {formatNumber(story.play_count)}
                </span>
              )}
            </div>

            {repo && (
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                <Github className="h-3 w-3" />
                <span>
                  {repo.repo_owner}/{repo.repo_name}
                </span>
              </div>
            )}
          </div>
        </Link>

        {hasAudio && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground"
            onClick={handleAddToQueue}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative flex gap-4 sm:gap-6 rounded-xl border bg-card/30 p-4 transition-all hover:bg-card/50 card-glow",
        isCurrentItem ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30",
      )}
    >
      <Link href={`/story/${story.id}`} className="flex gap-4 sm:gap-6 flex-1">
        <div className="hidden sm:flex w-40 h-24 rounded-lg bg-secondary/30 relative overflow-hidden shrink-0 items-center justify-center">
          <div className="absolute inset-0 p-2 font-mono text-[8px] text-muted-foreground/40 leading-relaxed overflow-hidden">
            <pre>{`const story = await
  generate({
    repo: url,
    style: 'fiction'
  });`}</pre>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />

          {isCurrentlyPlaying ? (
            <div className="relative z-10 flex items-center gap-[3px]">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-waveform"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : (
            <Button
              size="icon"
              className="relative z-10 h-10 w-10 rounded-full bg-primary/90 hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePlay}
            >
              <Play className="h-4 w-4 ml-0.5" />
            </Button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {isCurrentlyPlaying && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-primary/20 text-primary flex items-center gap-1">
                <span className="flex items-center gap-[1px]">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className="w-0.5 h-2 bg-primary rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </span>
                Playing
              </span>
            )}
            {language && (
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium uppercase", getLanguageColor(language))}>
                {language}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-secondary text-muted-foreground">
              {STYLE_LABELS[story.narrative_style] || story.narrative_style}
            </span>
          </div>

          <h3
            className={cn(
              "font-semibold mb-1 transition-colors line-clamp-1",
              isCurrentItem ? "text-primary" : "group-hover:text-primary",
            )}
          >
            {story.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {repo?.description ||
              "An auditory exploration of the codebase, bringing its architecture and patterns to life through story."}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(story.actual_duration_seconds)}
            </span>
            {(story.play_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {formatNumber(story.play_count)} plays
              </span>
            )}
            {(repo?.stars_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {formatNumber(repo?.stars_count)} stars
              </span>
            )}
          </div>

          {repo && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
              <Github className="h-3 w-3" />
              <span>
                {repo.repo_owner}/{repo.repo_name}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {hasAudio && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            onClick={handleAddToQueue}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          className={cn(
            "sm:hidden h-10 w-10 rounded-full",
            isCurrentlyPlaying ? "bg-primary/20 text-primary" : "bg-primary hover:bg-primary/90",
          )}
          onClick={handlePlay}
        >
          {isCurrentlyPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>
      </div>
    </div>
  )
}
