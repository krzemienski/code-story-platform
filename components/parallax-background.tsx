"use client"

import { useEffect, useRef, useState } from "react"

// Landscape video (wider aspect ratio)
const LANDSCAPE_VIDEO = "/images/20251231-1628-01kdv2tv1vefst6s4rqhrwj0h0.mp4"
// Portrait video (taller aspect ratio)
const PORTRAIT_VIDEO = "/images/20251231-1628-01kdv2sph6ehkb5gegcy3j933z.mp4"

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [isPortrait, setIsPortrait] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    checkOrientation()
    window.addEventListener("resize", checkOrientation)
    return () => window.removeEventListener("resize", checkOrientation)
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, that's okay
      })
    }
  }, [isPortrait])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationFrameId: number
    let currentScrollY = 0
    let targetScrollY = 0

    const handleScroll = () => {
      targetScrollY = window.scrollY
      setScrollY(window.scrollY)
    }

    const animate = () => {
      currentScrollY += (targetScrollY - currentScrollY) * 0.1

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

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div data-parallax="0.2" className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          key={isPortrait ? "portrait" : "landscape"}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          style={{
            transform: `scale(1.15) translateY(${scrollY * 0.03}px)`,
          }}
        >
          <source src={isPortrait ? PORTRAIT_VIDEO : LANDSCAPE_VIDEO} type="video/mp4" />
        </video>
      </div>

      {/* Purple overlay gradient to maintain brand colors */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            hsl(var(--background) / 0.7) 0%,
            hsl(var(--background) / 0.4) 30%,
            hsl(var(--background) / 0.3) 50%,
            hsl(var(--background) / 0.5) 70%,
            hsl(var(--background) / 0.9) 100%
          )`,
        }}
      />

      {/* Purple tint overlay for brand consistency */}
      <div className="absolute inset-0 bg-purple-900/30 mix-blend-overlay" />

      {/* Animated glow orbs with parallax for depth */}
      <div
        data-parallax="0.6"
        className="absolute top-[-15%] right-[-5%] w-[800px] h-[800px] rounded-full bg-purple-500/15 blur-[120px] animate-breathe"
      />
      <div
        data-parallax="0.35"
        className="absolute bottom-[-5%] left-[-5%] w-[700px] h-[700px] rounded-full bg-violet-500/10 blur-[100px] animate-breathe"
        style={{ animationDelay: "2s" }}
      />
      <div
        data-parallax="0.8"
        className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[80px] animate-breathe"
        style={{ animationDelay: "4s" }}
      />
      <div
        data-parallax="0.5"
        className="absolute top-[60%] right-[15%] w-[400px] h-[400px] rounded-full bg-fuchsia-500/8 blur-[90px] animate-breathe"
        style={{ animationDelay: "3s" }}
      />

      {/* Subtle vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, hsl(var(--background) / 0.4) 100%)`,
        }}
      />
    </div>
  )
}
