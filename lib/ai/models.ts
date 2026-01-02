/**
 * AI Model Configuration System
 *
 * Centralized configuration for all AI models used in Labs Studio.
 * Supports dynamic model switching, provider abstraction, and optimized prompts per model.
 */

// =============================================================================
// MODEL DEFINITIONS
// =============================================================================

export type AIProvider = "anthropic" | "openai" | "google" | "groq" | "deepinfra"

export type ModelCapability =
  | "long-context" // 100k+ tokens
  | "fast-inference" // Optimized for speed
  | "creative" // Better for fiction/creative writing
  | "analytical" // Better for technical/documentary
  | "code-understanding" // Specialized for code analysis
  | "cost-effective" // Budget-friendly option

export interface ModelDefinition {
  id: string
  provider: AIProvider
  displayName: string
  description: string
  contextWindow: number
  maxOutputTokens: number
  capabilities: ModelCapability[]
  costPer1kInput: number // USD
  costPer1kOutput: number // USD
  recommendedFor: string[]
  temperatureRange: { min: number; max: number; default: number }
  supportsStreaming: boolean
  isAvailable: boolean
}

export interface ModelConfiguration {
  modelId: string
  temperature: number
  maxTokens: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

// Available models with their configurations
export const AI_MODELS: Record<string, ModelDefinition> = {
  // Anthropic Models
  "anthropic/claude-sonnet-4-20250514": {
    id: "anthropic/claude-sonnet-4-20250514",
    provider: "anthropic",
    displayName: "Claude Sonnet 4",
    description: "Latest Claude model with excellent reasoning and creative capabilities",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    capabilities: ["long-context", "creative", "analytical", "code-understanding"],
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    recommendedFor: ["fiction", "documentary", "technical"],
    temperatureRange: { min: 0, max: 1, default: 0.7 },
    supportsStreaming: true,
    isAvailable: true,
  },
  "anthropic/claude-3-5-haiku-20241022": {
    id: "anthropic/claude-3-5-haiku-20241022",
    provider: "anthropic",
    displayName: "Claude 3.5 Haiku",
    description: "Fast and cost-effective for simpler tasks",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    capabilities: ["fast-inference", "cost-effective", "code-understanding"],
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
    recommendedFor: ["podcast", "tutorial"],
    temperatureRange: { min: 0, max: 1, default: 0.7 },
    supportsStreaming: true,
    isAvailable: true,
  },

  // OpenAI Models
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
    description: "OpenAI's most capable model with multimodal support",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: ["analytical", "code-understanding", "fast-inference"],
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    recommendedFor: ["technical", "documentary"],
    temperatureRange: { min: 0, max: 2, default: 0.8 },
    supportsStreaming: true,
    isAvailable: true,
  },
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o Mini",
    description: "Fast and affordable for most tasks",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: ["fast-inference", "cost-effective"],
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    recommendedFor: ["podcast", "tutorial"],
    temperatureRange: { min: 0, max: 2, default: 0.8 },
    supportsStreaming: true,
    isAvailable: true,
  },
  "openai/o1": {
    id: "openai/o1",
    provider: "openai",
    displayName: "OpenAI o1",
    description: "Advanced reasoning model for complex technical analysis",
    contextWindow: 200000,
    maxOutputTokens: 100000,
    capabilities: ["long-context", "analytical", "code-understanding"],
    costPer1kInput: 0.015,
    costPer1kOutput: 0.06,
    recommendedFor: ["technical"],
    temperatureRange: { min: 1, max: 1, default: 1 }, // o1 has fixed temperature
    supportsStreaming: false, // o1 doesn't support streaming
    isAvailable: true,
  },

  // Google Models
  "google/gemini-2.0-flash": {
    id: "google/gemini-2.0-flash",
    provider: "google",
    displayName: "Gemini 2.0 Flash",
    description: "Google's fast multimodal model",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    capabilities: ["long-context", "fast-inference", "cost-effective"],
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
    recommendedFor: ["podcast", "tutorial"],
    temperatureRange: { min: 0, max: 2, default: 0.9 },
    supportsStreaming: true,
    isAvailable: true,
  },

  // Groq Models (Ultra-fast inference)
  "groq/llama-3.3-70b-versatile": {
    id: "groq/llama-3.3-70b-versatile",
    provider: "groq",
    displayName: "Llama 3.3 70B (Groq)",
    description: "Lightning-fast inference via Groq hardware",
    contextWindow: 128000,
    maxOutputTokens: 32768,
    capabilities: ["fast-inference", "cost-effective"],
    costPer1kInput: 0.00059,
    costPer1kOutput: 0.00079,
    recommendedFor: ["podcast", "tutorial"],
    temperatureRange: { min: 0, max: 2, default: 0.7 },
    supportsStreaming: true,
    isAvailable: false, // Requires API key
  },
}

// =============================================================================
// MODEL SELECTION LOGIC
// =============================================================================

export interface ModelSelectionCriteria {
  narrativeStyle: string
  expertiseLevel: string
  targetDurationMinutes: number
  prioritize?: "quality" | "speed" | "cost"
  userPreferredModel?: string
}

/**
 * Recommends the best model based on content requirements
 */
