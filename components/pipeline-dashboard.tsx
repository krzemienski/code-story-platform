"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  RefreshCw,
  Terminal,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Settings2,
  Layers,
  ArrowRight,
  Download,
  Volume2,
  Bot,
  Code,
  Mic,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

// Types
interface PipelineLog {
  id: string
  story_id: string
  agent_name: string
  action: string
  level: "info" | "success" | "warning" | "error"
  details: Record<string, unknown>
  timestamp: string
}

interface Story {
  id: string
  title: string
  status: string
  progress: number
  progress_message: string
  error_message?: string
  generation_mode: string
  narrative_style: string
  target_duration_minutes: number
  actual_duration_seconds?: number
  script_text?: string
  audio_url?: string
  model_config?: Record<string, unknown>
  generation_config?: Record<string, unknown>
  created_at: string
  processing_started_at?: string
  processing_completed_at?: string
}

interface PipelineDashboardProps {
  storyId: string
  onComplete?: (story: Story) => void
  onError?: (error: string) => void
}

// Pipeline stages
const PIPELINE_STAGES = [
  { id: "pending", name: "Pending", icon: Clock, color: "text-muted-foreground" },
  { id: "analyzing", name: "Analyzing", icon: Code, color: "text-blue-500" },
  { id: "generating", name: "Generating", icon: Bot, color: "text-purple-500" },
  { id: "synthesizing", name: "Synthesizing", icon: Mic, color: "text-orange-500" },
  { id: "completed", name: "Complete", icon: CheckCircle2, color: "text-green-500" },
  { id: "failed", name: "Failed", icon: AlertCircle, color: "text-red-500" },
]

// Agent types for filtering
const AGENT_TYPES = [
  { id: "all", name: "All Agents", color: "bg-white/10" },
  { id: "System", name: "System", color: "bg-slate-500/20" },
  { id: "Analyzer", name: "Analyzer", color: "bg-blue-500/20" },
  { id: "Narrator", name: "Writer", color: "bg-purple-500/20" },
  { id: "Synthesizer", name: "Synthesizer", color: "bg-orange-500/20" },
]

// Log level colors
const LOG_LEVEL_STYLES = {
  info: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
}

