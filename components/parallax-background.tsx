"use client"

import { useEffect, useRef, useState } from "react"

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scrollY, setScrollY] = useState(0)

  // Parallax scroll effect
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationFrameId: number
    let currentScrollY = 0

    const handleScroll = () => {
      currentScrollY = window.scrollY
      setScrollY(currentScrollY)
    }

    const animate = () => {
      if (container) {
        const elements = container.querySelectorAll<HTMLElement>("[data-parallax]")
        elements.forEach((el) => {
          const speed = Number.parseFloat(el.dataset.parallax || "0.5")
          const yPos = -(currentScrollY * speed)
          el.style.transform = `translate3d(0, ${yPos}px, 0)`
        })
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    const particles: Particle[] = []
    const waveParticles: WaveParticle[] = []
    let wavePoints: number[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      wavePoints = new Array(Math.ceil(canvas.width / 8)).fill(0)
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    interface Particle {
      x: number
      y: number
      char: string
      opacity: number
      speed: number
      targetX: number
      phase: "code" | "transform" | "done"
      size: number
    }

    interface WaveParticle {
      x: number
      y: number
      radius: number
      opacity: number
      speed: number
    }

    const codeChars = ["<", ">", "/", "{", "}", "(", ")", "=", ";", ":", ".", "[", "]", "fn", "if", "=>", "//"]

    const createParticle = (): Particle => {
      const side = Math.random() > 0.5
      return {
        x: side ? -30 : canvas.width + 30,
        y: Math.random() * canvas.height * 0.6 + canvas.height * 0.2,
        char: codeChars[Math.floor(Math.random() * codeChars.length)],
        opacity: Math.random() * 0.4 + 0.1,
        speed: Math.random() * 0.8 + 0.4,
        targetX: canvas.width * (0.35 + Math.random() * 0.3),
        phase: "code",
        size: 10 + Math.random() * 6,
      }
    }

    const createWaveParticle = (x: number, y: number): WaveParticle => ({
      x,
      y,
      radius: 2,
      opacity: 0.6,
      speed: Math.random() * 2 + 1,
    })

    // Initialize particles
    for (let i = 0; i < 25; i++) {
      const p = createParticle()
      p.x = Math.random() * canvas.width
      particles.push(p)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const time = Date.now() * 0.001
      const centerY = canvas.height * 0.5

      // Update wave points with multiple frequencies for richer waveform
      for (let i = 0; i < wavePoints.length; i++) {
        wavePoints[i] =
          Math.sin(time * 2.5 + i * 0.08) * 25 +
          Math.sin(time * 1.8 + i * 0.12) * 15 +
          Math.sin(time * 3.2 + i * 0.05) * 10 +
          Math.cos(time * 0.8 + i * 0.03) * 20
      }

      // Draw main waveform - more prominent
      ctx.beginPath()
      ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 + Math.sin(time) * 0.02})`
      ctx.lineWidth = 3
      ctx.moveTo(0, centerY)
      for (let i = 0; i < wavePoints.length; i++) {
        ctx.lineTo(i * 8, centerY + wavePoints[i])
      }
      ctx.stroke()

      // Second waveform layer
      ctx.beginPath()
      ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 + Math.sin(time + 1) * 0.02})`
      ctx.lineWidth = 2
      ctx.moveTo(0, centerY)
      for (let i = 0; i < wavePoints.length; i++) {
        ctx.lineTo(i * 8, centerY + wavePoints[i] * 0.7 + 15)
      }
      ctx.stroke()

      // Third subtle waveform
      ctx.beginPath()
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.03})`
      ctx.lineWidth = 1
      ctx.moveTo(0, centerY)
      for (let i = 0; i < wavePoints.length; i++) {
        ctx.lineTo(i * 8, centerY + wavePoints[i] * 0.5 - 20)
      }
      ctx.stroke()

      // Update and draw code particles
      particles.forEach((p, index) => {
        if (p.phase === "code") {
          const dx = p.targetX - p.x
          p.x += dx * 0.008 * p.speed

          if (Math.abs(dx) < 80) {
            p.phase = "transform"
            // Create wave particles when code transforms
            for (let i = 0; i < 3; i++) {
              waveParticles.push(createWaveParticle(p.x, p.y))
            }
          }
        } else if (p.phase === "transform") {
          p.opacity *= 0.96
          p.size *= 0.98
          if (p.opacity < 0.02) {
            p.phase = "done"
          }
        } else {
          particles[index] = createParticle()
        }

        // Draw code particle
        if (p.phase === "code" || p.phase === "transform") {
          ctx.font = `${p.size}px monospace`
          ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`
          ctx.fillText(p.char, p.x, p.y)
        }
      })

      // Update and draw wave particles (the transformed code becoming sound)
      waveParticles.forEach((wp, index) => {
        wp.radius += wp.speed * 0.5
        wp.opacity *= 0.97

        if (wp.opacity > 0.01) {
          ctx.beginPath()
          ctx.arc(wp.x, wp.y, wp.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(139, 92, 246, ${wp.opacity})`
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          waveParticles.splice(index, 1)
        }
      })

      // Draw flowing connection lines from edges to center
      const lineOpacity = 0.025 + Math.sin(time * 0.5) * 0.01
      ctx.strokeStyle = `rgba(139, 92, 246, ${lineOpacity})`
      ctx.lineWidth = 1

      // Left flowing lines
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        const yOffset = (time * 40 + i * 120) % canvas.height
        ctx.moveTo(0, yOffset)
        ctx.bezierCurveTo(
          canvas.width * 0.15,
          yOffset + Math.sin(time + i) * 30,
          canvas.width * 0.25,
          centerY + Math.sin(time * 2 + i) * 20,
          canvas.width * 0.4,
          centerY + (wavePoints[Math.floor(canvas.width * 0.05)] || 0),
        )
        ctx.stroke()
      }

      // Right flowing lines
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        const yOffset = (time * 40 + i * 120 + 60) % canvas.height
        ctx.moveTo(canvas.width, yOffset)
        ctx.bezierCurveTo(
          canvas.width * 0.85,
          yOffset + Math.sin(time + i) * 30,
          canvas.width * 0.75,
          centerY + Math.sin(time * 2 + i) * 20,
          canvas.width * 0.6,
          centerY + (wavePoints[Math.floor(canvas.width * 0.075)] || 0),
        )
        ctx.stroke()
      }

      // Central transformation glow
      const glowRadius = 100 + Math.sin(time * 2) * 20
      const gradient = ctx.createRadialGradient(canvas.width / 2, centerY, 0, canvas.width / 2, centerY, glowRadius)
      gradient.addColorStop(0, `rgba(139, 92, 246, ${0.05 + Math.sin(time) * 0.02})`)
      gradient.addColorStop(1, "rgba(139, 92, 246, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(canvas.width / 2 - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2)

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Canvas for code-to-audio animation */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />

      {/* Gradient orbs with parallax */}
      <div
        data-parallax="0.3"
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-breathe"
      />
      <div
        data-parallax="0.2"
        className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[100px] animate-breathe"
        style={{ animationDelay: "2s" }}
      />
      <div
        data-parallax="0.4"
        className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-indigo-500/3 blur-[80px] animate-breathe"
        style={{ animationDelay: "4s" }}
      />

      {/* Subtle grid pattern */}
      <div
        data-parallax="0.1"
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.4) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139,92,246,0.4) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  )
}