export function recommendModel(criteria: ModelSelectionCriteria): ModelDefinition {
  // If user explicitly selected a model, use it
  if (criteria.userPreferredModel && AI_MODELS[criteria.userPreferredModel]?.isAvailable) {
    return AI_MODELS[criteria.userPreferredModel]
  }

  const availableModels = Object.values(AI_MODELS).filter((m) => m.isAvailable)

  // Score each model based on criteria
  const scored = availableModels.map((model) => {
    let score = 0

    // Style matching
    if (model.recommendedFor.includes(criteria.narrativeStyle)) {
      score += 30
    }

    // Capability matching
    if (criteria.narrativeStyle === "fiction" && model.capabilities.includes("creative")) {
      score += 20
    }
    if (criteria.narrativeStyle === "technical" && model.capabilities.includes("analytical")) {
      score += 20
    }
    if (criteria.expertiseLevel === "expert" && model.capabilities.includes("code-understanding")) {
      score += 15
    }

    // Duration requirements (longer content needs larger context)
    const estimatedTokens = criteria.targetDurationMinutes * 150 * 1.5
    if (model.maxOutputTokens >= estimatedTokens) {
      score += 25
    } else {
      score -= 50 // Penalize if can't handle the output
    }

    // Priority adjustments
    if (criteria.prioritize === "speed" && model.capabilities.includes("fast-inference")) {
      score += 25
    }
    if (criteria.prioritize === "cost" && model.capabilities.includes("cost-effective")) {
      score += 25
    }
    if (criteria.prioritize === "quality") {
      // Prefer higher-tier models
      if (model.id.includes("claude-sonnet") || model.id.includes("gpt-4o") || model.id.includes("o1")) {
        score += 20
      }
    }

    return { model, score }
  })

  // Sort by score and return the best
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.model || AI_MODELS["anthropic/claude-sonnet-4-20250514"]
}

/**
 * Get optimized configuration for a specific model and task
 */
export function getModelConfiguration(
  modelId: string,
  narrativeStyle: string,
  targetDurationMinutes: number,
): ModelConfiguration {
  const model = AI_MODELS[modelId]
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`)
  }

  const targetWords = targetDurationMinutes * 150
  const estimatedTokens = Math.ceil(targetWords / 0.75) + 2000
  const maxTokens = Math.min(estimatedTokens, model.maxOutputTokens)

  // Adjust temperature based on style
  let temperature = model.temperatureRange.default
  if (narrativeStyle === "fiction") {
    temperature = Math.min(model.temperatureRange.max, temperature + 0.1)
  } else if (narrativeStyle === "technical") {
    temperature = Math.max(model.temperatureRange.min, temperature - 0.1)
  }

  return {
    modelId,
    temperature,
    maxTokens,
    topP: 0.95,
    frequencyPenalty: narrativeStyle === "fiction" ? 0.3 : 0.1,
    presencePenalty: narrativeStyle === "fiction" ? 0.3 : 0.1,
  }
}

// =============================================================================
// PROMPT OPTIMIZATION PER MODEL
// =============================================================================

export interface ModelPromptOptimization {
  systemPromptPrefix?: string
  systemPromptSuffix?: string
  userPromptPrefix?: string
  userPromptSuffix?: string
  specialInstructions?: string
}

/**
 * Get model-specific prompt optimizations
 */
export function getPromptOptimizations(modelId: string): ModelPromptOptimization {
  const provider = AI_MODELS[modelId]?.provider

  switch (provider) {
    case "anthropic":
      return {
        systemPromptPrefix: "",
        specialInstructions: `
CLAUDE-SPECIFIC GUIDELINES:
- Use your full creative and analytical capabilities
- Leverage your extended context window for comprehensive coverage
- Be precise with technical details while maintaining engagement`,
      }

    case "openai":
      return {
        systemPromptPrefix: "",
        specialInstructions: `
GPT-SPECIFIC GUIDELINES:
- Structure your response with clear logical flow
- Use your training on diverse content for rich metaphors
- Balance creativity with factual accuracy`,
      }

    case "google":
      return {
        systemPromptPrefix: "",
        specialInstructions: `
GEMINI-SPECIFIC GUIDELINES:
- Leverage your multimodal understanding for rich descriptions
- Use your broad knowledge base for accurate comparisons
- Maintain consistent voice throughout the narrative`,
      }

    default:
      return {}
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all available models for UI display
 */
export function getAvailableModels(): ModelDefinition[] {
  return Object.values(AI_MODELS).filter((m) => m.isAvailable)
}

/**
 * Get models grouped by provider
 */
export function getModelsByProvider(): Record<AIProvider, ModelDefinition[]> {
  const grouped: Record<AIProvider, ModelDefinition[]> = {
    anthropic: [],
    openai: [],
    google: [],
    groq: [],
    deepinfra: [],
  }

  for (const model of Object.values(AI_MODELS)) {
    if (model.isAvailable) {
      grouped[model.provider].push(model)
    }
  }

  return grouped
}

/**
 * Estimate cost for a generation
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
  const model = AI_MODELS[modelId]
  if (!model) {
    return { inputCost: 0, outputCost: 0, totalCost: 0 }
  }

  const inputCost = (inputTokens / 1000) * model.costPer1kInput
  const outputCost = (outputTokens / 1000) * model.costPer1kOutput

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  }
}
