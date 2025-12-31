"use client"

import { cn } from "@/lib/utils"

interface TaliMascotProps {
  className?: string
  size?: "sm" | "md" | "lg"
  speaking?: boolean
  mood?: "happy" | "thinking" | "excited"
}

export function TaliMascot({ className, size = "md", speaking = false, mood = "happy" }: TaliMascotProps) {
  const sizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        {/* Body - cute blob shape */}
        <ellipse cx="50" cy="55" rx="35" ry="32" className="fill-primary/20 stroke-primary" strokeWidth="2" />

        {/* Inner glow */}
        <ellipse cx="50" cy="55" rx="28" ry="25" className="fill-primary/10" />

        {/* Face */}
        {/* Left eye */}
        <ellipse cx="38" cy="50" rx="5" ry={mood === "excited" ? 6 : 5} className="fill-foreground" />
        <circle cx="36" cy="48" r="2" className="fill-background" />

        {/* Right eye */}
        <ellipse cx="62" cy="50" rx="5" ry={mood === "excited" ? 6 : 5} className="fill-foreground" />
        <circle cx="60" cy="48" r="2" className="fill-background" />

        {/* Mouth */}
        {mood === "happy" && (
          <path
            d="M42 62 Q50 70 58 62"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="text-foreground"
          />
        )}
        {mood === "excited" && <ellipse cx="50" cy="65" rx="6" ry="4" className="fill-foreground" />}
        {mood === "thinking" && <circle cx="50" cy="65" r="3" className="fill-foreground" />}

        {/* Headphones */}
        <path
          d="M25 45 Q25 25 50 25 Q75 25 75 45"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          className="text-primary"
        />
        {/* Left earpiece */}
        <rect x="18" y="40" width="12" height="16" rx="4" className="fill-primary" />
        {/* Right earpiece */}
        <rect x="70" y="40" width="12" height="16" rx="4" className="fill-primary" />

        {/* Sound waves when speaking */}
        {speaking && (
          <g className="animate-pulse">
            <path
              d="M82 48 Q88 50 82 52"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-primary"
            />
            <path
              d="M86 44 Q94 50 86 56"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-primary opacity-60"
            />
          </g>
        )}

        {/* Code bracket antenna */}
        <text x="50" y="20" textAnchor="middle" className="fill-primary text-[12px] font-mono font-bold">
          {"</>"}
        </text>
      </svg>

      {/* Floating animation wrapper */}
      <div className="absolute inset-0 animate-float pointer-events-none" />
    </div>
  )
}
