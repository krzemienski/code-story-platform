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
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"
import { Orb } from "@/components/ui/orb"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { StoryChapter } from "@/lib/types"

interface StoryPlayerProps {
  storyId: string
  title: string
  subtitle?: string
  audioUrl?: string
  audioChunks?: string[]
  chapters?: StoryChapter[]
  initialPosition?: number
  scriptText?: string
  className?: string
  isDemo?: boolean
}

export function StoryPlayer({
  storyId,
  title,
  subtitle,
  audioUrl,
  audioChunks = [],
  chapters = [],
  initialPosition = 0,
  scriptText,
  className,
  isDemo,
}: StoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialPosition)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showChapters, setShowChapters] = useState(false)
  const [showScript, setShowScript] = useState(false)

  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [chunkDurations, setChunkDurations] = useState<number[]>([])
  const [totalDuration, setTotalDuration] = useState(0)
  const [isLoadingChunk, setIsLoadingChunk] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  const effectiveAudioChunks = audioChunks.length > 0 ? audioChunks : audioUrl ? [audioUrl] : []
  const hasMultipleChunks = effectiveAudioChunks.length > 1

  const getChunkStartTime = useCallback(
    (chunkIndex: number) => {
      return chunkDurations.slice(0, chunkIndex).reduce((sum, d) => sum + d, 0)
    },
    [chunkDurations],
  )

  const getGlobalTime = useCallback(
    (chunkIndex: number, chunkTime: number) => {
      return getChunkStartTime(chunkIndex) + chunkTime
    },
    [getChunkStartTime],
  )

  const findChunkForTime = useCallback(
    (globalTime: number): { chunkIndex: number; localTime: number } => {
      let accumulated = 0
      for (let i = 0; i < chunkDurations.length; i++) {
        if (globalTime < accumulated + chunkDurations[i]) {
          return { chunkIndex: i, localTime: globalTime - accumulated }
        }
        accumulated += chunkDurations[i]
      }
      return {
        chunkIndex: Math.max(0, chunkDurations.length - 1),
        localTime: chunkDurations[chunkDurations.length - 1] || 0,
      }
    },
    [chunkDurations],
  )

  const currentChapter = chapters.find((ch, i) => {
    const nextChapter = chapters[i + 1]
    const chapterEnd = ch.end_time_seconds || (nextChapter?.start_time_seconds ?? Number.POSITIVE_INFINITY)
    return currentTime >= ch.start_time_seconds && currentTime < chapterEnd
  })

  const savePosition = useCallback(
    async (position: number) => {
      if (isDemo) return
      const supabase = await getSupabaseClient()
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

  const debouncedSavePosition = useCallback(
    (position: number) => {
      if (isDemo) return
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

  useEffect(() => {
    if (effectiveAudioChunks.length === 0) return

    const loadDurations = async () => {
      const durations: number[] = []

      for (const url of effectiveAudioChunks) {
        try {
          const audio = new Audio()
          await new Promise<void>((resolve) => {
            audio.onloadedmetadata = () => {
              durations.push(audio.duration)
              resolve()
            }
            audio.onerror = () => {
              durations.push(180)
              resolve()
            }
            audio.src = url
          })
        } catch {
          durations.push(180)
        }
      }

      setChunkDurations(durations)
      setTotalDuration(durations.reduce((sum, d) => sum + d, 0))
    }

    loadDurations()
  }, [effectiveAudioChunks])

  useEffect(() => {
    if (isDemo) return
    if (isPlaying && currentTime < 5) {
      getSupabaseClient().then((supabase) => {
        supabase.rpc("increment_play_count", { story_id: storyId }).then(({ error }) => {
          if (error) {
            console.log("[v0] RPC not available, skipping play count")
          }
        })
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
    } else if (effectiveAudioChunks.length === 0) {
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const globalTime = getGlobalTime(currentChunkIndex, audioRef.current.currentTime)
      setCurrentTime(globalTime)
      debouncedSavePosition(globalTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current && !hasMultipleChunks) {
      setDuration(audioRef.current.duration)
      setTotalDuration(audioRef.current.duration)
      if (initialPosition > 0) {
        audioRef.current.currentTime = initialPosition
      }
    }
  }

  const handleChunkEnded = async () => {
    if (currentChunkIndex < effectiveAudioChunks.length - 1) {
      setIsLoadingChunk(true)
      setCurrentChunkIndex(currentChunkIndex + 1)

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
        }
        setIsLoadingChunk(false)
      }, 100)
    } else {
      setIsPlaying(false)
      savePosition(totalDuration)
    }
  }

  const handleSeek = (value: number[]) => {
    const newGlobalTime = value[0]

    if (hasMultipleChunks && chunkDurations.length > 0) {
      const { chunkIndex, localTime } = findChunkForTime(newGlobalTime)

      if (chunkIndex !== currentChunkIndex) {
        setCurrentChunkIndex(chunkIndex)
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = localTime
            if (isPlaying) audioRef.current.play()
          }
        }, 100)
      } else if (audioRef.current) {
        audioRef.current.currentTime = localTime
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = newGlobalTime
    }

    setCurrentTime(newGlobalTime)
  }

  const handleSkip = (seconds: number) => {
    const displayDuration = totalDuration || duration || 1845
    const newTime = Math.max(0, Math.min(displayDuration, currentTime + seconds))
    handleSeek([newTime])
  }

  const jumpToChapter = (chapter: StoryChapter) => {
    handleSeek([chapter.start_time_seconds])
    if (!isPlaying && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
    setShowChapters(false)
  }

  const handleDownload = async () => {
    if (effectiveAudioChunks.length === 0) return

    try {
      const response = await fetch(`/api/stories/${storyId}/download`)

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("[v0] Download failed:", error)
      window.open(effectiveAudioChunks[0], "_blank")
    }
  }

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const displayDuration =
    totalDuration ||
    duration ||
    chapters.reduce(
      (acc, ch) =>
        acc + (ch.duration_seconds || ch.end_time_seconds ? ch.end_time_seconds! - ch.start_time_seconds : 120),
      0,
    ) ||
    892

  const currentAudioSrc = effectiveAudioChunks[currentChunkIndex] || audioUrl

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {currentAudioSrc && (
        <audio
          ref={audioRef}
          src={currentAudioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleChunkEnded}
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
                agentState={isPlaying ? "talking" : isLoadingChunk ? "thinking" : null}
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
          {hasMultipleChunks && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              Part {currentChunkIndex + 1} of {effectiveAudioChunks.length}
            </p>
          )}
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
          <Button size="icon" className="h-16 w-16 rounded-full" onClick={handlePlayPause} disabled={isLoadingChunk}>
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
            {effectiveAudioChunks.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1">
                <Download className="h-4 w-4" />
              </Button>
            )}
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
                  key={chapter.id || chapter.chapter_number}
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
