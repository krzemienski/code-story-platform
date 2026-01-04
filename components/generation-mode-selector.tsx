"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Wand2, Podcast, Info, Check } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type GenerationMode, type GenerationModeConfig, getRecommendedMode } from "@/lib/generation/modes"

interface GenerationModeSelectorProps {
  mode: GenerationMode
  config: GenerationModeConfig
  onModeChange: (mode: GenerationMode) => void
  onConfigChange: (config: GenerationModeConfig) => void
  narrativeStyle: string
}

export function GenerationModeSelector({
  mode,
  config,
  onModeChange,
  onConfigChange,
  narrativeStyle,
}: GenerationModeSelectorProps) {
  const recommendedMode = getRecommendedMode(narrativeStyle)

  const modes = [
    {
      id: "hybrid" as GenerationMode,
      name: "Hybrid (Claude + Voice)",
      icon: Wand2,
      description: "Custom script generation with Claude AI, voiced by ElevenLabs",
      features: ["Advanced Prompt Control", "Custom Narratives", "Precise Language", "Long-form Content"],
      color: "blue",
      bestFor: "Fiction, tutorials, and technical deep-dives",
    },
    {
      id: "elevenlabs_studio" as GenerationMode,
      name: "Full Studio",
      icon: Podcast,
      description: "Professional podcast production with AI-generated content and multi-voice support",
      features: ["GenFM Podcast Engine", "Background Music", "Multiple Voices", "Sound Effects"],
      color: "purple",
      bestFor: "Podcast-style conversational content",
    },
  ]

  const handleModeChange = (newMode: GenerationMode) => {
    onModeChange(newMode)
    // Update config to match the new mode
    if (newMode === "hybrid") {
      onConfigChange({
        mode: "hybrid",
        scriptModel: "claude-sonnet-4",
        voiceSynthesis: "elevenlabs-tts",
        enableSoundEffects: false,
        enableBackgroundMusic: false,
      })
    } else {
      onConfigChange({
        mode: "elevenlabs_studio",
        studioFormat: "podcast",
        studioDuration: "default",
        enableSoundEffects: true,
        enableBackgroundMusic: true,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Generation Mode</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                <strong>Hybrid</strong> uses Claude for script writing with ElevenLabs for voice.
                <strong> Full Studio</strong> uses ElevenLabs' complete production pipeline.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {modes.map((m) => {
          const isSelected = mode === m.id
          const isRecommended = recommendedMode === m.id
          const Icon = m.icon

          return (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all",
                isSelected
                  ? m.color === "purple"
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
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    m.color === "purple" ? "bg-purple-500/20" : "bg-blue-500/20",
                  )}
                >
                  <Icon className={cn("h-4 w-4", m.color === "purple" ? "text-purple-400" : "text-blue-400")} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{m.name}</h3>
                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.description}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {m.features.slice(0, 2).map((feature) => (
                  <span
                    key={feature}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px]",
                      isSelected
                        ? m.color === "purple"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-blue-500/20 text-blue-300"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Studio-specific options */}
      <AnimatePresence>
        {mode === "elevenlabs_studio" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Background Music</Label>
                  <p className="text-xs text-muted-foreground">AI-generated ambient music</p>
                </div>
                <Switch
                  checked={config.enableBackgroundMusic}
                  onCheckedChange={(checked) => onConfigChange({ ...config, enableBackgroundMusic: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Sound Effects</Label>
                  <p className="text-xs text-muted-foreground">Contextual audio cues</p>
                </div>
                <Switch
                  checked={config.enableSoundEffects}
                  onCheckedChange={(checked) => onConfigChange({ ...config, enableSoundEffects: checked })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
