"use client"

import { useEffect, useState, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Bot,
  Search,
  FileCode,
  Cpu,
  Mic,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProcessingLog {
  id: string
  story_id: string
  timestamp: string
  agent_name: string
  action: string
  details: Record<string, any>
  level: "info" | "success" | "warning" | "error"
}

interface ProcessingLogsProps {
  storyId: string
  isDemo?: boolean
}

const AGENT_CONFIG: Record<string, { icon: typeof Bot; color: string; bgColor: string }> = {
  Analyzer: { icon: Search, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  Architect: { icon: FileCode, color: "text-purple-400", bgColor: "bg-purple-400/10" },
  Narrator: { icon: Bot, color: "text-green-400", bgColor: "bg-green-400/10" },
  Synthesizer: { icon: Mic, color: "text-orange-400", bgColor: "bg-orange-400/10" },
  System: { icon: Cpu, color: "text-gray-400", bgColor: "bg-gray-400/10" },
}

const LEVEL_CONFIG = {
  info: { icon: Info, color: "text-muted-foreground" },
  success: { icon: CheckCircle2, color: "text-green-400" },
  warning: { icon: AlertCircle, color: "text-yellow-400" },
  error: { icon: AlertCircle, color: "text-red-400" },
}

// Demo logs for testing
const DEMO_LOGS: Omit<ProcessingLog, "id" | "story_id">[] = [
  {
    timestamp: new Date(Date.now() - 45000).toISOString(),
    agent_name: "System",
    action: "Story generation initiated",
    details: { storyId: "demo-1" },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 42000).toISOString(),
    agent_name: "Analyzer",
    action: "Connecting to GitHub API",
    details: { repo: "vercel/next.js" },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 40000).toISOString(),
    agent_name: "Analyzer",
    action: "Fetching repository metadata",
    details: { stars: 120000, forks: 25000 },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 37000).toISOString(),
    agent_name: "Analyzer",
    action: "Scanning directory structure",
    details: { totalFiles: 2847 },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 34000).toISOString(),
    agent_name: "Analyzer",
    action: "Identified key directories",
    details: { directories: ["packages/next", "packages/next/src/server", "packages/next/src/client"] },
    level: "success",
  },
  {
    timestamp: new Date(Date.now() - 31000).toISOString(),
    agent_name: "Analyzer",
    action: "Analyzing package.json dependencies",
    details: { dependencies: 47, devDependencies: 123 },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 28000).toISOString(),
    agent_name: "Analyzer",
    action: "Reading README.md",
    details: { length: 4500 },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 25000).toISOString(),
    agent_name: "Analyzer",
    action: "Analysis complete",
    details: { filesAnalyzed: 156, timeMs: 17000 },
    level: "success",
  },
  {
    timestamp: new Date(Date.now() - 23000).toISOString(),
    agent_name: "Architect",
    action: "Building dependency graph",
    details: {},
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 20000).toISOString(),
    agent_name: "Architect",
    action: "Identifying core modules",
    details: { modules: ["Server Components", "Client Components", "Router", "Build System"] },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 17000).toISOString(),
    agent_name: "Architect",
    action: "Mapping data flow patterns",
    details: { patterns: ["RSC Payload", "Flight Protocol", "Streaming"] },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 14000).toISOString(),
    agent_name: "Architect",
    action: "Architecture map complete",
    details: { components: 23, relationships: 45 },
    level: "success",
  },
  {
    timestamp: new Date(Date.now() - 12000).toISOString(),
    agent_name: "Narrator",
    action: "Generating narrative outline",
    details: { style: "documentary", chapters: 5 },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 9000).toISOString(),
    agent_name: "Narrator",
    action: "Writing Chapter 1: Introduction",
    details: { words: 450 },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 6000).toISOString(),
    agent_name: "Narrator",
    action: "Writing Chapter 2: Architecture Overview",
    details: { words: 680 },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 4000).toISOString(),
    agent_name: "Narrator",
    action: "Script generation complete",
    details: { totalWords: 2250, estimatedMinutes: 15 },
    level: "success",
  },
  {
    timestamp: new Date(Date.now() - 2000).toISOString(),
    agent_name: "Synthesizer",
    action: "Initializing ElevenLabs voice synthesis",
    details: { voice: "Rachel", model: "eleven_multilingual_v2" },
    level: "info",
  },
  {
    timestamp: new Date(Date.now() - 500).toISOString(),
    agent_name: "Synthesizer",
    action: "Generating audio stream",
    details: { progress: "45%" },
    level: "info",
  },
]

