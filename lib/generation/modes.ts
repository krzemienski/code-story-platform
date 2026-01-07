// Generation Mode Definitions and Configurations

export type GenerationMode = "hybrid" | "elevenlabs_studio"

export interface GenerationModeConfig {
  mode: GenerationMode
  // Hybrid mode options
  scriptModel?: string
  voiceSynthesis?: string
  // Studio mode options
  studioFormat?: "podcast" | "audiobook" | "documentary"
  studioDuration?: "short" | "default" | "long"
  // Common options
  enableSoundEffects: boolean
  enableBackgroundMusic: boolean
}

// Studio duration to approximate minutes mapping
export const STUDIO_DURATION_MINUTES: Record<string, number> = {
  short: 5,
  default: 15,
  long: 30,
}

// Default configurations per narrative style
export const DEFAULT_CONFIGS: Record<string, Partial<GenerationModeConfig>> = {
  podcast: {
    mode: "elevenlabs_studio",
    studioFormat: "podcast",
    studioDuration: "default",
    enableBackgroundMusic: true,
    enableSoundEffects: false,
  },
  documentary: {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4-20250514",
    voiceSynthesis: "elevenlabs-tts",
    enableBackgroundMusic: false,
    enableSoundEffects: false,
  },
  fiction: {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4-20250514",
    voiceSynthesis: "elevenlabs-tts",
    enableBackgroundMusic: false,
    enableSoundEffects: false,
  },
  tutorial: {
    mode: "hybrid",
    scriptModel: "openai/gpt-4o",
    voiceSynthesis: "elevenlabs-tts",
    enableBackgroundMusic: false,
    enableSoundEffects: false,
  },
  technical: {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4-20250514",
    voiceSynthesis: "elevenlabs-tts",
    enableBackgroundMusic: false,
    enableSoundEffects: false,
  },
}

// Voice presets for different styles
export const VOICE_PRESETS = {
  podcast: {
    host: "21m00Tcm4TlvDq8ikWAM", // Rachel
    guest: "AZnzlk1XvdvUeBnXmlld", // Domi
  },
  documentary: {
    narrator: "ErXwobaYiN019PkySvjV", // Antoni
  },
  fiction: {
    narrator: "EXAVITQu4vr4xnSDxMaL", // Bella
  },
  tutorial: {
    narrator: "pNInz6obpgDQGcFmaJgB", // Adam
  },
  technical: {
    narrator: "yoZ06aMxZJJ28mfd3POQ", // Josh
  },
}

// Get recommended mode based on narrative style
export function getRecommendedMode(narrativeStyle: string): GenerationMode {
  if (narrativeStyle === "podcast") {
    return "elevenlabs_studio"
  }
  return "hybrid"
}

// Build full config from partial user input
export function buildGenerationConfig(
  narrativeStyle: string,
  userOverrides?: Partial<GenerationModeConfig>,
): GenerationModeConfig {
  const baseConfig = DEFAULT_CONFIGS[narrativeStyle] || DEFAULT_CONFIGS.documentary

  return {
    mode: userOverrides?.mode || baseConfig.mode || "hybrid",
    scriptModel: userOverrides?.scriptModel || baseConfig.scriptModel,
    voiceSynthesis: userOverrides?.voiceSynthesis || baseConfig.voiceSynthesis,
    studioFormat: userOverrides?.studioFormat || baseConfig.studioFormat,
    studioDuration: userOverrides?.studioDuration || baseConfig.studioDuration,
    enableSoundEffects: userOverrides?.enableSoundEffects ?? baseConfig.enableSoundEffects ?? false,
    enableBackgroundMusic: userOverrides?.enableBackgroundMusic ?? baseConfig.enableBackgroundMusic ?? false,
  }
}

// Get voice ID for a given style
export function getVoiceForStyle(narrativeStyle: string, role: "host" | "guest" | "narrator" = "narrator"): string {
  const preset = VOICE_PRESETS[narrativeStyle as keyof typeof VOICE_PRESETS]
  if (!preset) {
    return VOICE_PRESETS.documentary.narrator
  }

  if ("host" in preset && role === "host") {
    return preset.host
  }
  if ("guest" in preset && role === "guest") {
    return preset.guest
  }
  if ("narrator" in preset) {
    return preset.narrator
  }

  return VOICE_PRESETS.documentary.narrator
}

// Validate script word count against target duration
export function validateScriptLength(
  wordCount: number,
  targetDurationMinutes: number,
): { isValid: boolean; message: string; wordsNeeded: number } {
  const wordsPerMinute = 150 // Average speaking rate
  const targetWords = targetDurationMinutes * wordsPerMinute
  const tolerance = 0.15 // 15% tolerance

  const minWords = Math.floor(targetWords * (1 - tolerance))
  const maxWords = Math.ceil(targetWords * (1 + tolerance))

  if (wordCount < minWords) {
    return {
      isValid: false,
      message: `Script is too short. Need ${minWords - wordCount} more words for ${targetDurationMinutes} minute target.`,
      wordsNeeded: minWords - wordCount,
    }
  }

  if (wordCount > maxWords) {
    return {
      isValid: true, // Still valid, just longer
      message: `Script is ${wordCount - maxWords} words over target, but will still work.`,
      wordsNeeded: 0,
    }
  }

  return {
    isValid: true,
    message: `Script length is optimal for ${targetDurationMinutes} minute duration.`,
    wordsNeeded: 0,
  }
}
