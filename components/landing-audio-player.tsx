"use client"

import { useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ScrollingWaveform } from "@/components/ui/waveform"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"

const DEMO_CHAPTERS = [
  { id: "1", number: 1, title: "Introduction", startTime: 0, duration: 135 },
  { id: "2", number: 2, title: "Architecture Overview", startTime: 135, duration: 270 },
  { id: "3", number: 3, title: "Dependency Injection", startTime: 405, duration: 420 },
  { id: "4", number: 4, title: "Request Lifecycle", startTime: 825, duration: 480 },
  { id: "5", number: 5, title: "Best Practices", startTime: 1305, duration: 300 },
  { id: "6", number: 6, title: "Summary", startTime: 1605, duration: 240 },
]

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function LandingAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showChapters, setShowChapters] = useState(false)

  const duration = 1845 // ~30 min demo

  const currentChapter = DEMO_CHAPTERS.find((ch, i) => {
    const nextChapter = DEMO_CHAPTERS[i + 1]
    return currentTime >= ch.startTime && (!nextChapter || currentTime < nextChapter.startTime)
  })

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0])
  }

  const handleSkip = (seconds: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, currentTime + seconds)))
  }

  const jumpToChapter = (chapter: (typeof DEMO_CHAPTERS)[0]) => {
    setCurrentTime(chapter.startTime)
    if (!isPlaying) setIsPlaying(true)
    setShowChapters(false)
  }

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        {/* Waveform and Orb visualization */}
        <div className="relative mb-6 flex h-32 items-center justify-center rounded-lg bg-secondary/50">
          {isPlaying ? (
            <ScrollingWaveform height={80} barWidth={3} barGap={2} speed={30} barColor="0.65 0.2 145" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
                <Orb colors={["#4ade80", "#22c55e"]} agentState={isPlaying ? "talking" : null} />
              </div>
              <div className="text-center">
                <ShimmeringText text="Ready to play" className="text-lg font-medium" repeat={false} duration={1.5} />
                <p className="text-sm text-muted-foreground">Click play to start</p>
              </div>
            </div>
          )}
        </div>

        {/* Title and chapter */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold">FastAPI: Architecture Deep Dive</h3>
          {currentChapter && (
            <p className="text-sm text-muted-foreground">
              Chapter {currentChapter.number}: {currentChapter.title}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4 space-y-2">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
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

          <Button variant="ghost" size="sm" onClick={() => setShowChapters(!showChapters)} className="gap-1">
            <List className="h-4 w-4" />
            Chapters
          </Button>
        </div>
      </div>

      {/* Chapters panel */}
      {showChapters && (
        <div className="border-t border-border">
          <ScrollArea className="h-64">
            <div className="p-4">
              <h4 className="mb-3 text-sm font-semibold">Chapters</h4>
              <div className="space-y-1">
                {DEMO_CHAPTERS.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => jumpToChapter(chapter)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                      currentChapter?.id === chapter.id && "bg-secondary",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">{chapter.number}.</span>
                      <span>{chapter.title}</span>
                      {currentChapter?.id === chapter.id && isPlaying && (
                        <span className="flex gap-0.5">
                          <span className="waveform-bar h-3 w-0.5 rounded-full bg-primary" />
                          <span className="waveform-bar h-3 w-0.5 rounded-full bg-primary" />
                          <span className="waveform-bar h-3 w-0.5 rounded-full bg-primary" />
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTime(chapter.startTime)}</span>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  )
}
