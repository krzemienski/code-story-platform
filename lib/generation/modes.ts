// Generation Mode Definitions and Configurations

export type GenerationMode = "hybrid" | "elevenlabs_studio"

export interface HybridModeConfig {
  mode: "hybrid"
  scriptModel: string // e.g., "anthropic/claude-sonnet-4"
  voiceModel: "eleven_multilingual_v2" | "eleven_flash_v2_5" | "eleven_turbo_v2_5"
  narrativeStyle: "fiction" | "documentary" | "tutorial" | "technical" | "podcast"
  temperature?: number
  voiceSettings: {
    voiceId: string
    stability: number
    similarityBoost: number
    style: number
    useSpeakerBoost: boolean
  }
}

export interface StudioModeConfig {
  mode: "elevenlabs_studio"
  format: "podcast" | "audiobook" | "documentary" | "narration"
  duration: "short" | "default" | "long" // ~5min, ~15min, ~30min
  hosts: {
    main: string // Voice ID for main narrator/host
    guest?: string // Voice ID for secondary voice (podcasts)
  }
  includeMusic: boolean
  includeSFX: boolean
  focusAreas?: string[] // Up to 3 focus areas for GenFM
  language?: string // ISO 639-1 code
}

export type GenerationConfig = HybridModeConfig | StudioModeConfig

// Default configurations per narrative style
export const DEFAULT_CONFIGS: Record<string, Partial<GenerationConfig>> = {
  podcast: {
    mode: "elevenlabs_studio",
    format: "podcast",
    duration: "default",
    includeMusic: true,
    includeSFX: false,
  } as Partial<StudioModeConfig>,

  documentary: {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4",
    voiceModel: "eleven_multilingual_v2",
    narrativeStyle: "documentary",
    temperature: 0.7,
  } as Partial<HybridModeConfig>,

  fiction: {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4",
    voiceModel: "eleven_multilingual_v2",
    narrativeStyle: "fiction",
    temperature: 0.85,
  } as Partial<HybridModeConfig>,

  tutorial: {
    mode: "hybrid",
    scriptModel: "openai/gpt-4o",
    voiceModel: "eleven_flash_v2_5",
    narrativeStyle: "tutorial",
    temperature: 0.5,
  } as Partial<HybridModeConfig>,

  technical: {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4",
    voiceModel: "eleven_flash_v2_5",
    narrativeStyle: "technical",
    temperature: 0.4,
  } as Partial<HybridModeConfig>,
}

// Voice presets for different styles
export const VOICE_PRESETS = {
  // Conversational podcast voices
  podcast: {
    host: "21m00Tcm4TlvDq8ikWAM", // Rachel - warm, engaging
    guest: "AZnzlk1XvdvUeBnXmlld", // Domi - professional, clear
  },
  // Documentary narration
  documentary: {
    narrator: "ErXwobaYiN019PkySvjV", // Antoni - authoritative
  },
  // Fiction storytelling
  fiction: {
    narrator: "EXAVITQu4vr4xnSDxMaL", // Bella - expressive, dramatic
  },
  // Tutorial/educational
  tutorial: {
    narrator: "pNInz6obpgDQGcFmaJgB", // Adam - clear, instructional
  },
  // Technical deep-dive
  technical: {
    narrator: "yoZ06aMxZJJ28mfd3POQ", // Sam - precise, professional
  },
}

// Validation helpers
export function isHybridConfig(config: GenerationConfig): config is HybridModeConfig {
  return config.mode === "hybrid"
}

export function isStudioConfig(config: GenerationConfig): config is StudioModeConfig {
  return config.mode === "elevenlabs_studio"
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
  userOverrides?: Partial<GenerationConfig>,
): GenerationConfig {
  const baseConfig = DEFAULT_CONFIGS[narrativeStyle] || DEFAULT_CONFIGS.documentary
  const mode = userOverrides?.mode || baseConfig.mode || "hybrid"

  if (mode === "elevenlabs_studio") {
    const studioConfig: StudioModeConfig = {
      mode: "elevenlabs_studio",
      format: "podcast",
      duration: "default",
      hosts: {
        main: VOICE_PRESETS.podcast.host,
        guest: VOICE_PRESETS.podcast.guest,
      },
      includeMusic: true,
      includeSFX: false,
      ...baseConfig,
      ...userOverrides,
    } as StudioModeConfig
    return studioConfig
  }

  const hybridConfig: HybridModeConfig = {
    mode: "hybrid",
    scriptModel: "anthropic/claude-sonnet-4",
    voiceModel: "eleven_multilingual_v2",
    narrativeStyle: narrativeStyle as HybridModeConfig["narrativeStyle"],
    temperature: 0.7,
    voiceSettings: {
      voiceId:
        VOICE_PRESETS[narrativeStyle as keyof typeof VOICE_PRESETS]?.narrator || VOICE_PRESETS.documentary.narrator,
      stability: narrativeStyle === "fiction" ? 0.35 : 0.5,
      similarityBoost: 0.8,
      style: narrativeStyle === "fiction" ? 0.15 : 0,
      useSpeakerBoost: true,
    },
    ...baseConfig,
    ...userOverrides,
  } as HybridModeConfig

  return hybridConfig
}
