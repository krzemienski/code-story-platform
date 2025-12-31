"use client"

import { cn } from "@/lib/utils"

interface WaveformProps {
  isPlaying?: boolean
  className?: string
  barCount?: number
}

export function Waveform({ isPlaying = false, className, barCount = 8 }: WaveformProps) {
  return (
    <div className={cn("flex h-8 items-end gap-1", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn("w-1 rounded-full bg-primary transition-transform", isPlaying ? "waveform-bar" : "h-2")}
          style={{
            height: isPlaying ? `${20 + Math.random() * 60}%` : "8px",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}