export function ProcessingLogs({ storyId, isDemo }: ProcessingLogsProps) {
  const [logs, setLogs] = useState<ProcessingLog[]>([])
  const [expanded, setExpanded] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDemo) {
      // Simulate streaming logs for demo
      let index = 0
      const interval = setInterval(() => {
        if (index < DEMO_LOGS.length) {
          setLogs((prev) => [
            ...prev,
            {
              ...DEMO_LOGS[index],
              id: `demo-${index}`,
              story_id: storyId,
              timestamp: new Date().toISOString(),
            },
          ])
          index++
        } else {
          clearInterval(interval)
        }
      }, 1500)
      return () => clearInterval(interval)
    }

    // Real mode: subscribe to processing logs
    let mounted = true
    let channel: ReturnType<Awaited<ReturnType<typeof getSupabaseClient>>["channel"]> | null = null

    const initSubscription = async () => {
      const supabase = await getSupabaseClient()

      // Fetch existing logs
      const { data } = await supabase
        .from("processing_logs")
        .select("*")
        .eq("story_id", storyId)
        .order("timestamp", { ascending: true })

      if (data && mounted) {
        setLogs(data as ProcessingLog[])
      }

      // Subscribe to new logs
      channel = supabase
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
            if (mounted) {
              setLogs((prev) => [...prev, payload.new as ProcessingLog])
            }
          },
        )
        .subscribe()
    }

    initSubscription()

    return () => {
      mounted = false
      if (channel) {
        getSupabaseClient().then((supabase) => supabase.removeChannel(channel!))
      }
    }
  }, [storyId, isDemo])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, autoScroll])

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScroll(isAtBottom)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const renderDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) return null

    return (
      <div className="mt-1 flex flex-wrap gap-2">
        {Object.entries(details).map(([key, value]) => (
          <span
            key={key}
            className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
          >
            <span className="font-medium text-foreground/70">{key}:</span>
            <span className="ml-1">
              {Array.isArray(value)
                ? value.slice(0, 3).join(", ") + (value.length > 3 ? "..." : "")
                : typeof value === "object"
                  ? JSON.stringify(value).slice(0, 50)
                  : String(value)}
            </span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="font-medium text-foreground">Processing Logs</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{logs.length} events</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Logs */}
      {expanded && (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto border-t border-border bg-background/50 font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Waiting for processing to start...
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {logs.map((log) => {
                const agentConfig = AGENT_CONFIG[log.agent_name] || AGENT_CONFIG.System
                const levelConfig = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info
                const AgentIcon = agentConfig.icon
                const LevelIcon = levelConfig.icon

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "px-4 py-3 transition-colors hover:bg-secondary/30",
                      log.level === "error" && "bg-red-500/5",
                      log.level === "success" && "bg-green-500/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Agent icon */}
                      <div className={cn("rounded-md p-1.5", agentConfig.bgColor)}>
                        <AgentIcon className={cn("h-4 w-4", agentConfig.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("font-semibold", agentConfig.color)}>{log.agent_name}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-foreground">{log.action}</span>
                          <LevelIcon className={cn("h-3.5 w-3.5 ml-auto flex-shrink-0", levelConfig.color)} />
                        </div>

                        {/* Details */}
                        {renderDetails(log.details)}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={logsEndRef} />
            </div>
          )}

          {/* Auto-scroll indicator */}
          {!autoScroll && logs.length > 0 && (
            <div className="sticky bottom-0 flex justify-center p-2 bg-gradient-to-t from-background to-transparent">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAutoScroll(true)
                  logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                <ChevronDown className="mr-1 h-3 w-3" />
                Jump to latest
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
