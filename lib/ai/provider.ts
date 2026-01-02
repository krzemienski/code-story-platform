/**
 * AI Provider Abstraction Layer
 *
 * Provides a unified interface for calling different AI providers
 * through the Vercel AI SDK and AI Gateway.
 */

import { generateText, streamText, type CoreMessage } from "ai"
import { AI_MODELS, getModelConfiguration, getPromptOptimizations, type ModelConfiguration } from "./models"

// =============================================================================
// TYPES
// =============================================================================

export interface GenerateOptions {
  modelId: string
  systemPrompt: string
  userPrompt: string
  narrativeStyle: string
  targetDurationMinutes: number
  temperature?: number
  maxTokens?: number
  stream?: boolean
  onProgress?: (chunk: string) => void
}

export interface GenerateResult {
  text: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
  metadata: {
    configuration: ModelConfiguration
    estimatedCost: { inputCost: number; outputCost: number; totalCost: number }
  }
}

// =============================================================================
// PROVIDER IMPLEMENTATION
// =============================================================================

/**
 * Generate text using the specified model with optimized configuration
 */
export async function generateWithModel(options: GenerateOptions): Promise<GenerateResult> {
  const { modelId, systemPrompt, userPrompt, narrativeStyle, targetDurationMinutes, temperature, maxTokens } = options

  // Get model definition and configuration
  const modelDef = AI_MODELS[modelId]
  if (!modelDef) {
    throw new Error(`Model not found: ${modelId}`)
  }

  if (!modelDef.isAvailable) {
    throw new Error(`Model not available: ${modelId}`)
  }

  // Get optimized configuration
  const config = getModelConfiguration(modelId, narrativeStyle, targetDurationMinutes)

  // Override with explicit options if provided
  if (temperature !== undefined) config.temperature = temperature
  if (maxTokens !== undefined) config.maxTokens = maxTokens

  // Get model-specific prompt optimizations
  const optimizations = getPromptOptimizations(modelId)

  // Build optimized prompts
  const finalSystemPrompt = [
    optimizations.systemPromptPrefix,
    systemPrompt,
    optimizations.specialInstructions,
    optimizations.systemPromptSuffix,
  ]
    .filter(Boolean)
    .join("\n\n")

  const finalUserPrompt = [optimizations.userPromptPrefix, userPrompt, optimizations.userPromptSuffix]
    .filter(Boolean)
    .join("\n\n")

  console.log(`[v0] Generating with model: ${modelId}`)
  console.log(`[v0] Configuration:`, config)

  // Call the AI SDK - uses Vercel AI Gateway automatically
  const result = await generateText({
    model: modelId, // AI Gateway handles provider routing
    system: finalSystemPrompt,
    prompt: finalUserPrompt,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    topP: config.topP,
    frequencyPenalty: config.frequencyPenalty,
    presencePenalty: config.presencePenalty,
  })

  // Calculate usage and cost
  const usage = {
    promptTokens: result.usage?.promptTokens || 0,
    completionTokens: result.usage?.completionTokens || 0,
    totalTokens: result.usage?.totalTokens || 0,
  }

  const estimatedCost = {
    inputCost: (usage.promptTokens / 1000) * modelDef.costPer1kInput,
    outputCost: (usage.completionTokens / 1000) * modelDef.costPer1kOutput,
    totalCost: 0,
  }
  estimatedCost.totalCost = estimatedCost.inputCost + estimatedCost.outputCost

  return {
    text: result.text,
    model: modelId,
    usage,
    finishReason: result.finishReason || "stop",
    metadata: {
      configuration: config,
      estimatedCost,
    },
  }
}

/**
 * Stream text generation for real-time progress
 */
export async function streamWithModel(options: GenerateOptions): Promise<ReadableStream> {
  const {
    modelId,
    systemPrompt,
    userPrompt,
    narrativeStyle,
    targetDurationMinutes,
    temperature,
    maxTokens,
    onProgress,
  } = options

  const modelDef = AI_MODELS[modelId]
  if (!modelDef) {
    throw new Error(`Model not found: ${modelId}`)
  }

  if (!modelDef.supportsStreaming) {
    throw new Error(`Model does not support streaming: ${modelId}`)
  }

  const config = getModelConfiguration(modelId, narrativeStyle, targetDurationMinutes)
  if (temperature !== undefined) config.temperature = temperature
  if (maxTokens !== undefined) config.maxTokens = maxTokens

  const optimizations = getPromptOptimizations(modelId)

  const finalSystemPrompt = [
    optimizations.systemPromptPrefix,
    systemPrompt,
    optimizations.specialInstructions,
    optimizations.systemPromptSuffix,
  ]
    .filter(Boolean)
    .join("\n\n")

  const result = streamText({
    model: modelId,
    system: finalSystemPrompt,
    prompt: userPrompt,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  })

  return result.textStream
}

/**
 * Multi-turn conversation with model
 */
export async function chatWithModel(
  modelId: string,
  messages: CoreMessage[],
  systemPrompt?: string,
): Promise<GenerateResult> {
  const modelDef = AI_MODELS[modelId]
  if (!modelDef) {
    throw new Error(`Model not found: ${modelId}`)
  }

  const result = await generateText({
    model: modelId,
    system: systemPrompt,
    messages,
    maxTokens: 2000,
    temperature: 0.7,
  })

  const usage = {
    promptTokens: result.usage?.promptTokens || 0,
    completionTokens: result.usage?.completionTokens || 0,
    totalTokens: result.usage?.totalTokens || 0,
  }

  return {
    text: result.text,
    model: modelId,
    usage,
    finishReason: result.finishReason || "stop",
    metadata: {
      configuration: { modelId, temperature: 0.7, maxTokens: 2000 },
      estimatedCost: {
        inputCost: (usage.promptTokens / 1000) * modelDef.costPer1kInput,
        outputCost: (usage.completionTokens / 1000) * modelDef.costPer1kOutput,
        totalCost: 0,
      },
    },
  }
}
