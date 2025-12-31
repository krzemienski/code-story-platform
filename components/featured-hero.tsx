"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Play, ListPlus, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FeaturedStory {
  id: string
  title: string
  description?: string
  repo_owner?: string
  repo_name?: string
  primary_language?: string
  actual_duration_seconds?: number
  waveformColor?: string
}

interface FeaturedHeroProps {
  stories?: FeaturedStory[]
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "from-amber-500 to-orange-600",
  JavaScript: "from-yellow-400 to-amber-500",
  TypeScript: "from-blue-500 to-cyan-500",
  Rust: "from-orange-500 to-red-600",
  Go: "from-cyan-400 to-blue-500",
  Java: "from-red-500 to-orange-500",
  "C++": "from-purple-500 to-pink-500",
  Ruby: "from-red-400 to-rose-600",
}

const DEFAULT_STORIES: FeaturedStory[] = [
  {
    id: "demo-1",
    title: "Getting Started with Code Stories",
    description: "Transform any GitHub repository into an immersive audio experience. Paste a URL below to begin.",
    repo_owner: "codestory",
    repo_name: "demo",
    primary_language: "TypeScript",
    actual_duration_seconds: 900,
  },
]

export function FeaturedHero({ stories = [] }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const displayStories = stories.length > 0 ? stories : DEFAULT_STORIES
  const story = displayStories[currentIndex]
  const waveformColor = story.primary_language
    ? LANGUAGE_COLORS[story.primary_language] || "from-purple-500 to-violet-600"
    : "from-purple-500 to-violet-600"

  const goTo = (index: number) => {
    if (isAnimating || displayStories.length <= 1) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 500)
  }

  // Auto-advance carousel
  useEffect(() => {
    if (displayStories.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayStories.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [displayStories.length])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "~15m"
    const mins = Math.round(seconds / 60)
    return `${mins}m`
  }

  const titleParts = story.title.split(":").map((s) => s.trim())
  const mainTitle = titleParts[0] || story.title
  const subtitle = titleParts[1] || ""

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Featured Story</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Featured Story Card */}
        <div className="lg:col-span-3">
          <Link href={story.id.startsWith("demo") ? "#generate" : `/story/${story.id}`}>
            <div className="relative rounded-2xl border border-border bg-card/50 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
              {/* Waveform visualization */}
              <div className={cn("h-32 relative overflow-hidden bg-gradient-to-r opacity-20", waveformColor)}>
                <div className="absolute inset-0 flex items-end justify-center gap-[2px] px-8 pb-4">
                  {[...Array(60)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/80 rounded-full waveform-bar"
                      style={{
                        height: `${20 + Math.sin(i * 0.3) * 40 + Math.random() * 20}%`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <h2 className="text-3xl sm:text-4xl font-serif leading-tight mb-1">
                  {mainTitle}
                  {subtitle && (
                    <>
                      <br />
                      <span className="italic text-muted-foreground">{subtitle}</span>
                    </>
                  )}
                </h2>

                <p className="text-sm text-muted-foreground mt-4 mb-2">
                  {story.repo_owner && (
                    <>
                      By <span className="text-foreground">@{story.repo_owner}</span> ·{" "}
                    </>
                  )}
                  {story.primary_language || "Code"} · {formatDuration(story.actual_duration_seconds)} runtime
                </p>

                {story.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{story.description}</p>
                )}

                <div className="flex items-center gap-3">
                  <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Play className="h-4 w-4" />
                    Listen Now
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent border-border hover:bg-secondary">
                    <ListPlus className="h-4 w-4" />
                    Queue
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Carousel dots */}
          {displayStories.length > 1 && (
            <div className="flex items-center gap-2 mt-4">
              {displayStories.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentIndex
                      ? "w-6 bg-foreground"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Create Your Own */}
        <div className="lg:col-span-2" id="generate">
          <CreateYourOwn />
        </div>
      </div>
    </div>
  )
}

function CreateYourOwn() {
  const [url, setUrl] = useState("")
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    setIsValid(githubRegex.test(url.trim()))
  }, [url])

  const handleGenerate = () => {
    if (!isValid) return
    window.location.href = `/?url=${encodeURIComponent(url.trim())}`
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-card/30 p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Create Your Own</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Transform any public GitHub repository into a unique audio story instantly.
      </p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-[10px] uppercase tracking-[0.15em] text-primary font-medium mb-2 block">
            Repository URL
          </label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="url"
              placeholder="https://github.com/username/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!isValid && url.length > 0}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          Generate Story
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </Button>
      </div>

      {/* Supported languages */}
      <div className="mt-6 pt-4 border-t border-border">
        <span className="text-[10px] text-muted-foreground mr-3">Supported:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {["Python", "Rust", "JS/TS", "Go", "Java", "C++"].map((lang) => (
            <span key={lang} className="px-2 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
