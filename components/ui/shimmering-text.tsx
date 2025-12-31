"use client"

import type * as React from "react"
import { useMemo, useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface ShimmeringTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string
  duration?: number
  delay?: number
  repeat?: boolean
  repeatDelay?: number
  startOnView?: boolean
  once?: boolean
  inViewMargin?: string
  spread?: number
  color?: string
  shimmerColor?: string
}

export function ShimmeringText({
  text,
  duration = 2,
  delay = 0,
  repeat = true,
  repeatDelay = 0.5,
  startOnView = true,
  once = false,
  inViewMargin,
  spread = 2,
  color,
  shimmerColor,
  className,
  style,
  ...props
}: ShimmeringTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [isInView, setIsInView] = useState(!startOnView)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (!startOnView || !ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) {
            setHasAnimated(true)
            observer.disconnect()
          }
        } else if (!once) {
          setIsInView(false)
        }
      },
      { rootMargin: inViewMargin },
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [startOnView, once, inViewMargin])

  const shouldAnimate = isInView && (!once || !hasAnimated)

  const dynamicSpread = useMemo(() => {
    return Math.min(spread, Math.max(1, text.length / 20))
  }, [text.length, spread])

  const animationStyle = useMemo(() => {
    if (!shouldAnimate) return {}

    const totalDuration = duration + (repeat ? repeatDelay : 0)

    return {
      "--shimmer-spread": dynamicSpread,
      "--shimmer-duration": `${totalDuration}s`,
      "--shimmer-delay": `${delay}s`,
      "--shimmer-color": color || "var(--foreground)",
      "--shimmer-highlight": shimmerColor || "var(--primary)",
      backgroundImage: `linear-gradient(
        90deg,
        var(--shimmer-color) 0%,
        var(--shimmer-color) 40%,
        var(--shimmer-highlight) 50%,
        var(--shimmer-color) 60%,
        var(--shimmer-color) 100%
      )`,
      backgroundSize: `${100 * dynamicSpread}% 100%`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      animation: shouldAnimate
        ? `shimmer var(--shimmer-duration) ease-in-out var(--shimmer-delay) ${repeat ? "infinite" : "1"}`
        : "none",
    } as React.CSSProperties
  }, [shouldAnimate, duration, delay, repeat, repeatDelay, dynamicSpread, color, shimmerColor])

  return (
    <>
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 100% center;
          }
          100% {
            background-position: -100% center;
          }
        }
      `}</style>
      <span ref={ref} className={cn("inline-block", className)} style={{ ...animationStyle, ...style }} {...props}>
        {text}
      </span>
    </>
  )
}
