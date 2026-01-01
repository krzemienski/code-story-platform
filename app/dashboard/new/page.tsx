"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Zap, MessageSquare, Loader2, Check, Volume2, Sparkles, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RepoInput } from "@/components/repo-input"
import { IntentChat } from "@/components/intent-chat"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { createClient } from "@/lib/supabase/client"
import {
  ContentGenerationFramework,
  type StyleConfiguration,
  type PrimaryStyle,
  type SecondaryStyle,
  type ContentFormat,
  type PacingStyle,
  type ToneIntensity,
} from "@/lib/content-generation/framework"

type Step = "repo" | "mode" | "customize" | "style" | "advanced" | "generating"

interface RepoInfo {
  url: string
  owner: string
  name: string
  description: string
  language: string
  stars: number
}

const NARRATIVE_STYLES: Array<{
  id: PrimaryStyle
  name: string
  description: string
  icon: string
  bestFor: string
}> = [
  {
    id: "fiction",
    name: "Fiction",
    description: "Code components become characters in an epic story",
    icon: "🎭",
    bestFor: "Memorable learning, creative exploration",
  },
  {
    id: "documentary",
    name: "Documentary",
    description: "Authoritative, comprehensive analysis",
    icon: "📰",
    bestFor: "Deep understanding, technical overview",
  },
  {
    id: "tutorial",
    name: "Tutorial",
    description: "Patient, step-by-step teaching style",
    icon: "👨‍🏫",
    bestFor: "Learning new codebases, onboarding",
  },
  {
    id: "podcast",
    name: "Podcast",
    description: "Conversational, like chatting with a friend",
    icon: "🎙️",
    bestFor: "Casual learning, commute listening",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Dense, detailed deep-dive for experts",
    icon: "⚙️",
    bestFor: "Code review prep, expert analysis",
  },
]

const SECONDARY_STYLES: Array<{
  id: SecondaryStyle
  name: string
  description: string
}> = [
  { id: "dramatic", name: "Dramatic", description: "Build tension and excitement" },
  { id: "humorous", name: "Humorous", description: "Witty observations and jokes" },
  { id: "suspenseful", name: "Suspenseful", description: "Mystery and discovery" },
  { id: "inspirational", name: "Inspirational", description: "Celebrate elegant code" },
  { id: "analytical", name: "Analytical", description: "Systematic breakdown" },
  { id: "conversational", name: "Conversational", description: "Direct and engaging" },
]

const FORMAT_OPTIONS: Array<{
  id: ContentFormat
  name: string
  description: string
}> = [
  { id: "narrative", name: "Narrative", description: "Continuous flowing prose" },
  { id: "dialogue", name: "Dialogue", description: "Characters discussing code" },
  { id: "monologue", name: "Monologue", description: "Single voice exploration" },
  { id: "interview", name: "Interview", description: "Q&A format" },
  { id: "lecture", name: "Lecture", description: "Academic structure" },
  { id: "story-within-story", name: "Nested", description: "Stories within stories" },
]

const DURATION_OPTIONS = [
  { id: "micro", label: "Micro", minutes: 3, description: "~450 words, quick summary" },
  { id: "quick", label: "Quick", minutes: 5, description: "~750 words, key highlights" },
  { id: "short", label: "Short", minutes: 10, description: "~1,500 words, solid overview" },
  { id: "standard", label: "Standard", minutes: 15, description: "~2,250 words, thorough coverage" },
  { id: "extended", label: "Extended", minutes: 25, description: "~3,750 words, detailed analysis" },
  { id: "deep", label: "Deep Dive", minutes: 30, description: "~4,500 words, comprehensive" },
  { id: "exhaustive", label: "Exhaustive", minutes: 45, description: "~6,750 words, complete" },
  { id: "epic", label: "Epic", minutes: 60, description: "~9,000 words, full immersion" },
]

const EXPERTISE_LEVELS = [
  { id: "beginner", label: "Beginner", description: "Explain concepts, use analogies" },
  { id: "intermediate", label: "Intermediate", description: "Assume programming knowledge" },
  { id: "expert", label: "Expert", description: "Dense information, no hand-holding" },
]

