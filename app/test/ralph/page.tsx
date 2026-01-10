"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Play,
  Pause,
  Volume2,
  FileAudio,
  Database,
  Code,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

const STORY_VARIATIONS = [
  {
    id: "0309c9d6-a522-466b-9328-9f5950e5b706",
    title: "Ralph Wiggum: A Springfield Documentary",
    voice: "Antoni (ErXwobaYiN019PkySvjV)",
    voiceId: "ErXwobaYiN019PkySvjV",
    model: "eleven_multilingual_v2",
    quality: "mp3_44100_128",
    style: "Documentary",
    description: "An in-depth documentary exploring the unique mind of Ralph Wiggum",
    color: "bg-blue-500",
    aiModel: "anthropic/claude-sonnet-4",
  },
  {
    id: "356ecf9c-e38e-474b-831c-a70ebda9ad04",
    title: "Ralph Wiggum and the Mystery of the Missing Crayons",
    voice: "Bella (EXAVITQu4vr4xnSDxMaL)",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    model: "eleven_v3",
    quality: "mp3_44100_192",
    style: "Fiction",
    description: "An exciting adventure where Ralph embarks on an epic quest",
    color: "bg-purple-500",
    aiModel: "anthropic/claude-sonnet-4",
  },
  {
    id: "d4eefb85-94b4-4b27-bb98-c9016d0f58f3",
    title: "Learning Life Lessons with Ralph Wiggum",
    voice: "Adam (pNInz6obpgDQGcFmaJgB)",
    voiceId: "pNInz6obpgDQGcFmaJgB",
    model: "eleven_flash_v2_5",
    quality: "mp3_22050_32",
    style: "Tutorial",
    description: "Educational content where Ralph accidentally teaches important life lessons",
    color: "bg-green-500",
    aiModel: "openai/gpt-4o",
  },
  {
    id: "95e499f6-e978-4bc8-a682-022cfca3d261",
    title: "The Ralph Wiggum Podcast",
    voice: "Rachel (21m00Tcm4TlvDq8ikWAM)",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    model: "eleven_turbo_v2_5",
    quality: "mp3_44100_64",
    style: "Podcast",
    description: "A casual podcast-style exploration of Ralph's greatest moments",
    color: "bg-orange-500",
    aiModel: "anthropic/claude-sonnet-4",
  },
  {
    id: "f1815910-b958-45fd-ad54-47b187ec7d16",
    title: "The Complete Ralph Wiggum Chronicles: Premium Edition",
    voice: "Antoni (ErXwobaYiN019PkySvjV)",
    voiceId: "ErXwobaYiN019PkySvjV",
    model: "Studio API",
    quality: "ultra_lossless (pcm_44100)",
    style: "Audiobook",
    description: "Premium audiobook with professional studio production",
    color: "bg-pink-500",
    aiModel: "anthropic/claude-4-opus",
    isStudio: true,
  },
]

const PIPELINE_STAGES = [
  { id: "pending", label: "Pending", icon: Code },
  { id: "analyzing", label: "Analyzing", icon: Database },
  { id: "generating_script", label: "Script", icon: FileAudio },
  { id: "generating_audio", label: "Audio", icon: Volume2 },
  { id: "completed", label: "Complete", icon: CheckCircle },
]

interface LogEntry {
  id: string
  timestamp: string
  agent_name: string
  action: string
  level: string
  details: Record<string, unknown>
}

interface StoryData {
  id: string
  title: string
  status: string
  progress: number
  progress_message: string
  audio_url: string | null
  actual_duration_seconds: number | null
  error_message: string | null
  script_text: string | null
  generation_config: Record<string, unknown>
  model_config: Record<string, unknown>
}

