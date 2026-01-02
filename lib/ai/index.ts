/**
 * AI Module Exports
 *
 * Central export point for all AI-related functionality.
 */

// Model definitions and selection
export {
  AI_MODELS,
  recommendModel,
  getModelConfiguration,
  getPromptOptimizations,
  getAvailableModels,
  getModelsByProvider,
  estimateCost,
  type AIProvider,
  type ModelCapability,
  type ModelDefinition,
  type ModelConfiguration,
  type ModelSelectionCriteria,
} from "./models"

// Provider abstraction
export {
  generateWithModel,
  streamWithModel,
  chatWithModel,
  type GenerateOptions,
  type GenerateResult,
} from "./provider"