const VOICE_OPTIONS = [
  // Fiction/Drama voices
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Warm, expressive - great for fiction",
    category: "fiction",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    description: "Deep, authoritative - epic narratives",
    category: "fiction",
  },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "British, storyteller voice", category: "fiction" },
  // Documentary/Technical voices
  {
    id: "29vD33N1CtxCmqQRPOHJ",
    name: "Drew",
    description: "Authoritative, documentary style",
    category: "documentary",
  },
  {
    id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    description: "Clear, precise - technical content",
    category: "technical",
  },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", description: "Professional, crisp delivery", category: "technical" },
  // Tutorial/Podcast voices
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "Friendly, approachable - tutorials",
    category: "tutorial",
  },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Conversational, podcast style", category: "podcast" },
  { id: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", description: "Energetic, engaging presenter", category: "podcast" },
]

const RECOMMENDED_COMBINATIONS = ContentGenerationFramework.getRecommendedCombinations()

export default function NewStoryPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("repo")
  const [repoUrl, setRepoUrl] = useState("")
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [isLoadingRepo, setIsLoadingRepo] = useState(false)
  const [repoError, setRepoError] = useState<string | null>(null)

  // Story configuration
  const [narrativeStyle, setNarrativeStyle] = useState<PrimaryStyle>("documentary")
  const [secondaryStyle, setSecondaryStyle] = useState<SecondaryStyle | null>(null)
  const [contentFormat, setContentFormat] = useState<ContentFormat>("narrative")
  const [pacing, setPacing] = useState<PacingStyle>("moderate")
  const [toneIntensity, setToneIntensity] = useState<ToneIntensity>("moderate")
  const [duration, setDuration] = useState("standard")
  const [expertise, setExpertise] = useState("intermediate")
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM")
  const [intent, setIntent] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState("")

  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  const applyRecommendedCombination = (config: StyleConfiguration) => {
    setNarrativeStyle(config.primary)
    setSecondaryStyle(config.secondary || null)
    setContentFormat(config.format || "narrative")
    setPacing(config.pacing || "moderate")
    setToneIntensity(config.toneIntensity || "moderate")

    // Auto-select best voice for style
    const voiceForStyle = VOICE_OPTIONS.find((v) => v.category === config.primary)
    if (voiceForStyle) {
      setVoiceId(voiceForStyle.id)
    }
  }

  const validateConfiguration = () => {
    const styleConfig: StyleConfiguration = {
      primary: narrativeStyle,
      secondary: secondaryStyle || undefined,
      format: contentFormat,
      pacing,
      toneIntensity,
    }

    const durationMinutes = DURATION_OPTIONS.find((d) => d.id === duration)?.minutes || 15

    const result = ContentGenerationFramework.validateParameters({
      targetDurationMinutes: durationMinutes,
      expertiseLevel: expertise as "beginner" | "intermediate" | "expert",
      style: styleConfig,
    })

    setValidationWarnings([...result.warnings, ...result.suggestions])
    return result.isValid
  }

  const handleRepoSubmit = async (url: string) => {
    setIsLoadingRepo(true)
    setRepoError(null)
    setRepoUrl(url)

    try {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) {
        throw new Error("Invalid GitHub URL")
      }

      const [, owner, name] = match
      const cleanName = name.replace(/\.git$/, "")

      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanName}`)
      if (!response.ok) {
        throw new Error("Repository not found")
      }

      const data = await response.json()
      setRepoInfo({
        url,
        owner: data.owner.login,
        name: data.name,
        description: data.description || "No description available",
        language: data.language || "Unknown",
        stars: data.stargazers_count,
      })
      setStep("mode")
    } catch {
      setRepoError("Could not fetch repository. Please check the URL and try again.")
    } finally {
      setIsLoadingRepo(false)
    }
  }

  const handleIntentComplete = (userIntent: string) => {
    setIntent(userIntent)
    setStep("style")
  }

  const handleGenerate = async () => {
    if (!validateConfiguration()) {
      return
    }

    setIsGenerating(true)
    setStep("generating")
    setGenerationProgress(0)
    setGenerationMessage("Starting story generation...")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !repoInfo) {
        throw new Error("Not authenticated")
      }

      // Create repository record
      const { data: repo, error: repoError } = await supabase
        .from("code_repositories")
        .insert({
          user_id: user.id,
          repo_url: repoInfo.url,
          repo_name: repoInfo.name,
          repo_owner: repoInfo.owner,
          primary_language: repoInfo.language,
          stars_count: repoInfo.stars,
          description: repoInfo.description,
        })
        .select()
        .single()

      if (repoError) throw repoError

      // Create intent record if custom intent provided
      let intentId = null
      if (intent) {
        const { data: intentData, error: intentError } = await supabase
          .from("story_intents")
          .insert({
            user_id: user.id,
            repository_id: repo.id,
            intent_category: "custom",
            user_description: intent,
            expertise_level: expertise,
          })
          .select()
          .single()

        if (!intentError && intentData) {
          intentId = intentData.id
        }
      }

      const styleConfig: StyleConfiguration = {
        primary: narrativeStyle,
        secondary: secondaryStyle || undefined,
        format: contentFormat,
        pacing,
        toneIntensity,
      }

      // Create story record with enhanced style metadata
      const { data: story, error: storyError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          repository_id: repo.id,
          intent_id: intentId,
          title: intent ? `${repoInfo.name}: ${intent.slice(0, 50)}...` : `${repoInfo.name}: Overview`,
          narrative_style: narrativeStyle,
          voice_id: voiceId,
          target_duration_minutes: DURATION_OPTIONS.find((d) => d.id === duration)?.minutes || 15,
          expertise_level: expertise,
          status: "pending",
          progress: 0,
          progress_message: "Queued for processing...",
          // Store full style config in preferences/metadata if column exists
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Trigger generation API with full style configuration
      fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          styleConfig, // Pass full style config
        }),
      })

      // Poll for progress
      const pollInterval = setInterval(async () => {
        const { data: updatedStory } = await supabase
          .from("stories")
          .select("status, progress, progress_message")
          .eq("id", story.id)
          .single()

        if (updatedStory) {
          setGenerationProgress(updatedStory.progress || 0)
          setGenerationMessage(updatedStory.progress_message || "Processing...")

          if (updatedStory.status === "complete" || updatedStory.status === "failed") {
            clearInterval(pollInterval)
            router.push(`/dashboard/story/${story.id}`)
          }
        }
      }, 2000)

      // Timeout after 10 minutes for long content
      setTimeout(() => {
        clearInterval(pollInterval)
        router.push(`/dashboard/story/${story.id}`)
      }, 600000)
    } catch (error) {
      console.error("[v0] Error creating story:", error)
      setIsGenerating(false)
      setStep("style")
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      {/* Step: Repository Input */}
      {step === "repo" && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">What code do you want to understand?</h1>
            <p className="mt-2 text-muted-foreground">Paste a GitHub repository URL to get started</p>
          </div>
          <RepoInput onSubmit={handleRepoSubmit} isLoading={isLoadingRepo} error={repoError} />
        </div>
      )}

      {/* Step: Mode Selection */}
      {step === "mode" && repoInfo && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Repository Found</h1>
            <p className="mt-2 text-muted-foreground">How would you like to generate your story?</p>
          </div>

          {/* Repo info card */}
          <Card className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Orb colors={["#4ade80", "#22c55e"]} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">
                  {repoInfo.owner}/{repoInfo.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{repoInfo.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{repoInfo.language}</span>
                  <span>{repoInfo.stars.toLocaleString()} stars</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Mode options */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setStep("style")}
              className="group rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Quick Generate</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Let AI analyze the repo and create a comprehensive overview.
              </p>
            </button>

            <button
              onClick={() => setStep("customize")}
              className="group rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Customize My Story</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us what you want to learn. We'll tailor the narrative.
              </p>
            </button>
          </div>

          <Button variant="ghost" onClick={() => setStep("repo")} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Choose Different Repository
          </Button>
        </div>
      )}

      {/* Step: Customize Intent */}
      {step === "customize" && repoInfo && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Customize Your Story</h1>
            <p className="mt-2 text-muted-foreground">Chat with AI to define exactly what you want to learn</p>
          </div>

          <IntentChat repoName={repoInfo.name} repoOwner={repoInfo.owner} onIntentComplete={handleIntentComplete} />

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep("mode")} className="flex-1 bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setStep("style")} className="flex-1">
              Skip to Style
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Style Selection */}
      {step === "style" && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Choose Your Style</h1>
            <p className="mt-2 text-muted-foreground">Customize how your story sounds</p>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">Quick Presets</label>
            <div className="grid gap-2 sm:grid-cols-4">
              {RECOMMENDED_COMBINATIONS.slice(0, 4).map((combo) => (
                <button
                  key={combo.name}
                  onClick={() => applyRecommendedCombination(combo.config)}
                  className={cn(
                    "rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary",
                    narrativeStyle === combo.config.primary &&
                      secondaryStyle === combo.config.secondary &&
                      "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{combo.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{combo.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Primary narrative style */}
          <div>
            <label className="mb-3 block text-sm font-medium">Primary Style</label>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {NARRATIVE_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setNarrativeStyle(style.id)}
                  className={cn(
                    "relative rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary",
                    narrativeStyle === style.id && "border-primary bg-primary/5",
                  )}
                >
                  {narrativeStyle === style.id && (
                    <div className="absolute right-2 top-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="text-2xl">{style.icon}</span>
                  <h4 className="mt-2 font-medium">{style.name}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">
              Style Overlay <span className="text-muted-foreground">(optional)</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {SECONDARY_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSecondaryStyle(secondaryStyle === style.id ? null : style.id)}
                  className={cn(
                    "rounded-lg border border-border bg-card p-2 text-center transition-colors hover:border-primary",
                    secondaryStyle === style.id && "border-primary bg-primary/5",
                  )}
                >
                  <p className="font-medium text-sm">{style.name}</p>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice selection */}
          <div>
            <label className="mb-3 block text-sm font-medium">Voice</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {VOICE_OPTIONS.filter((v) => v.category === narrativeStyle || !narrativeStyle)
                .slice(0, 6)
                .map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setVoiceId(voice.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary",
                      voiceId === voice.id && "border-primary bg-primary/5",
                    )}
                  >
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{voice.name}</p>
                      <p className="text-xs text-muted-foreground">{voice.description}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-3 block text-sm font-medium">Story Length</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDuration(option.id)}
                  className={cn(
                    "rounded-lg border border-border bg-card p-2 text-center transition-colors hover:border-primary",
                    duration === option.id && "border-primary bg-primary/5",
                  )}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">~{option.minutes} min</p>
                </button>
              ))}
            </div>
          </div>

          {/* Expertise */}
          <div>
            <label className="mb-3 block text-sm font-medium">Expertise Level</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {EXPERTISE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setExpertise(level.id)}
                  className={cn(
                    "rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary",
                    expertise === level.id && "border-primary bg-primary/5",
                  )}
                >
                  <p className="font-medium">{level.label}</p>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Advanced Options
            </span>
            <ArrowRight className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-90")} />
          </Button>

          {showAdvanced && (
            <div className="space-y-6 rounded-lg border border-border bg-card/50 p-4">
              {/* Content format */}
              <div>
                <label className="mb-3 block text-sm font-medium">Content Format</label>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {FORMAT_OPTIONS.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setContentFormat(format.id)}
                      className={cn(
                        "rounded-lg border border-border bg-card p-2 text-center transition-colors hover:border-primary",
                        contentFormat === format.id && "border-primary bg-primary/5",
                      )}
                    >
                      <p className="font-medium text-sm">{format.name}</p>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pacing */}
              <div>
                <label className="mb-3 block text-sm font-medium">Pacing</label>
                <div className="grid gap-2 sm:grid-cols-4">
                  {(["fast", "moderate", "slow", "variable"] as PacingStyle[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPacing(p)}
                      className={cn(
                        "rounded-lg border border-border bg-card p-2 text-center capitalize transition-colors hover:border-primary",
                        pacing === p && "border-primary bg-primary/5",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone intensity */}
              <div>
                <label className="mb-3 block text-sm font-medium">Tone Intensity</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["subtle", "moderate", "intense"] as ToneIntensity[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setToneIntensity(t)}
                      className={cn(
                        "rounded-lg border border-border bg-card p-2 text-center capitalize transition-colors hover:border-primary",
                        toneIntensity === t && "border-primary bg-primary/5",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {validationWarnings.length > 0 && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <p className="text-sm font-medium text-yellow-600">Suggestions:</p>
              <ul className="mt-2 space-y-1">
                {validationWarnings.map((warning, i) => (
                  <li key={i} className="text-sm text-yellow-600/80">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep(intent ? "customize" : "mode")}
              className="flex-1 bg-transparent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleGenerate} className="flex-1" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Story
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-8 h-32 w-32">
            <Orb colors={["#4ade80", "#22c55e"]} agentState="thinking" className="h-full w-full" />
          </div>
          <ShimmeringText text="Generating Your Story" className="text-xl font-semibold" duration={2} repeat />

          <div className="mt-6 w-full max-w-md">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{generationProgress}% complete</p>
          </div>

          <p className="mt-4 text-muted-foreground">{generationMessage}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This may take several minutes for longer content. You'll be redirected automatically.
          </p>
        </div>
      )}
    </div>
  )
}
