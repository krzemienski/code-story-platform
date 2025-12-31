"use client"

import type * as React from "react"
import { useRef, useEffect, useCallback, useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface WaveformProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: number[]
  barWidth?: number
  barGap?: number
  barRadius?: number
  barColor?: string
  fadeEdges?: boolean
  fadeWidth?: number
  height?: string | number
  onBarClick?: (index: number, value: number) => void
}

export function Waveform({
  data = [],
  barWidth = 4,
  barGap = 2,
  barRadius = 2,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 128,
  onBarClick,
  className,
  ...props
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || data.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const color =
      barColor || getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() || "#fff"
    ctx.fillStyle = `oklch(${color})`

    const totalBarWidth = barWidth + barGap
    const centerY = rect.height / 2

    data.forEach((value, index) => {
      const x = index * totalBarWidth
      const barHeight = Math.max(4, value * (rect.height - 8))
      const y = centerY - barHeight / 2

      // Apply fade effect
      let alpha = 1
      if (fadeEdges) {
        if (x < fadeWidth) {
          alpha = x / fadeWidth
        } else if (x > rect.width - fadeWidth) {
          alpha = (rect.width - x) / fadeWidth
        }
      }

      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, barRadius)
      ctx.fill()
    })
  }, [data, barWidth, barGap, barRadius, barColor, fadeEdges, fadeWidth])

  useEffect(() => {
    draw()
    const handleResize = () => draw()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [draw])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)} style={{ height }} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}

interface ScrollingWaveformProps extends Omit<WaveformProps, "data" | "onBarClick"> {
  speed?: number
  barCount?: number
}

export function ScrollingWaveform({
  speed = 50,
  barCount = 60,
  barWidth = 4,
  barGap = 2,
  barColor,
  height = 128,
  className,
  ...props
}: ScrollingWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const offsetRef = useRef(0)
  const barsRef = useRef<number[]>([])

  // Generate random bars
  useEffect(() => {
    barsRef.current = Array.from({ length: barCount + 20 }, () => 0.2 + Math.random() * 0.6)
  }, [barCount])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    ctx.scale(dpr, dpr)

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)

      const color = barColor || "0.65 0 0"
      ctx.fillStyle = `oklch(${color})`

      const totalBarWidth = barWidth + barGap
      const centerY = rect.height / 2

      offsetRef.current += speed / 60
      if (offsetRef.current >= totalBarWidth) {
        offsetRef.current = 0
        barsRef.current.shift()
        barsRef.current.push(0.2 + Math.random() * 0.6)
      }

      barsRef.current.forEach((value, index) => {
        const x = index * totalBarWidth - offsetRef.current
        if (x < -barWidth || x > rect.width) return

        const barHeight = Math.max(4, value * (rect.height - 8))
        const y = centerY - barHeight / 2

        // Fade edges
        let alpha = 1
        if (x < 24) alpha = Math.max(0, x / 24)
        else if (x > rect.width - 24) alpha = Math.max(0, (rect.width - x) / 24)

        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
  }, [barWidth, barGap, barColor, speed])

  useEffect(() => {
    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)} style={{ height }} {...props}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}

interface StaticWaveformProps extends Omit<WaveformProps, "data"> {
  bars?: number
  seed?: number
}

export function StaticWaveform({ bars = 40, seed = 42, ...props }: StaticWaveformProps) {
  const data = useMemo(() => {
    // Seeded random for consistent results
    const random = (s: number) => {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: bars }, (_, i) => 0.2 + random(seed + i) * 0.6)
  }, [bars, seed])

  return <Waveform data={data} {...props} />
}

interface AudioScrubberProps extends Omit<WaveformProps, "onBarClick"> {
  currentTime: number
  duration?: number
  onSeek?: (time: number) => void
  showHandle?: boolean
}

export function AudioScrubber({
  data = [],
  currentTime,
  duration = 100,
  onSeek,
  showHandle = true,
  barColor,
  className,
  ...props
}: AudioScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const progress = duration > 0 ? currentTime / duration : 0

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !onSeek) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * duration
    onSeek(Math.max(0, Math.min(duration, newTime)))
  }

  return (
    <div ref={containerRef} className={cn("relative cursor-pointer", className)} onClick={handleClick} {...props}>
      <Waveform data={data} barColor="0.3 0 0" {...props} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}>
        <Waveform data={data} barColor={barColor || "0.65 0.2 145"} {...props} />
      </div>
      {showHandle && (
        <div className="absolute top-0 bottom-0 w-0.5 bg-primary" style={{ left: `${progress * 100}%` }}>
          <div className="absolute -top-1 -bottom-1 -left-1.5 w-3 rounded-full bg-primary" />
        </div>
      )}
    </div>
  )
}

interface MicrophoneWaveformProps extends Omit<WaveformProps, "data"> {
  active?: boolean
  fftSize?: number
  smoothingTimeConstant?: number
  sensitivity?: number
  onError?: (error: Error) => void
}

export function MicrophoneWaveform({
  active = false,
  fftSize = 256,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  onError,
  ...props
}: MicrophoneWaveformProps) {
  const [data, setData] = useState<number[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!active) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      setData([])
      return
    }

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = smoothingTimeConstant
        analyserRef.current = analyser

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const updateData = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          const normalized = Array.from(dataArray).map((v) => Math.min(1, (v / 255) * sensitivity))
          setData(normalized.slice(0, 40))
          requestAnimationFrame(updateData)
        }

        updateData()
      } catch (error) {
        onError?.(error as Error)
      }
    }

    setupMicrophone()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [active, fftSize, smoothingTimeConstant, sensitivity, onError])

  return <Waveform data={data} {...props} />
}
