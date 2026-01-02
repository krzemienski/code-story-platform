"use client"

import { useState } from "react"
import { Settings2, Wand2, Gauge, DollarSign, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ModelSelector } from "./model-selector"
import { AI_MODELS, recommendModel, estimateCost } from "@/lib/ai/models"
import { cn } from "@/lib/utils"

export interface GenerationConfig {
  modelId: string
  temperature: number
  maxTokens: number | null // null = auto
  priority: "quality" | "speed" | "cost"
  autoSelectModel: boolean
  streamOutput: boolean
}

interface GenerationConfigPanelProps {
  config: GenerationConfig
  onChange: (config: GenerationConfig) => void
  narrativeStyle: string
  targetDurationMinutes: number
  className?: string
}

export function GenerationConfigPanel({
  config,
  onChange,
  narrativeStyle,
  targetDurationMinutes,
  className,
}: GenerationConfigPanelProps) {
  const [open, setOpen] = useState(false)

  const model = AI_MODELS[config.modelId]
  const estimatedOutputTokens = targetDurationMinutes * 150 * 1.5
  const costEstimate = model ? estimateCost(config.modelId, 5000, estimatedOutputTokens) : null

  // Auto-select model when enabled
  const handleAutoSelectChange = (enabled: boolean) => {
    if (enabled) {
      const recommended = recommendModel({
        narrativeStyle,
        expertiseLevel: "intermediate",
        targetDurationMinutes,
        prioritize: config.priority,
      })
      onChange({
        ...config,
        autoSelectModel: true,
        modelId: recommended.id,
      })
    } else {
      onChange({ ...config, autoSelectModel: false })
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 border-white/10 bg-white/5 hover:bg-white/10", className)}
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Configure</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-black/95 border-white/10 w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white">Generation Settings</SheetTitle>
          <SheetDescription className="text-white/60">Customize AI model and generation parameters</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Auto Model Selection */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Auto-select Model</Label>
              <p className="text-xs text-white/50">Let us choose the best model for your content</p>
            </div>
            <Switch checked={config.autoSelectModel} onCheckedChange={handleAutoSelectChange} />
          </div>

          {/* Model Selector */}
          {!config.autoSelectModel && (
            <div className="space-y-2">
              <Label className="text-white">AI Model</Label>
              <ModelSelector
                selectedModel={config.modelId}
                onSelectModel={(modelId) => onChange({ ...config, modelId })}
                narrativeStyle={narrativeStyle}
                className="w-full"
              />
            </div>
          )}

          {/* Priority Selection */}
          <div className="space-y-3">
            <Label className="text-white">Optimization Priority</Label>
            <RadioGroup
              value={config.priority}
              onValueChange={(value: "quality" | "speed" | "cost") => {
                const newConfig = { ...config, priority: value }
                if (config.autoSelectModel) {
                  const recommended = recommendModel({
                    narrativeStyle,
                    expertiseLevel: "intermediate",
                    targetDurationMinutes,
                    prioritize: value,
                  })
                  newConfig.modelId = recommended.id
                }
                onChange(newConfig)
              }}
              className="grid grid-cols-3 gap-2"
            >
              <Label
                htmlFor="quality"
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                  config.priority === "quality"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/10 hover:border-white/20",
                )}
              >
                <RadioGroupItem value="quality" id="quality" className="sr-only" />
                <Wand2 className="h-5 w-5 text-purple-400" />
                <span className="text-xs text-white">Quality</span>
              </Label>
              <Label
                htmlFor="speed"
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                  config.priority === "speed"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:border-white/20",
                )}
              >
                <RadioGroupItem value="speed" id="speed" className="sr-only" />
                <Gauge className="h-5 w-5 text-blue-400" />
                <span className="text-xs text-white">Speed</span>
              </Label>
              <Label
                htmlFor="cost"
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                  config.priority === "cost"
                    ? "border-green-500 bg-green-500/10"
                    : "border-white/10 hover:border-white/20",
                )}
              >
                <RadioGroupItem value="cost" id="cost" className="sr-only" />
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-xs text-white">Cost</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white">Creativity (Temperature)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-white/40" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Higher values produce more creative/varied output. Lower values are more focused and
                      deterministic.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[config.temperature]}
                onValueChange={([value]) => onChange({ ...config, temperature: value })}
                min={0}
                max={1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-white/60 w-10 text-right">{config.temperature.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Stream Output Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Stream Output</Label>
              <p className="text-xs text-white/50">See text as it generates (may be slower)</p>
            </div>
            <Switch
              checked={config.streamOutput}
              onCheckedChange={(streamOutput) => onChange({ ...config, streamOutput })}
            />
          </div>

          {/* Cost Estimate */}
          {costEstimate && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-sm font-medium text-white">Estimated Cost</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-white">${costEstimate.inputCost.toFixed(4)}</p>
                  <p className="text-xs text-white/50">Input</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">${costEstimate.outputCost.toFixed(4)}</p>
                  <p className="text-xs text-white/50">Output</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-purple-400">${costEstimate.totalCost.toFixed(4)}</p>
                  <p className="text-xs text-white/50">Total</p>
                </div>
              </div>
              <p className="text-xs text-white/40 text-center mt-2">
                Based on ~{Math.round(estimatedOutputTokens)} output tokens
              </p>
            </div>
          )}

          {/* Model Info */}
          {model && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-sm font-medium text-white">{model.displayName}</h4>
              <p className="text-xs text-white/60">{model.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {model.capabilities.map((cap) => (
                  <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                    {cap}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-xs text-white/40 mt-2">
                <span>Context: {(model.contextWindow / 1000).toFixed(0)}K</span>
                <span>Max Output: {(model.maxOutputTokens / 1000).toFixed(0)}K</span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function useGenerationConfig(
  initialConfig?: Partial<GenerationConfig>,
): [GenerationConfig, (config: GenerationConfig) => void] {
  const [config, setConfig] = useState<GenerationConfig>({
    modelId: "anthropic/claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: null,
    priority: "quality",
    autoSelectModel: true,
    streamOutput: false,
    ...initialConfig,
  })

  return [config, setConfig]
}