export function PipelineDashboard({ storyId, onComplete, onError }: PipelineDashboardProps) {
  // State
  const [story, setStory] = useState<Story | null>(null)
  const [logs, setLogs] = useState<PipelineLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Tail screen controls
  const [showLogs, setShowLogs] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const [agentFilter, setAgentFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [showDetails, setShowDetails] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState("logs")
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({})

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      const { getSupabaseClient } = await import("@/lib/supabase/client")
      supabaseRef.current = await getSupabaseClient()
    }
    initSupabase()
  }, [])

  // Fetch story and logs
  const fetchData = useCallback(async () => {
    if (!supabaseRef.current) return

    try {
      // Fetch story
      const { data: storyData, error: storyError } = await supabaseRef.current
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .single()

      if (storyError) throw storyError
      setStory(storyData)

      // Fetch logs
      const { data: logsData, error: logsError } = await supabaseRef.current
        .from("processing_logs")
        .select("*")
        .eq("story_id", storyId)
        .order("timestamp", { ascending: true })

      if (logsError) throw logsError
      setLogs(logsData || [])

      // Check completion
      if (storyData?.status === "completed" && onComplete) {
        onComplete(storyData)
      } else if (storyData?.status === "failed" && onError) {
        onError(storyData.error_message || "Generation failed")
      }
    } catch (error) {
      console.error("[v0] Error fetching pipeline data:", error)
    } finally {
      setLoading(false)
    }
  }, [storyId, onComplete, onError])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!supabaseRef.current) return

    // Initial fetch
    fetchData()

    // Subscribe to story changes
    const storyChannel = supabaseRef.current
      .channel(`story-${storyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
          filter: `id=eq.${storyId}`,
        },
        (payload) => {
          console.log("[v0] Story update:", payload)
          if (payload.new) {
            setStory(payload.new as Story)
            if ((payload.new as Story).status === "completed" && onComplete) {
              onComplete(payload.new as Story)
            }
          }
        },
      )
      .subscribe()

    // Subscribe to new logs
    const logsChannel = supabaseRef.current
      .channel(`logs-${storyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "processing_logs",
          filter: `story_id=eq.${storyId}`,
        },
        (payload) => {
          console.log("[v0] New log:", payload)
          if (payload.new) {
            setLogs((prev) => [...prev, payload.new as PipelineLog])
          }
        },
      )
      .subscribe()

    // Polling fallback for progress updates
    const pollInterval = setInterval(() => {
      if (story?.status && !["completed", "failed"].includes(story.status)) {
        fetchData()
      }
    }, 2000)

    return () => {
      storyChannel.unsubscribe()
      logsChannel.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [storyId, fetchData, onComplete, story?.status])

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, autoScroll])

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (agentFilter !== "all" && log.agent_name !== agentFilter) return false
    if (levelFilter !== "all" && log.level !== levelFilter) return false
    return true
  })

  // Group logs by agent for stage view
  const logsByAgent = logs.reduce(
    (acc, log) => {
      if (!acc[log.agent_name]) acc[log.agent_name] = []
      acc[log.agent_name].push(log)
      return acc
    },
    {} as Record<string, PipelineLog[]>,
  )

  // Start generation
  const startGeneration = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          generationMode: story?.generation_mode || "hybrid",
          modeConfig: story?.generation_config,
          modelConfig: story?.model_config,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Generation failed")
      }
    } catch (error) {
      console.error("[v0] Generation error:", error)
      if (onError) onError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsGenerating(false)
    }
  }

  // Get current stage index
  const getCurrentStageIndex = () => {
    const statusIndex = PIPELINE_STAGES.findIndex((s) => s.id === story?.status)
    return statusIndex >= 0 ? statusIndex : 0
  }

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!story?.processing_started_at) return null
    const start = new Date(story.processing_started_at).getTime()
    const end = story.processing_completed_at ? new Date(story.processing_completed_at).getTime() : Date.now()
    const seconds = Math.floor((end - start) / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Status Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{story?.title || "Pipeline Dashboard"}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {story?.generation_mode === "elevenlabs_studio" ? "Studio API" : "Hybrid"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {story?.narrative_style}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {story?.target_duration_minutes}m target
                </Badge>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getElapsedTime() && (
                <Badge variant="secondary" className="font-mono">
                  <Clock className="h-3 w-3 mr-1" />
                  {getElapsedTime()}
                </Badge>
              )}
              {story?.status === "pending" && (
                <Button onClick={startGeneration} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Generation
                </Button>
              )}
              {story?.status === "failed" && (
                <Button onClick={startGeneration} variant="destructive" disabled={isGenerating}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{story?.progress_message || "Waiting to start..."}</span>
              <span className="font-medium">{story?.progress || 0}%</span>
            </div>
            <Progress value={story?.progress || 0} className="h-2" />
          </div>

          {/* Pipeline Stages */}
          <div className="flex items-center justify-between">
            {PIPELINE_STAGES.slice(0, -1).map((stage, index) => {
              const currentIndex = getCurrentStageIndex()
              const isActive = stage.id === story?.status
              const isComplete = index < currentIndex
              const isFailed = story?.status === "failed" && index === currentIndex
              const Icon = stage.icon

              return (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive && !isFailed && "border-primary bg-primary/10",
                        isComplete && "border-green-500 bg-green-500/10",
                        isFailed && "border-red-500 bg-red-500/10",
                        !isActive && !isComplete && !isFailed && "border-muted bg-muted/50",
                      )}
                      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: isActive ? Number.POSITIVE_INFINITY : 0, duration: 2 }}
                    >
                      {isActive && !isFailed ? (
                        <Loader2 className={cn("h-5 w-5 animate-spin", stage.color)} />
                      ) : (
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isComplete ? "text-green-500" : isFailed ? "text-red-500" : stage.color,
                          )}
                        />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "text-xs mt-2 font-medium",
                        isActive && "text-primary",
                        isComplete && "text-green-500",
                        isFailed && "text-red-500",
                        !isActive && !isComplete && !isFailed && "text-muted-foreground",
                      )}
                    >
                      {stage.name}
                    </span>
                  </div>
                  {index < PIPELINE_STAGES.length - 2 && (
                    <div className={cn("w-12 h-0.5 mx-2", isComplete ? "bg-green-500" : "bg-muted")} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Split View */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration & Script */}
        <div className="lg:col-span-1 space-y-4">
          {/* Configuration Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-mono text-xs">
                  {(story?.model_config as Record<string, string>)?.modelId || "auto"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voice</span>
                <span className="font-mono text-xs">
                  {(story?.generation_config as Record<string, string>)?.voiceId || "default"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{story?.target_duration_minutes}m</span>
              </div>
              {story?.actual_duration_seconds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual</span>
                  <span>{Math.round(story.actual_duration_seconds / 60)}m</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Script Preview */}
          {story?.script_text && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generated Script
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                    {story.script_text.slice(0, 2000)}
                    {story.script_text.length > 2000 && "..."}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Audio Player */}
          {story?.audio_url && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-400">
                  <Volume2 className="h-4 w-4" />
                  Audio Ready
                </CardTitle>
              </CardHeader>
              <CardContent>
                <audio controls className="w-full" src={story.audio_url}>
                  Your browser does not support audio playback.
                </audio>
                <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent" asChild>
                  <a href={story.audio_url} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download Audio
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Tail Screen (Logs) */}
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader className="flex-shrink-0 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Pipeline Logs
                <Badge variant="secondary" className="text-xs">
                  {filteredLogs.length} / {logs.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={autoScroll ? "text-primary" : ""}
                >
                  {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)}>
                  {showLogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Filter by agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", agent.color)} />
                          {agent.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue placeholder="Log level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                <Label htmlFor="show-details" className="text-xs text-muted-foreground">
                  Show details
                </Label>
                <Switch id="show-details" checked={showDetails} onCheckedChange={setShowDetails} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-4 mb-2 grid w-auto grid-cols-2">
                <TabsTrigger value="logs" className="text-xs">
                  <Terminal className="h-3 w-3 mr-1" />
                  Live Logs
                </TabsTrigger>
                <TabsTrigger value="stages" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  By Stage
                </TabsTrigger>
              </TabsList>

              {/* Live Logs Tab */}
              <TabsContent value="logs" className="flex-1 m-0 overflow-hidden">
                {showLogs && (
                  <ScrollArea className="h-full px-4 pb-4">
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {filteredLogs.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Logs will appear here when generation starts</p>
                          </div>
                        ) : (
                          filteredLogs.map((log, index) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={cn("p-3 rounded-lg border text-xs font-mono", LOG_LEVEL_STYLES[log.level])}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-1.5",
                                      AGENT_TYPES.find((a) => a.id === log.agent_name)?.color,
                                    )}
                                  >
                                    {log.agent_name}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] px-1.5">
                                    {log.level}
                                  </Badge>
                                </div>
                                <span className="text-muted-foreground text-[10px]">#{index + 1}</span>
                              </div>
                              <p className="text-sm">{log.action}</p>
                              {showDetails && log.details && Object.keys(log.details).length > 0 && (
                                <pre className="mt-2 p-2 rounded bg-black/20 text-[10px] overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                      <div ref={logsEndRef} />
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              {/* Stages Tab */}
              <TabsContent value="stages" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-3">
                    {Object.entries(logsByAgent).map(([agent, agentLogs]) => (
                      <Collapsible
                        key={agent}
                        open={expandedStages[agent] !== false}
                        onOpenChange={(open) => setExpandedStages((prev) => ({ ...prev, [agent]: open }))}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn("w-3 h-3 rounded-full", AGENT_TYPES.find((a) => a.id === agent)?.color)}
                              />
                              <span className="font-medium">{agent}</span>
                              <Badge variant="secondary" className="text-xs">
                                {agentLogs.length} logs
                              </Badge>
                            </div>
                            {expandedStages[agent] !== false ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-5 border-l-2 border-muted ml-1.5 space-y-2 py-2">
                            {agentLogs.map((log) => (
                              <div
                                key={log.id}
                                className={cn(
                                  "p-2 rounded text-xs font-mono border-l-2",
                                  log.level === "error" && "border-l-red-500 bg-red-500/5",
                                  log.level === "success" && "border-l-green-500 bg-green-500/5",
                                  log.level === "warning" && "border-l-yellow-500 bg-yellow-500/5",
                                  log.level === "info" && "border-l-slate-500 bg-slate-500/5",
                                )}
                              >
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  <ArrowRight className="h-3 w-3" />
                                </div>
                                <p>{log.action}</p>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                    {Object.keys(logsByAgent).length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No stage data yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Stats Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  <span className="text-green-400">{logs.filter((l) => l.level === "success").length}</span> success
                </span>
                <span>
                  <span className="text-yellow-400">{logs.filter((l) => l.level === "warning").length}</span> warnings
                </span>
                <span>
                  <span className="text-red-400">{logs.filter((l) => l.level === "error").length}</span> errors
                </span>
              </div>
              <span>
                Last update: {logs.length > 0 ? new Date(logs[logs.length - 1].timestamp).toLocaleTimeString() : "N/A"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Error Display */}
      {story?.status === "failed" && story.error_message && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              Generation Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap">{story.error_message}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
