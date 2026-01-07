"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GitBranch,
  FileCode,
  Bot,
  Mic,
  Play,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronRight,
  Settings,
  Eye,
  Terminal,
  Sparkles,
  Clock,
  Zap,
} from "lucide-react"

// AI Models available for script generation
const AI_MODELS = [
  { id: "anthropic/claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic", tier: "recommended" },
  { id: "anthropic/claude-opus-4-20250514", name: "Claude Opus 4", provider: "Anthropic", tier: "premium" },
  { id: "anthropic/claude-4-5-sonnet-20250514", name: "Claude 4.5 Sonnet", provider: "Anthropic", tier: "latest" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", tier: "recommended" },
  { id: "openai/gpt-4.1", name: "GPT-4.1", provider: "OpenAI", tier: "latest" },
  { id: "openai/o3-mini", name: "o3-mini", provider: "OpenAI", tier: "fast" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", provider: "Google", tier: "fast" },
]

// ElevenLabs voice options
const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm, narrative" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Strong, confident" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Soft, warm" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Well-rounded, male" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Emotional, female" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", description: "Deep, male" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", description: "Crisp, male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Deep, male narrator" },
]

// Narrative styles
const NARRATIVE_STYLES = [
  { id: "documentary", name: "Documentary", description: "Factual, informative narration" },
  { id: "story", name: "Story", description: "Engaging narrative arc" },
  { id: "tutorial", name: "Tutorial", description: "Step-by-step educational" },
  { id: "podcast", name: "Podcast", description: "Conversational, casual" },
]

// Pipeline stages
type PipelineStage =
  | "idle"
  | "validating"
  | "analyzing"
  | "configuring"
  | "generating"
  | "synthesizing"
  | "complete"
  | "error"

interface PipelineLog {
  id: string
  timestamp: Date
  stage: string
  message: string
  level: "info" | "success" | "warning" | "error"
  details?: Record<string, unknown>
}

interface RepoInfo {
  name: string
  fullName: string
  description: string
  language: string
  stars: number
  forks: number
  topics: string[]
  defaultBranch: string
}

interface GenerationConfig {
  model: string
  voice: string
  narrativeStyle: string
  duration: number
  generationMode: "hybrid" | "elevenlabs_studio"
  includeMusic: boolean
  includeSfx: boolean
}

export function GenerationPipeline() {
  // URL and repo state
  const [repoUrl, setRepoUrl] = useState("")
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)

  // Pipeline state
  const [stage, setStage] = useState<PipelineStage>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [storyId, setStoryId] = useState<string | null>(null)

  // Configuration
  const [config, setConfig] = useState<GenerationConfig>({
    model: "anthropic/claude-sonnet-4-20250514",
    voice: "21m00Tcm4TlvDq8ikWAM",
    narrativeStyle: "documentary",
    duration: 15,
    generationMode: "hybrid",
    includeMusic: false,
    includeSfx: false,
  })

  // Logs
  const [logs, setLogs] = useState<PipelineLog[]>([])
  const [showLogs, setShowLogs] = useState(true)

  // Context preview
  const [contextPreview, setContextPreview] = useState<string | null>(null)
  const [showContext, setShowContext] = useState(false)

  // Add log entry
  const addLog = useCallback(
    (stage: string, message: string, level: PipelineLog["level"] = "info", details?: Record<string, unknown>) => {
      const log: PipelineLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        stage,
        message,
        level,
        details,
      }
      setLogs((prev) => [log, ...prev])
      console.log(`[v0] [${stage}] ${message}`, details || "")
    },
    [],
  )

  // Validate GitHub URL
  const validateRepo = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL")
      return
    }

    setStage("validating")
    setError(null)
    addLog("Validator", "Validating GitHub URL...")

    try {
      // Parse GitHub URL
      const urlPattern = /github\.com\/([^/]+)\/([^/]+)/
      const match = repoUrl.match(urlPattern)

      if (!match) {
        throw new Error("Invalid GitHub URL format. Please use: https://github.com/owner/repo")
      }

      const [, owner, repo] = match
      const repoName = repo.replace(/\.git$/, "")

      addLog("Validator", `Fetching repository info for ${owner}/${repoName}...`)

      // Fetch repo info from GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Repository not found. Please check the URL.")
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()

      const info: RepoInfo = {
        name: data.name,
        fullName: data.full_name,
        description: data.description || "No description",
        language: data.language || "Unknown",
        stars: data.stargazers_count,
        forks: data.forks_count,
        topics: data.topics || [],
        defaultBranch: data.default_branch,
      }

      setRepoInfo(info)
      addLog("Validator", "Repository validated successfully", "success", {
        name: info.fullName,
        language: info.language,
        stars: info.stars,
      })

      setStage("configuring")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation failed"
      setError(message)
      addLog("Validator", message, "error")
      setStage("error")
    }
  }

  // Start generation
  const startGeneration = async () => {
    if (!repoInfo) return

    setStage("analyzing")
    setProgress(0)
    setError(null)
    addLog("System", "Starting tale generation pipeline...")

    try {
      // Import Supabase client dynamically
      addLog("System", "Initializing database connection...")
      const { getSupabaseClient } = await import("@/lib/supabase/client")
      const supabase = await getSupabaseClient()

      // Get current user (optional - allow anonymous generation)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      addLog("System", user ? `Authenticated as ${user.email}` : "Anonymous generation", "info")

      // Create or get repository record
      addLog("Analyzer", "Creating repository record...")
      const { data: repoRecord, error: repoError } = await supabase
        .from("code_repositories")
        .upsert(
          {
            github_url: repoUrl,
            name: repoInfo.name,
            full_name: repoInfo.fullName,
            description: repoInfo.description,
            primary_language: repoInfo.language,
            default_branch: repoInfo.defaultBranch,
            stars_count: repoInfo.stars,
            forks_count: repoInfo.forks,
            topics: repoInfo.topics,
            last_analyzed_at: new Date().toISOString(),
          },
          { onConflict: "github_url" },
        )
        .select()
        .single()

      if (repoError) {
        throw new Error(`Failed to create repository: ${repoError.message}`)
      }
      addLog("Analyzer", "Repository record created", "success", { id: repoRecord.id })

      // Create story record
      addLog("System", "Creating tale record...")
      const { data: story, error: storyError } = await supabase
        .from("stories")
        .insert({
          user_id: user?.id || null,
          repository_id: repoRecord.id,
          title: `${repoInfo.name}: Overview`,
          status: "pending",
          narrative_style: config.narrativeStyle,
          target_duration_minutes: config.duration,
          is_public: true,
          progress: 0,
          progress_message: "Initializing generation...",
          generation_mode: config.generationMode,
          model_config: {
            model: config.model,
            voice: config.voice,
          },
          generation_config: {
            includeMusic: config.includeMusic,
            includeSfx: config.includeSfx,
          },
        })
        .select()
        .single()

      if (storyError) {
        throw new Error(`Failed to create story: ${storyError.message}`)
      }

      setStoryId(story.id)
      addLog("System", "Tale record created", "success", { id: story.id })

      // Call generate API
      setStage("generating")
      addLog("Narrator", "Starting AI script generation...")

      const generateResponse = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          repositoryId: repoRecord.id,
          narrativeStyle: config.narrativeStyle,
          targetDuration: config.duration,
          generationMode: config.generationMode,
          modelConfig: {
            model: config.model,
            voice: config.voice,
          },
          modeConfig: {
            includeMusic: config.includeMusic,
            includeSfx: config.includeSfx,
          },
        }),
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Generation failed: ${generateResponse.status}`)
      }

      addLog("System", "Generation started - polling for updates...", "success")

      // Start polling for progress
      pollProgress(story.id, supabase)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed"
      setError(message)
      addLog("System", message, "error")
      setStage("error")
    }
  }

  // Poll for progress updates
  const pollProgress = async (
    id: string,
    supabase: Awaited<ReturnType<typeof import("@/lib/supabase/client").getSupabaseClient>>,
  ) => {
    const poll = async () => {
      try {
        const { data: story, error } = await supabase
          .from("stories")
          .select("status, progress, progress_message, error_message, audio_url")
          .eq("id", id)
          .single()

        if (error) {
          console.error("[v0] Poll error:", error)
          return
        }

        setProgress(story.progress || 0)

        if (story.status === "completed") {
          setStage("complete")
          addLog("System", "Tale generation complete!", "success", { audioUrl: story.audio_url })
          return
        }

        if (story.status === "failed") {
          setError(story.error_message || "Generation failed")
          setStage("error")
          addLog("System", story.error_message || "Generation failed", "error")
          return
        }

        // Update stage based on progress message
        if (story.progress_message?.includes("audio") || story.progress_message?.includes("synth")) {
          setStage("synthesizing")
        }

        addLog("Progress", story.progress_message || "Processing...", "info", { progress: story.progress })

        // Continue polling
        setTimeout(poll, 3000)
      } catch (err) {
        console.error("[v0] Poll exception:", err)
        setTimeout(poll, 5000)
      }
    }

    poll()
  }

  // Get stage info
  const getStageInfo = (s: PipelineStage) => {
    const stages = {
      idle: { icon: Circle, color: "text-muted-foreground", label: "Ready" },
      validating: { icon: Loader2, color: "text-blue-500", label: "Validating" },
      analyzing: { icon: FileCode, color: "text-purple-500", label: "Analyzing" },
      configuring: { icon: Settings, color: "text-yellow-500", label: "Configure" },
      generating: { icon: Bot, color: "text-green-500", label: "Generating" },
      synthesizing: { icon: Mic, color: "text-orange-500", label: "Synthesizing" },
      complete: { icon: CheckCircle2, color: "text-green-500", label: "Complete" },
      error: { icon: AlertCircle, color: "text-red-500", label: "Error" },
    }
    return stages[s]
  }

  const currentStageInfo = getStageInfo(stage)
  const StageIcon = currentStageInfo.icon

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generate Code Tale</h2>
          <p className="text-muted-foreground">Transform any GitHub repository into an audio story</p>
        </div>
        <div className="flex items-center gap-2">
          <StageIcon
            className={`h-5 w-5 ${currentStageInfo.color} ${stage === "validating" || stage === "analyzing" || stage === "generating" || stage === "synthesizing" ? "animate-spin" : ""}`}
          />
          <span className={`font-medium ${currentStageInfo.color}`}>{currentStageInfo.label}</span>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        {["validating", "analyzing", "generating", "synthesizing", "complete"].map((s, i, arr) => {
          const info = getStageInfo(s as PipelineStage)
          const Icon = info.icon
          const isActive = s === stage
          const isComplete = arr.indexOf(stage) > i || stage === "complete"

          return (
            <div key={s} className="flex items-center">
              <div className={`flex flex-col items-center gap-1 ${isActive ? "scale-110" : ""} transition-transform`}>
                <div
                  className={`p-2 rounded-full ${isComplete ? "bg-green-500/20" : isActive ? "bg-primary/20" : "bg-muted"}`}
                >
                  <Icon
                    className={`h-5 w-5 ${isComplete ? "text-green-500" : isActive ? info.color : "text-muted-foreground"} ${isActive && s !== "complete" ? "animate-pulse" : ""}`}
                  />
                </div>
                <span className={`text-xs ${isActive ? "font-medium" : "text-muted-foreground"}`}>{info.label}</span>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight className={`h-4 w-4 mx-2 ${isComplete ? "text-green-500" : "text-muted-foreground"}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      {(stage === "generating" || stage === "synthesizing") && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input & Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Repository Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Repository
              </CardTitle>
              <CardDescription>Enter a GitHub repository URL to analyze</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/owner/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={stage !== "idle" && stage !== "error" && stage !== "configuring"}
                  className="flex-1"
                />
                <Button onClick={validateRepo} disabled={stage !== "idle" && stage !== "error"}>
                  {stage === "validating" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
                </Button>
              </div>

              {/* Repo Info */}
              {repoInfo && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{repoInfo.fullName}</span>
                    <Badge variant="secondary">{repoInfo.language}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{repoInfo.description}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>⭐ {repoInfo.stars.toLocaleString()}</span>
                    <span>🍴 {repoInfo.forks.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          {(stage === "configuring" || repoInfo) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration
                </CardTitle>
                <CardDescription>Customize your tale generation</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ai">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ai">AI Model</TabsTrigger>
                    <TabsTrigger value="voice">Voice</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ai" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Script Generation Model</Label>
                      <Select value={config.model} onValueChange={(v) => setConfig((c) => ({ ...c, model: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center gap-2">
                                <span>{m.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {m.provider}
                                </Badge>
                                {m.tier === "recommended" && <Sparkles className="h-3 w-3 text-yellow-500" />}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Generation Mode</Label>
                      <Select
                        value={config.generationMode}
                        onValueChange={(v: "hybrid" | "elevenlabs_studio") =>
                          setConfig((c) => ({ ...c, generationMode: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hybrid">
                            <div className="flex items-center gap-2">
                              <span>Hybrid (AI Script + ElevenLabs TTS)</span>
                              <Badge variant="outline">Recommended</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="elevenlabs_studio">
                            <div className="flex items-center gap-2">
                              <span>ElevenLabs Studio (Full Production)</span>
                              <Badge variant="outline">Premium</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="voice" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Narrator Voice</Label>
                      <Select value={config.voice} onValueChange={(v) => setConfig((c) => ({ ...c, voice: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICES.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              <div className="flex items-center gap-2">
                                <span>{v.name}</span>
                                <span className="text-muted-foreground text-xs">- {v.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {config.generationMode === "elevenlabs_studio" && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Background Music</Label>
                          <Switch
                            checked={config.includeMusic}
                            onCheckedChange={(v) => setConfig((c) => ({ ...c, includeMusic: v }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Sound Effects</Label>
                          <Switch
                            checked={config.includeSfx}
                            onCheckedChange={(v) => setConfig((c) => ({ ...c, includeSfx: v }))}
                          />
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="style" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Narrative Style</Label>
                      <Select
                        value={config.narrativeStyle}
                        onValueChange={(v) => setConfig((c) => ({ ...c, narrativeStyle: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NARRATIVE_STYLES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <span>{s.name}</span>
                                <span className="text-muted-foreground text-xs">- {s.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Target Duration</Label>
                        <span className="text-sm text-muted-foreground">{config.duration} minutes</span>
                      </div>
                      <Slider
                        value={[config.duration]}
                        onValueChange={([v]) => setConfig((c) => ({ ...c, duration: v }))}
                        min={5}
                        max={60}
                        step={5}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>5 min</span>
                        <span>60 min</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Generate Button */}
                <div className="mt-6 pt-4 border-t">
                  <Button className="w-full" size="lg" onClick={startGeneration} disabled={stage !== "configuring"}>
                    {stage === "generating" || stage === "synthesizing" || stage === "analyzing" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Tale
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete State */}
          {stage === "complete" && storyId && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold">Tale Generated Successfully!</h3>
                  <p className="text-muted-foreground">Your code tale is ready to listen</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => (window.location.href = `/story/${storyId}`)}>
                      <Play className="mr-2 h-4 w-4" />
                      Listen Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStage("idle")
                        setRepoInfo(null)
                        setRepoUrl("")
                        setStoryId(null)
                        setLogs([])
                      }}
                    >
                      Generate Another
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Logs */}
        <div className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Terminal className="h-4 w-4" />
                Pipeline Logs
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)}>
                <Eye className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              {showLogs && (
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Logs will appear here when generation starts
                      </p>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className={`text-xs p-2 rounded font-mono ${
                            log.level === "error"
                              ? "bg-red-500/10 text-red-500"
                              : log.level === "success"
                                ? "bg-green-500/10 text-green-500"
                                : log.level === "warning"
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {log.stage}
                            </Badge>
                          </div>
                          <p className="mt-1">{log.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{config.duration}m</p>
                  <p className="text-xs text-muted-foreground">Target</p>
                </div>
                <div>
                  <Bot className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">
                    {AI_MODELS.find((m) => m.id === config.model)?.name.split(" ")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">Model</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
