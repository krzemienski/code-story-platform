"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Play, ListPlus, Github, Pause, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAudioPlayerContext } from "@/lib/audio-player-context"

interface FeaturedTale {
  id: string
  title: string
  description?: string
  repo_owner?: string
  repo_name?: string
  primary_language?: string
  actual_duration_seconds?: number
  audio_url?: string
  audio_chunks?: string[]
  waveformColor?: string
}

interface FeaturedHeroProps {
  tales?: FeaturedTale[]
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "from-amber-500 to-orange-600",
  JavaScript: "from-yellow-400 to-amber-500",
  TypeScript: "from-blue-500 to-cyan-500",
  Rust: "from-orange-500 to-red-600",
  Go: "from-cyan-400 to-blue-500",
  Java: "from-red-500 to-orange-500",
  "C++": "from-purple-500 to-pink-500",
  Ruby: "from-red-400 to-rose-600",
}

const DEFAULT_TALES: FeaturedTale[] = [
  {
    id: "demo-1",
    title: "Getting Started with Code Tales",
    description:
      "Transform any GitHub repository into an immersive audio tale. Paste a URL below to begin your journey.",
    repo_owner: "codetales",
    repo_name: "demo",
    primary_language: "TypeScript",
    actual_duration_seconds: 900,
  },
]

export function FeaturedHero({ tales = [] }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const { play, addToQueue, currentItem, isPlaying, isBuffering } = useAudioPlayerContext()

  const displayTales = tales.length > 0 ? tales : DEFAULT_TALES
  const tale = displayTales[currentIndex]
  const waveformColor = tale.primary_language
    ? LANGUAGE_COLORS[tale.primary_language] || "from-primary/60 to-primary"
    : "from-primary/60 to-primary"

  const isThisPlaying = currentItem?.id === tale.id && isPlaying
  const isThisBuffering = currentItem?.id === tale.id && isBuffering
  const hasAudio = tale.audio_url || (tale.audio_chunks && tale.audio_chunks.length > 0)

  const goTo = (index: number) => {
    if (isAnimating || displayTales.length <= 1) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 500)
  }

  // Auto-advance carousel
  useEffect(() => {
    if (displayTales.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTales.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [displayTales.length])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "~15m"
    const mins = Math.round(seconds / 60)
    return `${mins}m`
  }

  const handleListenClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!hasAudio) {
      window.location.href = `/story/${tale.id}`
      return
    }

    play({
      id: tale.id,
      title: tale.title,
      repoName: tale.repo_owner && tale.repo_name ? `${tale.repo_owner}/${tale.repo_name}` : undefined,
      audioUrl: tale.audio_url,
      audioChunks: tale.audio_chunks,
      duration: tale.actual_duration_seconds,
    })
  }

  const handleQueueClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!hasAudio) return

    addToQueue({
      id: tale.id,
      title: tale.title,
      repoName: tale.repo_owner && tale.repo_name ? `${tale.repo_owner}/${tale.repo_name}` : undefined,
      audioUrl: tale.audio_url,
      audioChunks: tale.audio_chunks,
      duration: tale.actual_duration_seconds,
    })
  }

  const titleParts = tale.title.split(":").map((s) => s.trim())
  const mainTitle = titleParts[0] || tale.title
  const subtitle = titleParts[1] || ""

  return (
    <div className="relative">
      <div className="mb-8" id="generate">
        <CreateYourOwn />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Featured Tale</span>
      </div>

      {/* Featured Tale Card */}
      <Link href={tale.id.startsWith("demo") ? "#generate" : `/story/${tale.id}`}>
        <div className="relative rounded-2xl border border-border bg-card/50 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
          <div className={cn("h-32 relative overflow-hidden bg-gradient-to-r opacity-30", waveformColor)}>
            <div className="absolute inset-0 flex items-end justify-center gap-[2px] px-8 pb-4">
              {[...Array(60)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 bg-white/80 rounded-full transition-all duration-300",
                    isThisPlaying && "animate-waveform",
                  )}
                  style={{
                    height: `${20 + Math.sin(i * 0.3) * 40 + Math.random() * 20}%`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
            {/* Now Playing indicator */}
            {isThisPlaying && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-medium">Now Playing</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-3xl sm:text-4xl font-serif leading-tight mb-1">
              {mainTitle}
              {subtitle && (
                <>
                  <br />
                  <span className="italic text-muted-foreground">{subtitle}</span>
                </>
              )}
            </h2>

            <p className="text-sm text-muted-foreground mt-4 mb-2">
              {tale.repo_owner && (
                <>
                  By <span className="text-foreground">@{tale.repo_owner}</span> ·{" "}
                </>
              )}
              {tale.primary_language || "Code"} · {formatDuration(tale.actual_duration_seconds)} runtime
            </p>

            {tale.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{tale.description}</p>}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleListenClick}
                className={cn(
                  "gap-2 transition-colors",
                  isThisPlaying
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground text-background hover:bg-foreground/90 group-hover:bg-primary group-hover:text-primary-foreground",
                )}
              >
                {isThisBuffering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isThisPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isThisPlaying ? "Playing" : "Listen Now"}
              </Button>
              {hasAudio && (
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent border-border hover:bg-secondary"
                  onClick={handleQueueClick}
                >
                  <ListPlus className="h-4 w-4" />
                  Queue
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Carousel dots */}
      {displayTales.length > 1 && (
        <div className="flex items-center gap-2 mt-4">
          {displayTales.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentIndex ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CreateYourOwn() {
  const [url, setUrl] = useState("")
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    setIsValid(githubRegex.test(url.trim()))
  }, [url])

  const handleGenerate = () => {
    if (!isValid) return
    window.location.href = `/dashboard/new?url=${encodeURIComponent(url.trim())}`
  }

  return (
    <div className="rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-semibold mb-2">Create Your Own Tale</h3>
        <p className="text-muted-foreground mb-6">
          Transform any public GitHub repository into a unique audio tale. Your code's narrative awaits.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="url"
              placeholder="https://github.com/username/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="w-full h-12 pl-10 pr-4 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!isValid && url.length > 0}
            className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            Generate Tale
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </Button>
        </div>

        {/* Supported languages */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="text-[10px] text-muted-foreground mr-2">Supported:</span>
          {["Python", "Rust", "JS/TS", "Go", "Java", "C++", "Ruby"].map((lang) => (
            <span
              key={lang}
              className="px-2 py-0.5 rounded text-[10px] bg-background/50 text-muted-foreground border border-border/50"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