export default function RalphTestPage() {
  const [stories, setStories] = useState<Record<string, StoryData>>({})
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({})
  const [selectedVariation, setSelectedVariation] = useState<string>(STORY_VARIATIONS[0].id)
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const fetchStories = useCallback(async () => {
    const supabase = await getSupabaseClient()
    const storyIds = STORY_VARIATIONS.map((v) => v.id)

    const { data, error } = await supabase.from("stories").select("*").in("id", storyIds)

    if (data && !error) {
      const storiesMap: Record<string, StoryData> = {}
      data.forEach((story: StoryData) => {
        storiesMap[story.id] = story
      })
      setStories(storiesMap)
    }
  }, [])

  const fetchLogs = useCallback(async (storyId: string) => {
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from("processing_logs")
      .select("*")
      .eq("story_id", storyId)
      .order("timestamp", { ascending: true })

    if (data && !error) {
      setLogs((prev) => ({ ...prev, [storyId]: data }))
    }
  }, [])

  useEffect(() => {
    fetchStories()

    let channel: ReturnType<Awaited<ReturnType<typeof getSupabaseClient>>["channel"]> | null = null

    const setupSubscription = async () => {
      const supabase = await getSupabaseClient()
      const storyIds = STORY_VARIATIONS.map((v) => v.id)

      channel = supabase
        .channel("ralph-stories")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "stories",
            filter: `id=in.(${storyIds.join(",")})`,
          },
          (payload) => {
            if (payload.new) {
              setStories((prev) => ({
                ...prev,
                [(payload.new as StoryData).id]: payload.new as StoryData,
              }))
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "processing_logs",
          },
          (payload) => {
            const log = payload.new as LogEntry
            if (storyIds.includes(log.story_id as unknown as string)) {
              setLogs((prev) => ({
                ...prev,
                [log.story_id as unknown as string]: [...(prev[log.story_id as unknown as string] || []), log],
              }))
            }
          },
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [fetchStories])

  // Fetch logs when selecting a variation
  useEffect(() => {
    if (selectedVariation) {
      fetchLogs(selectedVariation)
    }
  }, [selectedVariation, fetchLogs])

  const startGeneration = async (storyId: string) => {
    setIsGenerating((prev) => ({ ...prev, [storyId]: true }))

    try {
      const response = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Generation failed")
      }

      // Refresh stories after starting generation
      await fetchStories()
      await fetchLogs(storyId)
    } catch (error) {
      console.error("[v0] Generation error:", error)
    } finally {
      setIsGenerating((prev) => ({ ...prev, [storyId]: false }))
    }
  }

  const toggleAudio = (audioUrl: string, storyId: string) => {
    if (playingAudio === storyId && audioElement) {
      audioElement.pause()
      setPlayingAudio(null)
      setAudioElement(null)
    } else {
      if (audioElement) {
        audioElement.pause()
      }
      const audio = new Audio(audioUrl)
      audio.play()
      audio.onended = () => {
        setPlayingAudio(null)
        setAudioElement(null)
      }
      setAudioElement(audio)
      setPlayingAudio(storyId)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentStory = stories[selectedVariation]
  const currentLogs = logs[selectedVariation] || []
  const currentVariation = STORY_VARIATIONS.find((v) => v.id === selectedVariation)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Ralph Wiggum Story Generator</h1>
            <p className="text-muted-foreground">5 variations using different ElevenLabs API configurations</p>
          </div>
          <Button variant="outline" onClick={fetchStories}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Pipeline Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Generation Pipeline</CardTitle>
            <CardDescription>
              Real-time visualization of the generation process - Status: {currentStory?.status || "pending"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {PIPELINE_STAGES.map((stage, index) => {
                const Icon = stage.icon
                const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStory?.status)
                const isActive = currentStory?.status === stage.id
                const isCompleted = stageIndex > index
                const isFailed = currentStory?.status === "failed"

                return (
                  <div key={stage.id} className="flex flex-1 items-center">
                    {index > 0 && (
                      <div
                        className={`h-0.5 flex-1 ${isCompleted ? "bg-primary" : isFailed ? "bg-destructive" : "bg-muted"}`}
                      />
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 
                        ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground animate-pulse"
                            : isCompleted
                              ? "border-primary bg-primary text-primary-foreground"
                              : isFailed
                                ? "border-destructive bg-destructive text-destructive-foreground"
                                : "border-muted bg-background"
                        }`}
                      >
                        {isActive && !isFailed ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isFailed && stage.id === currentStory?.status ? (
                          <AlertCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span className={`text-xs ${isActive ? "font-medium text-primary" : "text-muted-foreground"}`}>
                        {stage.label}
                      </span>
                    </div>
                    {index < PIPELINE_STAGES.length - 1 && (
                      <div className={`h-0.5 flex-1 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                )
              })}
            </div>
            {currentStory && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>{currentStory.progress_message || "Waiting to start..."}</span>
                  <span>{currentStory.progress || 0}%</span>
                </div>
                <Progress value={currentStory.progress || 0} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Variations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Story Variations</CardTitle>
              <CardDescription>5 different ElevenLabs configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {STORY_VARIATIONS.map((variation) => {
                const story = stories[variation.id]
                const isSelected = selectedVariation === variation.id

                return (
                  <button
                    key={variation.id}
                    onClick={() => setSelectedVariation(variation.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors
                      ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${variation.color}`} />
                          <span className="font-medium text-sm">{variation.style}</span>
                          {variation.isStudio && (
                            <Badge variant="secondary" className="text-xs">
                              Studio
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{variation.title}</p>
                      </div>
                      {story?.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {(story?.status === "analyzing" ||
                        story?.status === "generating_script" ||
                        story?.status === "generating_audio") && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {story?.status === "failed" && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {variation.voice.split(" ")[0]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {variation.model}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Details and Logs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{currentVariation?.title}</CardTitle>
                  <CardDescription>{currentVariation?.description}</CardDescription>
                </div>
                <Button
                  onClick={() => startGeneration(selectedVariation)}
                  disabled={
                    isGenerating[selectedVariation] ||
                    currentStory?.status === "analyzing" ||
                    currentStory?.status === "generating_script" ||
                    currentStory?.status === "generating_audio"
                  }
                >
                  {isGenerating[selectedVariation] ||
                  ["analyzing", "generating_script", "generating_audio"].includes(currentStory?.status || "") ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : currentStory?.status === "completed" ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="config">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="config">Config</TabsTrigger>
                  <TabsTrigger value="logs">Logs ({currentLogs.length})</TabsTrigger>
                  <TabsTrigger value="script">Script</TabsTrigger>
                  <TabsTrigger value="audio">Audio</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4">
                  {currentVariation && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Voice ID</label>
                        <p className="text-sm text-muted-foreground font-mono">{currentVariation.voiceId}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">TTS Model</label>
                        <p className="text-sm text-muted-foreground">{currentVariation.model}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Output Quality</label>
                        <p className="text-sm text-muted-foreground">{currentVariation.quality}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">AI Model</label>
                        <p className="text-sm text-muted-foreground">{currentVariation.aiModel}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-sm font-medium">Generation Config (from DB)</label>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(currentStory?.generation_config || {}, null, 2)}
                        </pre>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-sm font-medium">Model Config (from DB)</label>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(currentStory?.model_config || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs">
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    {currentLogs.length > 0 ? (
                      <div className="space-y-2 font-mono text-xs">
                        {currentLogs.map((log) => (
                          <div key={log.id} className="flex gap-2 items-start">
                            <span className="text-muted-foreground whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge
                              variant={
                                log.level === "error" ? "destructive" : log.level === "warn" ? "secondary" : "outline"
                              }
                              className="text-xs shrink-0"
                            >
                              {log.agent_name}
                            </Badge>
                            <span className="break-all">{log.action}</span>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <span className="text-muted-foreground">{JSON.stringify(log.details)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No logs yet. Start a generation to see the pipeline in action.
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="script">
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    {currentStory?.script_text ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm">{currentStory.script_text}</pre>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Script will appear here after generation.</p>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="audio">
                  {currentStory?.status === "completed" && currentStory.audio_url ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => toggleAudio(currentStory.audio_url!, selectedVariation)}
                          >
                            {playingAudio === selectedVariation ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <p className="font-medium">Generated Audio</p>
                            <p className="text-sm text-muted-foreground">
                              Duration:{" "}
                              {currentStory.actual_duration_seconds
                                ? formatDuration(currentStory.actual_duration_seconds)
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={currentStory.audio_url}
                            download
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                          <Volume2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Audio URL: <code className="bg-muted px-1 rounded">{currentStory.audio_url}</code>
                      </div>
                    </div>
                  ) : currentStory?.status === "failed" ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <p className="text-sm text-destructive font-medium">Generation Failed</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentStory.error_message || "Unknown error occurred"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Audio will appear here after generation completes.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* ElevenLabs API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>ElevenLabs API Configurations Used</CardTitle>
            <CardDescription>Detailed breakdown of each variation's API settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {STORY_VARIATIONS.map((v) => (
                <div key={v.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${v.color}`} />
                    <span className="font-medium">{v.style}</span>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>
                      <strong>Model:</strong> {v.model}
                    </p>
                    <p>
                      <strong>Voice:</strong> {v.voice}
                    </p>
                    <p>
                      <strong>Quality:</strong> {v.quality}
                    </p>
                    <p>
                      <strong>AI:</strong> {v.aiModel}
                    </p>
                    {v.isStudio && (
                      <Badge variant="secondary" className="mt-2">
                        Uses Studio API
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Database Flow Diagram */}
        <Card>
          <CardHeader>
            <CardTitle>Database Flow</CardTitle>
            <CardDescription>How data flows through the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs">
              <pre className="whitespace-pre-wrap">
                {`1. Repository created (ralph-orchestrator)
   └── id: b2e92bad-ba85-42db-a3dc-3dfc39ee43dc
   
2. Stories created (5 variations)
   └── Documentary: 0309c9d6-a522-466b-9328-9f5950e5b706
   └── Fiction:     356ecf9c-e38e-474b-831c-a70ebda9ad04
   └── Tutorial:    d4eefb85-94b4-4b27-bb98-c9016d0f58f3
   └── Podcast:     95e499f6-e978-4bc8-a682-022cfca3d261
   └── Premium:     f1815910-b958-45fd-ad54-47b187ec7d16
   
3. Generation Flow (per story):
   └── POST /api/stories/generate { storyId }
   └── UPDATE stories SET status='analyzing'
   └── INSERT processing_logs (agent='analyzer')
   └── AI generates/enhances script
   └── UPDATE stories SET status='generating_audio'
   └── ElevenLabs API call (TTS or Studio)
   └── Upload to storage.buckets('story-audio')
   └── UPDATE stories SET audio_url=..., status='completed'
   
4. Real-time Updates:
   └── Supabase Realtime subscription on 'stories' table
   └── Supabase Realtime subscription on 'processing_logs' table
   └── UI updates automatically as database changes`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
