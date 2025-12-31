"use client"

import { useEffect, useRef } from "react"

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationFrameId: number
    let scrollY = 0

    const handleScroll = () => {
      scrollY = window.scrollY
    }

    const animate = () => {
      if (container) {
        // Subtle parallax effect on background elements
        const elements = container.querySelectorAll<HTMLElement>("[data-parallax]")
        elements.forEach((el) => {
          const speed = Number.parseFloat(el.dataset.parallax || "0.5")
          const yPos = -(scrollY * speed)
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
      {/* Gradient orbs with parallax */}
      <div
        data-parallax="0.3"
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px]"
      />
      <div
        data-parallax="0.2"
        className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[100px]"
      />
      <div
        data-parallax="0.4"
        className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-cyan-500/3 blur-[80px]"
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Animated audio wave lines */}
      <svg className="absolute bottom-0 left-0 right-0 h-32 opacity-[0.03]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        {[...Array(5)].map((_, i) => (
          <path
            key={i}
            d={`M0,${60 + i * 10} Q${250},${40 + i * 15} 500,${60 + i * 10} T1000,${60 + i * 10} T1500,${60 + i * 10} T2000,${60 + i * 10}`}
            fill="none"
            stroke="url(#wave-gradient)"
            strokeWidth="1"
            className="animate-wave"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </svg>
    </div>
  )
}
