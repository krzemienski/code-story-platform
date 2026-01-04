// Script validation utilities for ensuring quality and duration targets

export interface ScriptValidationResult {
  isValid: boolean
  wordCount: number
  expectedWordCount: number
  estimatedMinutes: number
  targetMinutes: number
  variance: number // Percentage deviation from target
  hasProperStructure: boolean
  issues: string[]
  suggestions: string[]
}

// Speaking rate: ~150 words per minute for natural narration
const WORDS_PER_MINUTE = 150
const ACCEPTABLE_VARIANCE = 0.25 // 25% deviation allowed

export function validateScript(script: string, targetMinutes: number): ScriptValidationResult {
  const words = script
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
  const wordCount = words.length
  const expectedWordCount = targetMinutes * WORDS_PER_MINUTE
  const estimatedMinutes = Math.round(wordCount / WORDS_PER_MINUTE)
  const variance = Math.abs(wordCount - expectedWordCount) / expectedWordCount

  const issues: string[] = []
  const suggestions: string[] = []

  // Check word count
  if (wordCount < expectedWordCount * (1 - ACCEPTABLE_VARIANCE)) {
    issues.push(`Script is too short: ${wordCount} words (expected ~${expectedWordCount})`)
    suggestions.push(`Add ${expectedWordCount - wordCount} more words to reach target duration`)
  }

  if (wordCount > expectedWordCount * (1 + ACCEPTABLE_VARIANCE)) {
    issues.push(`Script is too long: ${wordCount} words (expected ~${expectedWordCount})`)
    suggestions.push(`Remove ${wordCount - expectedWordCount} words to match target duration`)
  }

  // Check for proper structure
  const paragraphs = script.split(/\n\n+/).filter((p) => p.trim().length > 0)
  const hasPauses = script.includes("...")
  const hasMultipleParagraphs = paragraphs.length >= 3

  if (!hasPauses) {
    issues.push("Script lacks natural pauses (...)")
    suggestions.push("Add '...' for dramatic pauses and breathing room")
  }

  if (!hasMultipleParagraphs) {
    issues.push("Script lacks proper paragraph structure")
    suggestions.push("Break content into distinct sections with paragraph breaks")
  }

  // Check for markdown formatting (should not be present in audio scripts)
  const hasMarkdown = /^#{1,6}\s|^\*\*|^\*\s|^-\s|^`{3}|^\|/m.test(script)
  if (hasMarkdown) {
    issues.push("Script contains markdown formatting")
    suggestions.push("Remove markdown headers, bullets, and code blocks for audio")
  }

  // Check for natural speech patterns
  const avgSentenceLength = wordCount / (script.match(/[.!?]+/g)?.length || 1)
  if (avgSentenceLength > 30) {
    issues.push("Sentences may be too long for natural narration")
    suggestions.push("Break up long sentences for better audio flow")
  }

  const hasProperStructure = hasPauses && hasMultipleParagraphs && !hasMarkdown

  return {
    isValid: issues.length === 0,
    wordCount,
    expectedWordCount,
    estimatedMinutes,
    targetMinutes,
    variance,
    hasProperStructure,
    issues,
    suggestions,
  }
}

// Calculate expected duration from word count
export function estimateDuration(wordCount: number): {
  minutes: number
  seconds: number
  formatted: string
} {
  const totalSeconds = Math.round((wordCount / WORDS_PER_MINUTE) * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return {
    minutes,
    seconds,
    formatted: `${minutes}:${seconds.toString().padStart(2, "0")}`,
  }
}

// Calculate required word count for target duration
export function calculateRequiredWords(targetMinutes: number): {
  minimum: number
  target: number
  maximum: number
} {
  const target = targetMinutes * WORDS_PER_MINUTE
  return {
    minimum: Math.round(target * (1 - ACCEPTABLE_VARIANCE)),
    target,
    maximum: Math.round(target * (1 + ACCEPTABLE_VARIANCE)),
  }
}

// Duration presets for UI
export const DURATION_PRESETS = [
  { label: "Quick (5 min)", minutes: 5, words: 750 },
  { label: "Standard (15 min)", minutes: 15, words: 2250 },
  { label: "Extended (30 min)", minutes: 30, words: 4500 },
  { label: "Deep Dive (60 min)", minutes: 60, words: 9000 },
] as const
