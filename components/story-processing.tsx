"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { createClient } from "@/lib/supabase/client"
import { ProcessingLogs } from "@/components/processing-logs"
import { RefreshCw } from "lucide-react"

interface StoryProcessingProps {
  storyId: string
  initialStatus: string
  initialProgress: number
  initialMessage: string | null
  isDemo?: boolean
}

export function StoryProcessing({
  storyId,
  initialStatus,
  initialProgress,
  initialMessage,
  isDemo,
}: StoryProcessingProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [progress, setProgress] = useState(initialProgress)
  const [message, setMessage] = useState(initialMessage || "Processing...")
  const [isRestarting, setIsRestarting] = useState(false)
  const [hasTriggeredGeneration, setHasTriggeredGeneration] = useState(false)

  useEffect(() => {
    if (!isDemo && initialStatus === "pending" && !hasTriggeredGeneration) {
      setHasTriggeredGeneration(true)
      // Trigger generation
      fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      }).catch((err) => console.error("[v0] Failed to trigger generation:", err))
    }
  }, [storyId, initialStatus, isDemo, hasTriggeredGeneration])

  useEffect(() => {
    if (isDemo) {
      const demoSteps = [
        { progress: 15, message: "Connecting to GitHub...", status: "analyzing" },
        { progress: 25, message: "Scanning repository structure...", status: "analyzing" },
        { progress: 40, message: "Analyzing code patterns...", status: "analyzing" },
        { progress: 55, message: "Building architecture map...", status: "generating" },
        { progress: 70, message: "Writing narrative script...", status: "generating" },
        { progress: 85, message: "Synthesizing audio...", status: "synthesizing" },
        { progress: 95, message: "Finalizing story...", status: "synthesizing" },
      ]

      let stepIndex = 0
      const interval = setInterval(() => {
        if (stepIndex < demoSteps.length) {
          setProgress(demoSteps[stepIndex].progress)
          setMessage(demoSteps[stepIndex].message)
          setStatus(demoSteps[stepIndex].status)
          stepIndex++
        } else {
          clearInterval(interval)
        }
      }, 2500)

      return () => clearInterval(interval)
    }

    // Real mode: poll Supabase
    const supabase = createClient()

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("stories")
        .select("status, progress, progress_message")
        .eq("id", storyId)
        .single()

      if (data) {
        setStatus(data.status)
        setProgress(data.progress || 0)
        setMessage(data.progress_message || "Processing...")

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval)
          router.refresh()
        }
      }
    }, 2000)

    // Also subscribe to realtime updates
    const channel = supabase
      .channel(`story-${storyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stories",
          filter: `id=eq.${storyId}`,
        },
        (payload) => {
          const newData = payload.new as { status: string; progress: number; progress_message: string }
          setStatus(newData.status)
          setProgress(newData.progress || 0)
          setMessage(newData.progress_message || "Processing...")

          if (newData.status === "completed" || newData.status === "failed") {
            clearInterval(interval)
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [storyId, router, isDemo])

  const handleRestart = async () => {
    if (isDemo) {
      // Reset demo state
      setProgress(0)
      setStatus("pending")
      setMessage("Restarting...")
      router.refresh()
      return
    }

    setIsRestarting(true)
    try {
      const res = await fetch(`/api/stories/${storyId}/restart`, { method: "POST" })
      if (res.ok) {
        setProgress(0)
        setStatus("pending")
        setMessage("Restarting generation...")
        router.refresh()
      }
    } catch (err) {
      console.error("[v0] Failed to restart:", err)
    } finally {
      setIsRestarting(false)
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case "analyzing":
        return "Analyzing Repository"
      case "generating":
        return "Generating Script"
      case "synthesizing":
        return "Creating Audio"
      case "pending":
      default:
        return "Queued for Processing"
    }
  }

  const getOrbState = () => {
    switch (status) {
      case "analyzing":
        return "thinking"
      case "generating":
        return "talking"
      case "synthesizing":
        return "talking"
      default:
        return null
    }
  }

  const getActiveAgents = () => {
    switch (status) {
      case "analyzing":
        return ["Analyzer"]
      case "generating":
        return ["Architect", "Narrator"]
      case "synthesizing":
        return ["Synthesizer"]
      default:
        return []
    }
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Main progress card */}
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-6 h-24 w-24">
            <Orb colors={["#4ade80", "#22c55e"]} agentState={getOrbState()} className="h-full w-full" />
          </div>

          <ShimmeringText
            text={getStatusTitle()}
            className="text-xl font-semibold text-foreground"
            duration={2}
            repeat
          />

          <p className="mt-4 text-muted-foreground">{message}</p>

          <div className="mt-4 flex items-center gap-2">
            {getActiveAgents().map((agent) => (
              <span
                key={agent}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {agent} Agent
              </span>
            ))}
          </div>

          <div className="mt-6 w-full max-w-md">
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">{progress}% complete</p>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {isDemo ? "Demo mode - simulating progress" : "Processing in real-time"}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              disabled={isRestarting}
              className="bg-transparent"
            >
              {isRestarting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Restart
            </Button>
          </div>
        </div>
      </div>

      <ProcessingLogs storyId={storyId} isDemo={isDemo} />
    </div>
  )
}
