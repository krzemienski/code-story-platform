"use client"

import { useEffect, useRef, useState } from "react"

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

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
      // Smooth interpolation for parallax
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
      {/* Primary video - code transformation effect */}
      <div data-parallax="0.3" className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{
            transform: `scale(1.1) translateY(${scrollY * 0.05}px)`,
          }}
        >
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251231_1628_01kdv2tv1vefst6s4rqhrwj0h0-XPZaYuVSIKIbSP0X5GRJkSR21ZoPff.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Secondary video - waveform/audio visualization effect */}
      <div data-parallax="0.5" className="absolute inset-0 w-full h-full mix-blend-screen">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{
            transform: `scale(1.15) translateY(${scrollY * 0.08}px)`,
          }}
        >
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20251231_1628_01kdv2sph6ehkb5gegcy3j933z-1pWC9eUqk6DpFXvWtGoxEzlBmTKzhP.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Purple overlay gradient to maintain brand colors */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90"
        style={{
          background: `linear-gradient(
            to bottom,
            hsl(var(--background) / 0.85) 0%,
            hsl(var(--background) / 0.5) 30%,
            hsl(var(--background) / 0.4) 50%,
            hsl(var(--background) / 0.6) 70%,
            hsl(var(--background) / 0.95) 100%
          )`,
        }}
      />

      {/* Purple tint overlay */}
      <div className="absolute inset-0 bg-purple-900/20 mix-blend-overlay" />

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
