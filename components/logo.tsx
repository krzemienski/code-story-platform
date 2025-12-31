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
          {/* Diamond/rhombus shape */}
          <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="currentColor" fillOpacity="0.9" />
          {/* Inner play symbol */}
          <path d="M10 8L16 12L10 16V8Z" fill="white" fillOpacity="0.9" />
        </svg>
      </div>
      {showText && (
        <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>
          Code<span className="text-primary">.</span>Story
        </span>
      )}
    </div>
  )
}
