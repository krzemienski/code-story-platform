"use client"

import type * as React from "react"
import { useRef, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

export type AgentState = null | "thinking" | "listening" | "talking"

interface OrbProps extends React.HTMLAttributes<HTMLDivElement> {
  colors?: [string, string]
  seed?: number
  agentState?: AgentState
  volumeMode?: "auto" | "manual"
  manualInput?: number
  manualOutput?: number
  getInputVolume?: () => number
  getOutputVolume?: () => number
}

export function Orb({
  colors = ["#CADCFC", "#A0B9D1"],
  seed,
  agentState = null,
  volumeMode = "auto",
  manualInput = 0,
  manualOutput = 0,
  getInputVolume,
  getOutputVolume,
  className,
  ...props
}: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  const actualSeed = useMemo(() => seed ?? Math.random() * 10000, [seed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = Math.min(canvas.offsetWidth, canvas.offsetHeight)

    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const baseRadius = size * 0.35

    // Simple noise function
    const noise = (x: number, y: number, z: number) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.543 + actualSeed) * 43758.5453
      return n - Math.floor(n)
    }

    const animate = () => {
      timeRef.current += 0.016

      ctx.clearRect(0, 0, size, size)

      // Get volume for animation intensity
      let intensity = 0.3
      if (agentState === "talking") {
        intensity = volumeMode === "manual" ? manualOutput : (getOutputVolume?.() ?? 0.7)
      } else if (agentState === "listening") {
        intensity = volumeMode === "manual" ? manualInput : (getInputVolume?.() ?? 0.5)
      } else if (agentState === "thinking") {
        intensity = 0.4 + Math.sin(timeRef.current * 2) * 0.2
      }

      // Draw gradient orb with organic distortion
      const gradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        0,
        centerX,
        centerY,
        baseRadius * 1.2,
      )
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(0.7, colors[1])
      gradient.addColorStop(1, "transparent")

      ctx.beginPath()

      const points = 64
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        const noiseVal = noise(Math.cos(angle) * 2 + timeRef.current * 0.5, Math.sin(angle) * 2, timeRef.current * 0.3)
        const distortion = noiseVal * baseRadius * 0.15 * (0.5 + intensity)
        const radius = baseRadius + distortion

        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Inner glow
      if (agentState) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.8)
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.3})`)
        glowGradient.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = glowGradient
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [colors, actualSeed, agentState, volumeMode, manualInput, manualOutput, getInputVolume, getOutputVolume])

  return (
    <div className={cn("relative aspect-square", className)} {...props}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
