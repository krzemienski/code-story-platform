// Helper to write processing logs to Supabase
import type { SupabaseClient } from "@supabase/supabase-js"

export type AgentName = "System" | "Analyzer" | "Architect" | "Narrator" | "Synthesizer"
export type LogLevel = "info" | "success" | "warning" | "error"

export async function writeLog(
  supabase: SupabaseClient,
  storyId: string,
  agent: AgentName,
  action: string,
  details: Record<string, any> = {},
  level: LogLevel = "info",
) {
  try {
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

// Convenience functions for each agent
export const log = {
  system: (
    supabase: SupabaseClient,
    storyId: string,
    action: string,
    details?: Record<string, any>,
    level?: LogLevel,
  ) => writeLog(supabase, storyId, "System", action, details, level),

  analyzer: (
    supabase: SupabaseClient,
    storyId: string,
    action: string,
    details?: Record<string, any>,
    level?: LogLevel,
  ) => writeLog(supabase, storyId, "Analyzer", action, details, level),

  architect: (
    supabase: SupabaseClient,
    storyId: string,
    action: string,
    details?: Record<string, any>,
    level?: LogLevel,
  ) => writeLog(supabase, storyId, "Architect", action, details, level),

  narrator: (
    supabase: SupabaseClient,
    storyId: string,
    action: string,
    details?: Record<string, any>,
    level?: LogLevel,
  ) => writeLog(supabase, storyId, "Narrator", action, details, level),

  synthesizer: (
    supabase: SupabaseClient,
    storyId: string,
    action: string,
    details?: Record<string, any>,
    level?: LogLevel,
  ) => writeLog(supabase, storyId, "Synthesizer", action, details, level),
}
