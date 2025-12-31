"use client"

import { useAudioPlayerContext } from "@/lib/audio-player-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  X,
  ListMusic,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"
import Link from "next/link"

export function FloatingPlayer() {
  const {
    currentItem,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isBuffering,
    queue,
    queueIndex,
    toggle,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    skipNext,
    skipPrevious,
    skipForward,
    skipBackward,
    playFromQueue,
    removeFromQueue,
    isPlayerVisible,
    isPlayerExpanded,
    setPlayerExpanded,
    hidePlayer,
  } = useAudioPlayerContext()

  if (!isPlayerVisible || !currentItem) return null

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
        isPlayerExpanded ? "h-auto" : "h-20",
      )}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-t border-border" />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Mini player bar */}
        <div className="flex h-20 items-center gap-4">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              <Waveform isPlaying={isPlaying} barCount={5} className="h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/story/${currentItem.id}`}
                className="block truncate text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {currentItem.title}
              </Link>
              {currentItem.repoName && <p className="truncate text-xs text-muted-foreground">{currentItem.repoName}</p>}
            </div>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => skipBackward(15)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
              onClick={toggle}
              disabled={isBuffering}
            >
              {isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => skipForward(15)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress and time */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
            <span className="text-xs text-muted-foreground w-10 text-right font-mono">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(v) => seek(v[0])}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 font-mono">{formatTime(duration)}</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={(v) => setVolume(v[0] / 100)}
                className="w-20"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground"
              onClick={() => {
                const idx = playbackRates.indexOf(playbackRate)
                setPlaybackRate(playbackRates[(idx + 1) % playbackRates.length])
              }}
            >
              {playbackRate}x
            </Button>

            {queue.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setPlayerExpanded(!isPlayerExpanded)}
              >
                <ListMusic className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setPlayerExpanded(!isPlayerExpanded)}
            >
              {isPlayerExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={hidePlayer}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="sm:hidden absolute top-0 left-0 right-0 h-1 bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Expanded queue panel */}
        {isPlayerExpanded && (
          <div className="border-t border-border pb-4">
            <div className="py-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Queue</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {queue.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      index === queueIndex ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground",
                    )}
                    onClick={() => playFromQueue(index)}
                  >
                    <div className="w-6 text-center text-xs text-muted-foreground">
                      {index === queueIndex && isPlaying ? (
                        <Waveform isPlaying barCount={3} className="h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.title}</p>
                      {item.repoName && <p className="text-xs text-muted-foreground truncate">{item.repoName}</p>}
                    </div>
                    {item.duration && (
                      <span className="text-xs text-muted-foreground">{formatTime(item.duration)}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromQueue(item.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
