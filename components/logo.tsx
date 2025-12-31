import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: "h-5 w-5", text: "text-sm" },
    md: { icon: "h-6 w-6", text: "text-base" },
    lg: { icon: "h-7 w-7", text: "text-lg" },
  }

  const s = sizes[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className={cn("text-primary", s.icon)}>
          {/* Book/story shape with code brackets */}
          <path
            d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          {/* Code brackets inside */}
          <path
            d="M9 8L6 12L9 16M15 8L18 12L15 16"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>
          Code<span className="text-primary">Tale</span>
        </span>
      )}
    </div>
  )
}
