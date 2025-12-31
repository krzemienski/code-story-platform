import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  animated?: boolean
}

export function Logo({ className, showText = true, size = "md", animated = false }: LogoProps) {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-sm", bars: 3 },
    md: { icon: "h-9 w-9", text: "text-base", bars: 4 },
    lg: { icon: "h-11 w-11", text: "text-lg", bars: 5 },
    xl: { icon: "h-14 w-14", text: "text-xl", bars: 6 },
  }

  const s = sizes[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 48 48" fill="none" className={cn("text-primary", s.icon)}>
          {/* Book shape with spine */}
          <path
            d="M6 8C6 5.79086 7.79086 4 10 4H22V44H10C7.79086 44 6 42.2091 6 40V8Z"
            fill="currentColor"
            fillOpacity="0.5"
          />
          <path
            d="M22 4H38C40.2091 4 42 5.79086 42 8V40C42 42.2091 40.2091 44 38 44H22V4Z"
            fill="currentColor"
            fillOpacity="0.8"
          />

          {/* Book spine highlight */}
          <path d="M22 4V44" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />

          {/* Code brackets on left page */}
          <path
            d="M12 18L9 24L12 30"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Waveform on right page - the "sound" coming from code */}
          <g className={animated ? "animate-pulse" : ""}>
            <rect x="26" y="20" width="2" height="8" rx="1" fill="white" fillOpacity="0.9">
              {animated && <animate attributeName="height" values="8;14;8" dur="0.8s" repeatCount="indefinite" />}
            </rect>
            <rect x="30" y="17" width="2" height="14" rx="1" fill="white" fillOpacity="0.7">
              {animated && (
                <animate attributeName="height" values="14;6;14" dur="0.8s" repeatCount="indefinite" begin="0.1s" />
              )}
            </rect>
            <rect x="34" y="19" width="2" height="10" rx="1" fill="white" fillOpacity="0.5">
              {animated && (
                <animate attributeName="height" values="10;16;10" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
              )}
            </rect>
          </g>

          {/* Sound waves emanating from book */}
          <g className={cn(animated && "opacity-60")}>
            <path
              d="M44 18C46 20 46 28 44 30"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity={animated ? 0.6 : 0.3}
            >
              {animated && (
                <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
              )}
            </path>
            <path
              d="M46 14C50 18 50 30 46 34"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity={animated ? 0.4 : 0.2}
            >
              {animated && (
                <animate
                  attributeName="stroke-opacity"
                  values="0.2;0.6;0.2"
                  dur="1.5s"
                  repeatCount="indefinite"
                  begin="0.3s"
                />
              )}
            </path>
          </g>
        </svg>
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>
          Code <span className="text-primary">Tales</span>
        </span>
      )}
    </div>
  )
}
