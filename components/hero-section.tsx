"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Github, Sparkles, Headphones, Code, ArrowRight, Loader2, ChevronDown, Volume2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TaliMascot } from "@/components/tali-mascot"
import { Orb } from "@/components/ui/orb"
import { Waveform } from "@/components/ui/waveform"
import { ProcessingLogs } from "@/components/processing-logs"
import { GenerationModeSelector } from "@/components/generation-mode-selector"
import { GenerationConfigPanel, useGenerationConfig } from "@/components/generation-config"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AI_MODELS, recommendModel } from "@/lib/ai/models"
import type { GenerationMode, GenerationModeConfig } from "@/lib/generation/modes"
import { cn } from "@/lib/utils"

type GeneratorStep = "input" | "options" | "generating" | "complete"

interface RepoInfo {
  owner: string
  name: string
  description: string
  language: string
  stars: number
}

const STYLES = [
  { id: "documentary", name: "Documentary", emoji: "📰", desc: "Factual, authoritative" },
  { id: "tutorial", name: "Tutorial", emoji: "📚", desc: "Step-by-step teaching" },
  { id: "podcast", name: "Podcast", emoji: "🎙️", desc: "Casual, conversational" },
  { id: "fiction", name: "Fiction", emoji: "🎭", desc: "Code as characters" },
  { id: "technical", name: "Technical", emoji: "⚙️", desc: "Dense, expert-level" },
]

const DURATIONS = [
  { id: "quick", minutes: 5, label: "5 min" },
  { id: "standard", minutes: 10, label: "10 min" },
  { id: "extended", minutes: 15, label: "15 min" },
  { id: "deep", minutes: 20, label: "20 min" },
]

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", desc: "Warm, storyteller" },
  { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", desc: "Authoritative" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", desc: "Friendly" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", desc: "Clear, precise" },
]

