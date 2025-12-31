// Helper to write processing logs to Supabase using service role
import { createServiceClient } from "@/lib/supabase/service"

export type AgentName = "System" | "Analyzer" | "Architect" | "Narrator" | "Synthesizer"
export type LogLevel = "info" | "success" | "warning" | "error"

export async function writeLog(
  storyId: string,
  agent: AgentName,
  action: string,
  details: Record<string, any> = {},
  level: LogLevel = "info",
) {
  try {
    const supabase = createServiceClient()
    await supabase.from("processing_logs").insert({
      story_id: storyId,
      agent_name: agent,
      action,
      details,
      level,
    })
  } catch (error) {
    console.error("[v0] Failed to write log:", error)
  }
}

export const log = {
  system: (storyId: string, action: string, details?: Record<string, any>, level?: LogLevel) =>
    writeLog(storyId, "System", action, details, level),

  analyzer: (storyId: string, action: string, details?: Record<string, any>, level?: LogLevel) =>
    writeLog(storyId, "Analyzer", action, details, level),

  architect: (storyId: string, action: string, details?: Record<string, any>, level?: LogLevel) =>
    writeLog(storyId, "Architect", action, details, level),

  narrator: (storyId: string, action: string, details?: Record<string, any>, level?: LogLevel) =>
    writeLog(storyId, "Narrator", action, details, level),

  synthesizer: (storyId: string, action: string, details?: Record<string, any>, level?: LogLevel) =>
    writeLog(storyId, "Synthesizer", action, details, level),
}
