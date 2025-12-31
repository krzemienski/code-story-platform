"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  List,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"
import { Orb } from "@/components/ui/orb"
import { createClient } from "@/lib/supabase/client"
import type { StoryChapter } from "@/lib/types"

interface StoryPlayerProps {
  storyId: string
  title: string
  subtitle?: string
  audioUrl?: string
  chapters?: StoryChapter[]
  initialPosition?: number
  scriptText?: string
  className?: string
  isDemo?: boolean // Added isDemo prop
}

export function StoryPlayer({
  storyId,
  title,
  subtitle,
  audioUrl,
  chapters = [],
  initialPosition = 0,
  scriptText,
  className,
  isDemo, // Added isDemo prop
}: StoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialPosition)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showChapters, setShowChapters] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  const currentChapter = chapters.find((ch, i) => {
    const nextChapter = chapters[i + 1]
    const chapterEnd = ch.end_time_seconds || (nextChapter?.start_time_seconds ?? Number.POSITIVE_INFINITY)
    return currentTime >= ch.start_time_seconds && currentTime < chapterEnd
  })

  // Save playback position to database (skip in demo mode)
  const savePosition = useCallback(
    async (position: number) => {
      if (isDemo) return // Skip saving in demo mode
      const supabase = createClient()
      await supabase
        .from("stories")
        .update({
          last_played_position: Math.floor(position),
          last_played_at: new Date().toISOString(),
        })
        .eq("id", storyId)
    },
    [storyId, isDemo],
  )

  // Debounced save
  const debouncedSavePosition = useCallback(
    (position: number) => {
      if (isDemo) return // Skip in demo mode
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        savePosition(position)
      }, 5000)
    },
    [savePosition, isDemo],
  )

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Increment play count on first play (skip in demo mode)
  useEffect(() => {
    if (isDemo) return // Skip in demo mode
    if (isPlaying && currentTime < 5) {
      const supabase = createClient()
      supabase.rpc("increment_play_count", { story_id: storyId }).then(({ error }) => {
        if (error) {
          console.log("[v0] RPC not available, skipping play count")
        }
      })
    }
  }, [isPlaying, currentTime, storyId, isDemo])

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        savePosition(currentTime)
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    } else if (!audioUrl) {
      // Demo mode or no audio - just toggle state
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      debouncedSavePosition(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      if (initialPosition > 0) {
        audioRef.current.currentTime = initialPosition
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    } else {
      setCurrentTime(newTime)
    }
  }

  const handleSkip = (seconds: number) => {
    const displayDuration = duration || 1845
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(displayDuration, currentTime + seconds))
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    } else {
      const newTime = Math.max(0, Math.min(displayDuration, currentTime + seconds))
      setCurrentTime(newTime)
    }
  }

  const jumpToChapter = (chapter: StoryChapter) => {
    if (audioRef.current) {
      audioRef.current.currentTime = chapter.start_time_seconds
      setCurrentTime(chapter.start_time_seconds)
      if (!isPlaying) {
        audioRef.current.play()
        setIsPlaying(true)
      }
    } else {
      setCurrentTime(chapter.start_time_seconds)
    }
    setShowChapters(false)
  }

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const displayDuration =
    duration ||
    chapters.reduce(
      (acc, ch) =>
        acc + (ch.duration_seconds || ch.end_time_seconds ? ch.end_time_seconds! - ch.start_time_seconds : 120),
      0,
    ) ||
    892

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false)
            savePosition(duration)
          }}
        />
      )}

      <div className="p-6">
        {/* Visualization with Orb */}
        <div className="mb-6 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/40">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Waveform isPlaying={isPlaying} barCount={40} className="h-16 opacity-50" />
            </div>
            <div className="relative z-10 h-20 w-20">
              <Orb
                colors={["#4ade80", "#22c55e"]}
                agentState={isPlaying ? "talking" : null}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Title and chapter */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {currentChapter && (
            <p className="text-sm text-muted-foreground">
              Chapter {currentChapter.chapter_number}: {currentChapter.title}
            </p>
          )}
          {subtitle && !currentChapter && <p className="text-sm text-muted-foreground capitalize">{subtitle}</p>}
        </div>

        {/* Progress bar */}
        <div className="mb-4 space-y-2">
          <Slider value={[currentTime]} max={displayDuration} step={1} onValueChange={handleSeek} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => handleSkip(-15)} className="h-10 w-10">
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button size="icon" className="h-16 w-16 rounded-full" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleSkip(15)} className="h-10 w-10">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Secondary controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(v) => {
                setVolume(v[0] / 100)
                setIsMuted(false)
              }}
              className="w-24"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs bg-transparent"
            onClick={() => {
              const currentIndex = playbackRates.indexOf(playbackRate)
              const nextIndex = (currentIndex + 1) % playbackRates.length
              setPlaybackRate(playbackRates[nextIndex])
            }}
          >
            {playbackRate}x
          </Button>

          <div className="flex gap-1">
            {scriptText && (
              <Button variant="ghost" size="sm" onClick={() => setShowScript(!showScript)} className="gap-1">
                <FileText className="h-4 w-4" />
                Script
              </Button>
            )}
            {chapters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowChapters(!showChapters)} className="gap-1">
                <List className="h-4 w-4" />
                Chapters
                {showChapters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chapters panel */}
      {showChapters && chapters.length > 0 && (
        <div className="border-t border-border">
          <div className="max-h-64 overflow-y-auto p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Chapters</h4>
            <div className="space-y-1">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => jumpToChapter(chapter)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                    currentChapter?.id === chapter.id && "bg-secondary",
                  )}
                >
                  <span className="flex items-center gap-2 text-foreground">
                    {currentChapter?.id === chapter.id && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    <span className="text-muted-foreground">{chapter.chapter_number}.</span>
                    <span>{chapter.title}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{formatTime(chapter.start_time_seconds)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Script panel */}
      {showScript && scriptText && (
        <div className="border-t border-border">
          <div className="max-h-96 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Full Script</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowScript(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{scriptText}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