export function HeroSection() {
  const router = useRouter()
  const [step, setStep] = useState<GeneratorStep>("input")
  const [url, setUrl] = useState("")
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Options
  const [style, setStyle] = useState("documentary")
  const [duration, setDuration] = useState("standard")
  const [voice, setVoice] = useState("21m00Tcm4TlvDq8ikWAM")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [generationMode, setGenerationMode] = useState<GenerationMode>("hybrid")
  const [modeConfig, setModeConfig] = useState<GenerationModeConfig>({
    mode: "hybrid",
    scriptModel: "claude-sonnet-4",
    voiceSynthesis: "elevenlabs-tts",
    enableSoundEffects: false,
    enableBackgroundMusic: false,
  })

  const [generationConfig, setGenerationConfig] = useGenerationConfig()

  // Generation state
  const [storyId, setStoryId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const optionsRef = useRef<HTMLDivElement>(null)

  // Auto-select model based on options
  useEffect(() => {
    if (generationConfig.autoSelectModel) {
      const durationMinutes = DURATIONS.find((d) => d.id === duration)?.minutes || 10
      const recommended = recommendModel({
        narrativeStyle: style,
        expertiseLevel: "intermediate",
        targetDurationMinutes: durationMinutes,
        prioritize: generationConfig.priority,
      })
      if (recommended.id !== generationConfig.modelId) {
        setGenerationConfig((prev) => ({ ...prev, modelId: recommended.id }))
      }
    }
  }, [
    style,
    duration,
    generationConfig.autoSelectModel,
    generationConfig.priority,
    generationConfig.modelId,
    setGenerationConfig,
  ])

  const validateRepo = async () => {
    if (!url.trim()) return

    setIsValidating(true)
    setError(null)
    console.log("[v0] validateRepo: Starting validation for URL:", url)

    try {
      const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/)
      if (!match) throw new Error("Please enter a valid GitHub URL")

      const [, owner, name] = match
      const cleanName = name.replace(/\.git$/, "")
      console.log("[v0] validateRepo: Parsed repo:", owner, "/", cleanName)

      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanName}`)
      console.log("[v0] validateRepo: GitHub API response status:", response.status)
      if (!response.ok) throw new Error("Repository not found")

      const data = await response.json()
      console.log("[v0] validateRepo: Repo data received:", data.name, "stars:", data.stargazers_count)
      setRepoInfo({
        owner: data.owner.login,
        name: data.name,
        description: data.description || "No description",
        language: data.language || "Unknown",
        stars: data.stargazers_count,
      })
      setStep("options")
      console.log("[v0] validateRepo: Moving to options step")

      // Scroll to options after a short delay
      setTimeout(() => {
        optionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not validate repository"
      console.error("[v0] validateRepo: Error:", message, err)
      setError(message)
    } finally {
      setIsValidating(false)
    }
  }

  const startGeneration = async () => {
    if (!repoInfo) return

    console.log("[v0] startGeneration: Starting generation...")
    console.log("[v0] startGeneration: Repo info:", repoInfo)
    console.log("[v0] startGeneration: Generation mode:", generationMode)
    console.log("[v0] startGeneration: Mode config:", modeConfig)
    console.log("[v0] startGeneration: Generation config:", generationConfig)

    setStep("generating")
    setProgress(0)
    setProgressMessage("Starting...")
    setError(null)

    try {
      console.log("[v0] startGeneration: Getting Supabase client...")
      const supabase = await getSupabaseClient()
      console.log("[v0] startGeneration: Supabase client obtained")

      const durationMinutes = DURATIONS.find((d) => d.id === duration)?.minutes || 10
      console.log("[v0] startGeneration: Duration minutes:", durationMinutes)

      // Create repository record
      console.log("[v0] startGeneration: Creating repository record...")
      const { data: repo, error: repoError } = await supabase
        .from("code_repositories")
        .insert({
          repo_url: url,
          repo_name: repoInfo.name,
          repo_owner: repoInfo.owner,
          primary_language: repoInfo.language,
          stars_count: repoInfo.stars,
          description: repoInfo.description,
        })
        .select()
        .single()

      if (repoError) {
        console.error("[v0] startGeneration: Repository insert error:", repoError)
        throw new Error(`Failed to create repository: ${repoError.message}`)
      }
      console.log("[v0] startGeneration: Repository created:", repo.id)

      console.log("[v0] startGeneration: Creating story record...")
      const { data: story, error: storyError } = await supabase
        .from("stories")
        .insert({
          repository_id: repo.id,
          title: `${repoInfo.name}: Overview`,
          narrative_style: style,
          voice_id: voice,
          target_duration_minutes: durationMinutes,
          expertise_level: "intermediate",
          status: "pending",
          is_public: true,
          progress: 0,
          progress_message: "Queued...",
          generation_mode: generationMode,
          generation_config: {
            ...modeConfig,
            modelConfig: {
              modelId: generationConfig.modelId,
              temperature: generationConfig.temperature,
              priority: generationConfig.priority,
            },
          },
        })
        .select()
        .single()

      if (storyError) {
        console.error("[v0] startGeneration: Story insert error:", storyError)
        throw new Error(`Failed to create story: ${storyError.message}`)
      }
      console.log("[v0] startGeneration: Story created:", story.id)

      setStoryId(story.id)

      // Start generation in background
      console.log("[v0] startGeneration: Calling generate API...")
      const response = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          generationMode,
          modeConfig,
          modelConfig: {
            modelId: generationConfig.modelId,
            temperature: generationConfig.temperature,
          },
        }),
      })

      console.log("[v0] startGeneration: Generate API response status:", response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] startGeneration: Generate API error:", errorText)
        // Don't throw here - the generation happens in background
      }

      console.log("[v0] startGeneration: Generation initiated successfully")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start generation"
      console.error("[v0] startGeneration: Error:", message, err)
      setError(message)
      setStep("options")
    }
  }

  // Poll for status updates
  useEffect(() => {
    if (!storyId || step !== "generating") return

    let mounted = true

    const pollStatus = async () => {
      const supabase = await getSupabaseClient()

      const interval = setInterval(async () => {
        if (!mounted) return

        const { data } = await supabase
          .from("stories")
          .select("status, progress, progress_message, audio_url, audio_chunks")
          .eq("id", storyId)
          .single()

        if (data && mounted) {
          setProgress(data.progress || 0)
          setProgressMessage(data.progress_message || "Processing...")

          if (data.status === "completed") {
            clearInterval(interval)
            setIsComplete(true)
            setAudioUrl(data.audio_chunks?.[0] || data.audio_url)
            setStep("complete")
          } else if (data.status === "failed") {
            clearInterval(interval)
            setError("Generation failed. Please try again.")
            setStep("options")
          }
        }
      }, 2000)

      return interval
    }

    let intervalId: NodeJS.Timeout | undefined
    pollStatus().then((id) => {
      intervalId = id
    })

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [storyId, step])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isValidating) {
      validateRepo()
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
        {/* Input Step */}
        {step === "input" && (
          <>
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
              Transform any GitHub repository into an immersive audio experience. Listen like a podcast, learn like a
              book, explore like an adventure.
            </p>

            {/* URL Input Form */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://github.com/username/repo"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-card border-2 border-border text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <Button
                  onClick={validateRepo}
                  disabled={isValidating || !url.trim()}
                  size="lg"
                  className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-base font-semibold"
                >
                  {isValidating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Generate Tale
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {error && <p className="text-sm text-destructive mt-2">{error}</p>}

              {/* Example repos */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-xs text-muted-foreground">Try:</span>
                {["facebook/react", "vercel/next.js", "openai/whisper"].map((repo) => (
                  <button
                    key={repo}
                    onClick={() => setUrl(`https://github.com/${repo}`)}
                    className="text-xs text-primary hover:underline"
                  >
                    {repo}
                  </button>
                ))}
              </div>
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
          </>
        )}

        {/* Options Step */}
        {step === "options" && repoInfo && (
          <Card ref={optionsRef} className="max-w-2xl mx-auto overflow-hidden text-left">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Repo info */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Github className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">
                    {repoInfo.owner}/{repoInfo.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{repoInfo.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{repoInfo.language}</span>
                    <span>{repoInfo.stars.toLocaleString()} stars</span>
                  </div>
                </div>
              </div>

              {/* Generation Mode Selector */}
              <GenerationModeSelector
                mode={generationMode}
                config={modeConfig}
                onModeChange={setGenerationMode}
                onConfigChange={setModeConfig}
                narrativeStyle={style}
              />

              {/* Style selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Narrative Style</label>
                <div className="grid grid-cols-5 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        style === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="text-xl block mb-1">{s.emoji}</span>
                      <span className="text-xs font-medium">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Duration</label>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDuration(d.id)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                        duration === d.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Model Selection */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium block">AI Model</label>
                  <p className="text-xs text-muted-foreground">
                    {generationConfig.autoSelectModel
                      ? `Auto: ${AI_MODELS[generationConfig.modelId]?.displayName || "Claude Sonnet 4"}`
                      : AI_MODELS[generationConfig.modelId]?.displayName || "Claude Sonnet 4"}
                  </p>
                </div>
                <GenerationConfigPanel
                  config={generationConfig}
                  onChange={setGenerationConfig}
                  narrativeStyle={style}
                  targetDurationMinutes={DURATIONS.find((d) => d.id === duration)?.minutes || 10}
                />
              </div>

              {/* Advanced options toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                Advanced options
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Voice</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VOICES.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setVoice(v.id)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            voice === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                          )}
                        >
                          <span className="text-sm font-medium block">{v.name}</span>
                          <span className="text-xs text-muted-foreground">{v.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* Generate button */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("input")} className="bg-transparent">
                  Back
                </Button>
                <Button onClick={startGeneration} className="flex-1">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Tale
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Tales are public by default so others can discover and listen.
              </p>
            </div>
          </Card>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <Card className="max-w-2xl mx-auto overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Dynamic visualization */}
              <div className="relative h-48 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Waveform isPlaying={true} barCount={60} className="h-24 w-full opacity-30" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute -inset-8 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <Orb
                      colors={["#22c55e", "#4ade80", "#86efac"]}
                      agentState="thinking"
                      className="h-24 w-24 relative z-10"
                    />
                  </div>
                </div>
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-1 w-1 rounded-full bg-primary/40 animate-float"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: `${3 + i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{progressMessage}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Processing logs */}
              {storyId && (
                <div className="mt-6">
                  <ProcessingLogs storyId={storyId} isDemo={false} />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Complete Step */}
        {step === "complete" && storyId && (
          <Card className="max-w-2xl mx-auto overflow-hidden">
            <div className="p-6 sm:p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Volume2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your tale is ready!</h3>
              <p className="text-muted-foreground mb-6">
                {repoInfo?.name} has been transformed into an audio narrative.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push(`/story/${storyId}`)}>
                  <Play className="mr-2 h-4 w-4" />
                  Listen Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input")
                    setUrl("")
                    setRepoInfo(null)
                    setStoryId(null)
                    setError(null)
                  }}
                  className="bg-transparent"
                >
                  Create Another
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  )
}
