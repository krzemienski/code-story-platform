"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wand2, Podcast, Info, Check } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type GenerationMode, getRecommendedMode } from "@/lib/generation/modes"

interface GenerationModeSelectorProps {
  narrativeStyle: string
  selectedMode: GenerationMode
  onModeChange: (mode: GenerationMode) => void
  studioOptions: {
    includeMusic: boolean
    includeSFX: boolean
    duration: "short" | "default" | "long"
  }
  onStudioOptionsChange: (options: GenerationModeSelectorProps["studioOptions"]) => void
}

export function GenerationModeSelector({
  narrativeStyle,
  selectedMode,
  onModeChange,
  studioOptions,
  onStudioOptionsChange,
}: GenerationModeSelectorProps) {
  const recommendedMode = getRecommendedMode(narrativeStyle)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const modes = [
    {
      id: "elevenlabs_studio" as GenerationMode,
      name: "Full Studio",
      icon: Podcast,
      description: "Professional podcast production with AI-generated music and multi-voice support",
      features: ["GenFM Podcast Engine", "Background Music", "Multiple Voices", "Sound Effects"],
      color: "purple",
      bestFor: "Podcast-style conversational content",
    },
    {
      id: "hybrid" as GenerationMode,
      name: "Hybrid (Claude + Voice)",
      icon: Wand2,
      description: "Custom script generation with Claude AI, voiced by ElevenLabs",
      features: ["Advanced Prompt Control", "Custom Narratives", "Precise Language", "Long-form Content"],
      color: "blue",
      bestFor: "Fiction, tutorials, and technical deep-dives",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Label className="text-base font-semibold">Generation Mode</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Choose how your tale is generated. <strong>Full Studio</strong> uses ElevenLabs' complete production
                  pipeline. <strong>Hybrid</strong> uses Claude for script writing with ElevenLabs for voice synthesis.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {modes.map((mode) => {
            const isSelected = selectedMode === mode.id
            const isRecommended = recommendedMode === mode.id
            const Icon = mode.icon

            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  "relative p-5 rounded-xl border-2 text-left transition-all",
                  isSelected
                    ? mode.color === "purple"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-blue-500 bg-blue-500/10"
                    : "border-border hover:border-muted-foreground/50 bg-card/50",
                )}
              >
                {isRecommended && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary text-primary-foreground">
                    Recommended
                  </span>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      mode.color === "purple" ? "bg-purple-500/20" : "bg-blue-500/20",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", mode.color === "purple" ? "text-purple-400" : "text-blue-400")} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{mode.name}</h3>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {mode.features.map((feature) => (
                    <span
                      key={feature}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium",
                        isSelected
                          ? mode.color === "purple"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-blue-500/20 text-blue-300"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-[10px] text-muted-foreground">
                  <strong>Best for:</strong> {mode.bestFor}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Studio-specific options */}
      <AnimatePresence>
        {selectedMode === "elevenlabs_studio" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                <Podcast className="h-4 w-4 text-purple-400" />
                Studio Production Options
              </h4>

              <div className="space-y-4">
                {/* Duration */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Episode Duration</Label>
                  <div className="flex gap-2">
                    {(["short", "default", "long"] as const).map((duration) => (
                      <button
                        key={duration}
                        onClick={() => onStudioOptionsChange({ ...studioOptions, duration })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          studioOptions.duration === duration
                            ? "bg-purple-500 text-white"
                            : "bg-secondary text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {duration === "short" ? "~5 min" : duration === "default" ? "~15 min" : "~30 min"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Music */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Background Music</Label>
                    <p className="text-xs text-muted-foreground">AI-generated ambient music</p>
                  </div>
                  <Switch
                    checked={studioOptions.includeMusic}
                    onCheckedChange={(checked) => onStudioOptionsChange({ ...studioOptions, includeMusic: checked })}
                  />
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Sound Effects</Label>
                    <p className="text-xs text-muted-foreground">Contextual audio cues</p>
                  </div>
                  <Switch
                    checked={studioOptions.includeSFX}
                    onCheckedChange={(checked) => onStudioOptionsChange({ ...studioOptions, includeSFX: checked })}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hybrid-specific info */}
      <AnimatePresence>
        {selectedMode === "hybrid" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-blue-400" />
                Hybrid Mode
              </h4>
              <p className="text-xs text-muted-foreground">
                Your tale will be crafted by Claude AI with full narrative control, then voiced using ElevenLabs'
                premium text-to-speech. Best for complex stories, tutorials, and technical content where precise
                language matters.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
