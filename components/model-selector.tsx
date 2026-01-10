"use client"

import { useState } from "react"
import { Check, ChevronDown, Zap, DollarSign, Brain, Sparkles, Code, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AI_MODELS, getModelsByProvider, type ModelDefinition, type ModelCapability } from "@/lib/ai/models"

interface ModelSelectorProps {
  selectedModel: string
  onSelectModel: (modelId: string) => void
  narrativeStyle?: string
  className?: string
}

const CAPABILITY_ICONS: Record<ModelCapability, typeof Zap> = {
  "long-context": Brain,
  "fast-inference": Zap,
  creative: Sparkles,
  analytical: Brain,
  "code-understanding": Code,
  "cost-effective": DollarSign,
  reasoning: Lightbulb,
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  openai: "bg-green-500/10 text-green-500 border-green-500/20",
  google: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  groq: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

export function ModelSelector({ selectedModel, onSelectModel, narrativeStyle, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const modelsByProvider = getModelsByProvider()
  const currentModel = AI_MODELS[selectedModel]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between min-w-[200px] border-white/10 bg-white/5 hover:bg-white/10", className)}
        >
          <div className="flex items-center gap-2">
            {currentModel && (
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", PROVIDER_COLORS[currentModel.provider])}
              >
                {currentModel.provider}
              </Badge>
            )}
            <span className="truncate">{currentModel?.displayName || "Select Model"}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[350px] bg-black/95 border-white/10" align="start">
        {/* Anthropic Models */}
        {modelsByProvider.anthropic.length > 0 && (
          <>
            <DropdownMenuLabel className="text-orange-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Anthropic
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {modelsByProvider.anthropic.map((model) => (
                <ModelItem
                  key={model.id}
                  model={model}
                  isSelected={selectedModel === model.id}
                  narrativeStyle={narrativeStyle}
                  onSelect={() => {
                    onSelectModel(model.id)
                    setOpen(false)
                  }}
                />
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
          </>
        )}

        {/* OpenAI Models */}
        {modelsByProvider.openai.length > 0 && (
          <>
            <DropdownMenuLabel className="text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              OpenAI
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {modelsByProvider.openai.map((model) => (
                <ModelItem
                  key={model.id}
                  model={model}
                  isSelected={selectedModel === model.id}
                  narrativeStyle={narrativeStyle}
                  onSelect={() => {
                    onSelectModel(model.id)
                    setOpen(false)
                  }}
                />
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
          </>
        )}

        {/* Google Models */}
        {modelsByProvider.google.length > 0 && (
          <>
            <DropdownMenuLabel className="text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Google
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {modelsByProvider.google.map((model) => (
                <ModelItem
                  key={model.id}
                  model={model}
                  isSelected={selectedModel === model.id}
                  narrativeStyle={narrativeStyle}
                  onSelect={() => {
                    onSelectModel(model.id)
                    setOpen(false)
                  }}
                />
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ModelItem({
  model,
  isSelected,
  narrativeStyle,
  onSelect,
}: {
  model: ModelDefinition
  isSelected: boolean
  narrativeStyle?: string
  onSelect: () => void
}) {
  const isRecommended = narrativeStyle && model.recommendedFor.includes(narrativeStyle)

  return (
    <DropdownMenuItem
      className={cn("flex flex-col items-start gap-1 py-2 cursor-pointer", isSelected && "bg-purple-500/10")}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium">{model.displayName}</span>
          {isRecommended && (
            <Badge className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0">Recommended</Badge>
          )}
        </div>
        {isSelected && <Check className="h-4 w-4 text-purple-400" />}
      </div>
      <p className="text-xs text-white/50 line-clamp-1">{model.description}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {model.capabilities.slice(0, 3).map((cap) => {
          const Icon = CAPABILITY_ICONS[cap]
          return (
            <div key={cap} className="flex items-center gap-0.5 text-[10px] text-white/40" title={cap}>
              <Icon className="h-3 w-3" />
            </div>
          )
        })}
        <span className="text-[10px] text-white/30 ml-1">${(model.costPer1kOutput * 1000).toFixed(2)}/1M out</span>
      </div>
    </DropdownMenuItem>
  )
}
