"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Play, Pause, Loader2, Mic, Film, Sparkles, GraduationCap, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAudioPlayerContext } from "@/lib/audio-player-context"
import Link from "next/link"

interface Tale {
  id: string
  title: string
  narrative_style: string
  actual_duration_seconds?: number | null
  audio_url?: string | null
  audio_chunks?: string[] | null
  code_repositories?: {
    repo_name: string
    repo_owner: string
    primary_language?: string | null
    description?: string | null
  } | null
}

interface TalesCarouselProps {
  tales: Tale[]
}

// Style configurations with distinct colors
const STYLE_CONFIG: Record<
  string,
  { color: string; bgColor: string; icon: React.ReactNode; label: string; waveformClass: string }
> = {
  podcast: {
    color: "text-purple-400",
    bgColor: "from-purple-500/30 to-purple-600/20",
    icon: <Mic className="h-4 w-4" />,
    label: "Podcast",
    waveformClass: "waveform-podcast",
  },
  documentary: {
    color: "text-blue-400",
    bgColor: "from-blue-500/30 to-blue-600/20",
    icon: <Film className="h-4 w-4" />,
    label: "Documentary",
    waveformClass: "waveform-documentary",
  },
  fiction: {
    color: "text-amber-400",
    bgColor: "from-amber-500/30 to-amber-600/20",
    icon: <Sparkles className="h-4 w-4" />,
    label: "Fiction",
    waveformClass: "waveform-fiction",
  },
  tutorial: {
    color: "text-green-400",
    bgColor: "from-green-500/30 to-green-600/20",
    icon: <GraduationCap className="h-4 w-4" />,
    label: "Tutorial",
    waveformClass: "waveform-tutorial",
  },
  technical: {
    color: "text-red-400",
    bgColor: "from-red-500/30 to-red-600/20",
    icon: <Cpu className="h-4 w-4" />,
    label: "Technical",
    waveformClass: "waveform-technical",
  },
}

function getStyleConfig(style: string) {
  return STYLE_CONFIG[style.toLowerCase()] || STYLE_CONFIG.documentary
}

export function TalesCarousel({ tales }: TalesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const { play, currentItem, isPlaying, isBuffering, toggle } = useAudioPlayerContext()

  const goTo = (index: number) => {
    if (isAnimating || tales.length === 0) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const goNext = () => {
    if (tales.length === 0) return
    goTo((currentIndex + 1) % tales.length)
  }

  const goPrev = () => {
    if (tales.length === 0) return
    goTo((currentIndex - 1 + tales.length) % tales.length)
  }

  // Auto-advance
  useEffect(() => {
    if (tales.length <= 1) return
    const timer = setInterval(goNext, 6000)
    return () => clearInterval(timer)
  }, [currentIndex, tales.length])

  if (tales.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No featured tales yet. Be the first to generate one!</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Main carousel */}
      <div ref={carouselRef} className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {tales.map((tale, index) => (
            <TaleCard key={tale.id} tale={tale} isActive={index === currentIndex} />
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {tales.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-border hover:bg-background z-10"
            onClick={goPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-border hover:bg-background z-10"
            onClick={goNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {tales.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {tales.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaleCard({ tale, isActive }: { tale: Tale; isActive: boolean }) {
  const { play, currentItem, isPlaying, isBuffering, toggle } = useAudioPlayerContext()
  const styleConfig = getStyleConfig(tale.narrative_style)

  const isThisPlaying = currentItem?.id === tale.id && isPlaying
  const isThisBuffering = currentItem?.id === tale.id && isBuffering
  const hasAudio = tale.audio_url || (tale.audio_chunks && tale.audio_chunks.length > 0)

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!hasAudio) {
      window.location.href = `/story/${tale.id}`
      return
    }

    if (currentItem?.id === tale.id) {
      toggle()
    } else {
      play({
        id: tale.id,
        title: tale.title,
        subtitle: tale.narrative_style,
        repoName: tale.code_repositories
          ? `${tale.code_repositories.repo_owner}/${tale.code_repositories.repo_name}`
          : undefined,
        audioUrl: tale.audio_url || undefined,
        audioChunks: tale.audio_chunks || undefined,
        duration: tale.actual_duration_seconds || undefined,
      })
    }
  }

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "~15m"
    const mins = Math.round(seconds / 60)
    return `${mins}m`
  }

  // Generate dynamic waveform based on title hash for consistent but unique patterns
  const generateWaveformHeights = () => {
    const hash = tale.title.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    return [...Array(40)].map((_, i) => {
      const base = Math.abs(Math.sin(i * 0.3 + hash) * 50)
      const variation = Math.abs(Math.cos(i * 0.5 + hash * 0.1) * 30)
      return 15 + base + variation
    })
  }

  const waveformHeights = generateWaveformHeights()

  return (
    <div className="w-full flex-shrink-0">
      <Link href={`/story/${tale.id}`}>
        <div
          className={cn(
            "relative rounded-2xl border bg-card/50 overflow-hidden transition-all cursor-pointer group",
            isActive ? "border-primary/50" : "border-border hover:border-primary/30",
          )}
        >
          {/* Waveform header with style-specific color */}
          <div className={cn("h-40 relative overflow-hidden bg-gradient-to-r", styleConfig.bgColor)}>
            {/* Dynamic waveform visualization */}
            <div className="absolute inset-0 flex items-end justify-center gap-[2px] px-8 pb-6">
              {waveformHeights.map((height, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-300",
                    isThisPlaying ? styleConfig.waveformClass : "",
                    styleConfig.color.replace("text-", "bg-"),
                  )}
                  style={{
                    height: `${isThisPlaying ? height : height * 0.6}%`,
                    opacity: isThisPlaying ? 0.9 : 0.5,
                    animationDelay: `${i * 0.03}s`,
                  }}
                />
              ))}
            </div>

            {/* Style badge */}
            <div
              className={cn(
                "absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm",
                styleConfig.color,
              )}
            >
              {styleConfig.icon}
              <span className="text-xs font-semibold uppercase tracking-wider">{styleConfig.label}</span>
            </div>

            {/* Now playing indicator */}
            {isThisPlaying && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-500">Now Playing</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-serif leading-tight mb-3 group-hover:text-primary transition-colors">
              {tale.title}
            </h2>

            <p className="text-sm text-muted-foreground mb-2">
              {tale.code_repositories && (
                <>
                  By <span className="text-foreground">@{tale.code_repositories.repo_owner}</span> ·{" "}
                </>
              )}
              {tale.code_repositories?.primary_language || "Code"} · {formatDuration(tale.actual_duration_seconds)}{" "}
              runtime
            </p>

            {tale.code_repositories?.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{tale.code_repositories.description}</p>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handlePlay}
                className={cn(
                  "gap-2 transition-all",
                  isThisPlaying
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground",
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
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
