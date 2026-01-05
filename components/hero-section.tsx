"use client"

import { useState, useEffect } from "react"
import { Github, Sparkles, Headphones, Code, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaliMascot } from "@/components/tali-mascot"
import { cn } from "@/lib/utils"

export function HeroSection() {
  const [url, setUrl] = useState("")
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    setIsValid(githubRegex.test(url.trim()))
  }, [url])

  const handleGenerate = () => {
    if (!isValid) return
    // Store the URL in sessionStorage and scroll to generator
    sessionStorage.setItem("pendingRepoUrl", url.trim())
    const generatorElement = document.getElementById("generate")
    if (generatorElement) {
      generatorElement.scrollIntoView({ behavior: "smooth" })
    } else {
      // If not on home page, redirect to home with the URL
      window.location.href = `/?repo=${encodeURIComponent(url.trim())}#generate`
    }
  }

  return (
    <section
      id="generate"
      className="min-h-[90vh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl parallax-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl parallax-medium" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl parallax-fast" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Mascot */}
        <div className="flex justify-center mb-8">
          <TaliMascot size="lg" speaking mood="excited" />
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif mb-6 leading-tight">
          Generate Your Own
          <br />
          <span className="gradient-text italic">Code Tale</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Transform any GitHub repository into an immersive audio experience. Listen like a podcast, learn like a book,
          explore like an adventure.
        </p>

        {/* Create Your Tale Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://github.com/username/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-card border-2 border-border text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!isValid && url.length > 0}
              size="lg"
              className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-base font-semibold"
            >
              Generate Tale
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Validation feedback */}
          {url.length > 0 && !isValid && (
            <p className="text-sm text-destructive mt-2">Please enter a valid GitHub repository URL</p>
          )}
        </div>

        {/* How it works pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-card/80 border border-border backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Code className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">Paste GitHub URL</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-card/80 border border-border backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm font-medium">AI Analyzes Code</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-card/80 border border-border backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Headphones className="h-4 w-4 text-green-500" />
            </div>
            <span className="text-sm font-medium">Listen to Your Tale</span>
          </div>
        </div>

        {/* Tale Types Preview */}
        <div className="mb-8">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Choose your experience:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { style: "Podcast", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
              { style: "Documentary", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
              { style: "Fiction", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
              { style: "Tutorial", color: "bg-green-500/20 text-green-400 border-green-500/30" },
              { style: "Technical", color: "bg-red-500/20 text-red-400 border-red-500/30" },
            ].map(({ style, color }) => (
              <span key={style} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border", color)}>
                {style}
              </span>
            ))}
          </div>
        </div>

        {/* Supported languages */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">Works with:</span>
          {[
            { lang: "Python", color: "bg-yellow-500/20 text-yellow-400" },
            { lang: "TypeScript", color: "bg-blue-500/20 text-blue-400" },
            { lang: "Rust", color: "bg-orange-500/20 text-orange-400" },
            { lang: "Go", color: "bg-cyan-500/20 text-cyan-400" },
            { lang: "Java", color: "bg-red-500/20 text-red-400" },
            { lang: "Ruby", color: "bg-red-400/20 text-red-300" },
          ].map(({ lang, color }) => (
            <span key={lang} className={cn("px-3 py-1 rounded-full text-xs font-medium", color)}>
              {lang}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
