"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/waveform"
import type { StoryChapter } from "@/lib/types"

interface AudioPlayerProps {
  title: string
  subtitle?: string
  audioUrl?: string
  chapters?: StoryChapter[]
  initialPosition?: number
  onPositionChange?: (position: number) => void
  className?: string
  compact?: boolean
}

export function AudioPlayer({
  title,
  subtitle,
  audioUrl,
  chapters = [],
  initialPosition = 0,
  onPositionChange,
  className,
  compact = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialPosition)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showChapters, setShowChapters] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentChapter = chapters.find((ch, i) => {
    const nextChapter = chapters[i + 1]
    return currentTime >= ch.start_time_seconds && (!nextChapter || currentTime < nextChapter.start_time_seconds)
  })

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

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      onPositionChange?.(audioRef.current.currentTime)
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
    }
  }

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      audioRef.current.currentTime = newTime
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
    }
    setShowChapters(false)
  }

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // Demo duration if no audio
  const displayDuration = duration || 1845 // ~30 min demo

  if (compact) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
        <div className="flex items-center gap-4">
          <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <Slider value={[currentTime]} max={displayDuration} step={1} onValueChange={handleSeek} className="w-24" />
            <span>{formatTime(displayDuration)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="p-6">
        {/* Waveform visualization */}
        <div className="mb-6 flex h-24 items-center justify-center rounded-lg bg-secondary/50">
          <Waveform isPlaying={isPlaying} barCount={32} className="h-16" />
        </div>

        {/* Title and chapter */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          {currentChapter && (
            <p className="text-sm text-muted-foreground">
              Chapter {currentChapter.chapter_number}: {currentChapter.title}
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

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleSkip(-15)}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button size="icon" className="h-14 w-14 rounded-full" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleSkip(15)}>
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Secondary controls */}
        <div className="mt-4 flex items-center justify-between">
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
              className="w-20"
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

          {chapters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowChapters(!showChapters)} className="gap-1">
              <List className="h-4 w-4" />
              Chapters
              {showChapters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* Chapters panel */}
      {showChapters && chapters.length > 0 && (
        <div className="border-t border-border">
          <div className="max-h-64 overflow-y-auto p-4">
            <h4 className="mb-3 text-sm font-semibold">Chapters</h4>
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
                  <span className="flex items-center gap-2">
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
    </div>
  )
}
