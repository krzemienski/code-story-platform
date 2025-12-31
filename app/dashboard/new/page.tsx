"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Zap, MessageSquare, Loader2, Check, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RepoInput } from "@/components/repo-input"
import { IntentChat } from "@/components/intent-chat"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { createClient } from "@/lib/supabase/client"

type Step = "repo" | "mode" | "customize" | "style" | "generating"

interface RepoInfo {
  url: string
  owner: string
  name: string
  description: string
  language: string
  stars: number
}

const NARRATIVE_STYLES = [
  {
    id: "documentary",
    name: "Documentary",
    description: "Authoritative, factual narration like a tech documentary",
    icon: "📰",
  },
  {
    id: "tutorial",
    name: "Tutorial",
    description: "Step-by-step teaching style, patient and clear",
    icon: "👨‍🏫",
  },
  {
    id: "podcast",
    name: "Podcast",
    description: "Conversational, casual tone like chatting with a friend",
    icon: "🎙️",
  },
  {
    id: "fiction",
    name: "Fiction",
    description: "Code components become characters in a story",
    icon: "🎭",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Dense, detailed deep-dive for experts",
    icon: "⚙️",
  },
]

const DURATION_OPTIONS = [
  { id: "quick", label: "Quick", minutes: 5, description: "Key highlights only" },
  { id: "standard", label: "Standard", minutes: 15, description: "Thorough coverage" },
  { id: "deep", label: "Deep Dive", minutes: 30, description: "Detailed + examples" },
  { id: "exhaustive", label: "Exhaustive", minutes: 45, description: "Everything + tangents" },
]

const EXPERTISE_LEVELS = [
  { id: "beginner", label: "Beginner", description: "Explain concepts, use analogies" },
  { id: "intermediate", label: "Intermediate", description: "Assume programming knowledge" },
  { id: "expert", label: "Expert", description: "Dense information, no hand-holding" },
]

const VOICE_OPTIONS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Warm, narrative voice" },
  { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", description: "Authoritative, documentary" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Clear, technical" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Friendly, tutorial" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Conversational, podcast" },
]

export default function NewStoryPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("repo")
  const [repoUrl, setRepoUrl] = useState("")
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [isLoadingRepo, setIsLoadingRepo] = useState(false)
  const [repoError, setRepoError] = useState<string | null>(null)

  // Story configuration
  const [narrativeStyle, setNarrativeStyle] = useState("documentary")
  const [duration, setDuration] = useState("standard")
  const [expertise, setExpertise] = useState("intermediate")
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM")
  const [intent, setIntent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState("")

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

  const handleIntentComplete = (userIntent: string, focusAreas: string[]) => {
    setIntent(userIntent)
    setStep("style")
  }

  const handleGenerate = async () => {
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

      // Create story record
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
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Trigger generation API
      fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
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

          if (updatedStory.status === "completed" || updatedStory.status === "failed") {
            clearInterval(pollInterval)
            router.push(`/dashboard/story/${story.id}`)
          }
        }
      }, 2000)

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        router.push(`/dashboard/story/${story.id}`)
      }, 300000)
    } catch (error) {
      console.error("[v0] Error creating story:", error)
      setIsGenerating(false)
      setStep("style")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
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

          {/* Repo info card with Orb */}
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
                Let AI analyze the repo and create a comprehensive overview. ~15 minute story.
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
                Tell us what you want to learn. We'll tailor the analysis and narrative.
              </p>
            </button>
          </div>

          <Button variant="ghost" onClick={() => setStep("repo")} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Choose Different Repository
          </Button>
        </div>
      )}

      {/* Step: Customize Intent - Using Intent Chat */}
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
            <p className="mt-2 text-muted-foreground">How should your story sound?</p>
          </div>

          {/* Narrative style */}
          <div>
            <label className="mb-3 block text-sm font-medium">Narrative Style</label>
            <div className="grid gap-3 sm:grid-cols-3">
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

          {/* Voice selection */}
          <div>
            <label className="mb-3 block text-sm font-medium">Voice</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {VOICE_OPTIONS.map((voice) => (
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDuration(option.id)}
                  className={cn(
                    "rounded-lg border border-border bg-card p-3 text-center transition-colors hover:border-primary",
                    duration === option.id && "border-primary bg-primary/5",
                  )}
                >
                  <p className="font-medium">{option.label}</p>
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

      {/* Step: Generating with progress */}
      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-8 h-32 w-32">
            <Orb colors={["#4ade80", "#22c55e"]} agentState="thinking" className="h-full w-full" />
          </div>
          <ShimmeringText text="Generating Your Story" className="text-xl font-semibold" duration={2} repeat />

          {/* Progress bar */}
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
            This usually takes 2-5 minutes. You'll be redirected automatically.
          </p>
        </div>
      )}
    </div>
  )
}
