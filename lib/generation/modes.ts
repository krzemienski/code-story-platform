// Generation Mode Definitions and Configurations

export type GenerationMode = "hybrid" | "elevenlabs_studio"

export interface GenerationModeConfig {
  mode: GenerationMode
  scriptModel?: string
  voiceSynthesis?: string
  studioFormat?: "podcast" | "audiobook" | "documentary"
  studioDuration?: "short" | "default" | "long"
  enableSoundEffects: boolean
  enableBackgroundMusic: boolean
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
    scriptModel: "anthropic/claude-sonnet-4",
    voiceSynthesis: "elevenlabs-tts",
    enableBackgroundMusic: false,
    enableSoundEffects: false,
  },
  fiction: {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4",
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
    scriptModel: "anthropic/claude-sonnet-4",
    voiceSynthesis: "elevenlabs-tts",
    enableBackgroundMusic: false,
    enableSoundEffects: false,
  },
}

// Voice presets for different styles
export const VOICE_PRESETS = {
  podcast: {
    host: "21m00Tcm4TlvDq8ikWAM",
    guest: "AZnzlk1XvdvUeBnXmlld",
  },
  documentary: {
    narrator: "ErXwobaYiN019PkySvjV",
  },
  fiction: {
    narrator: "EXAVITQu4vr4xnSDxMaL",
  },
  tutorial: {
    narrator: "pNInz6obpgDQGcFmaJgB",
  },
  technical: {
    narrator: "yoZ06aMxZJJ28mfd3POQ",
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
