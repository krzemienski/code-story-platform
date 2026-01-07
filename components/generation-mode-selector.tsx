"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wand2, Podcast, Info, Check, Settings2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { type GenerationMode, type GenerationModeConfig, getRecommendedMode } from "@/lib/generation/modes"
import { ModelSelector } from "@/components/model-selector"

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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const recommendedMode = getRecommendedMode(narrativeStyle)

  const modes = [
    {
      id: "hybrid" as GenerationMode,
      name: "Hybrid (Claude + Voice)",
      icon: Wand2,
      description: "Custom script generation with Claude AI, voiced by ElevenLabs TTS",
      features: ["Advanced Prompt Control", "Custom Narratives", "Precise Language", "Long-form Content"],
      color: "blue",
      bestFor: "Fiction, tutorials, and technical deep-dives",
    },
    {
      id: "elevenlabs_studio" as GenerationMode,
      name: "ElevenLabs Studio",
      icon: Podcast,
      description: "Full Studio API with professional podcast production pipeline",
      features: ["Studio Project API", "Professional Quality", "Background Music", "Sound Effects"],
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
        scriptModel: "anthropic/claude-sonnet-4-20250514",
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
                <strong>Hybrid</strong> uses Claude/GPT for script writing with ElevenLabs TTS.
                <strong> ElevenLabs Studio</strong> uses the full Studio API for professional production.
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

      {/* Hybrid mode options */}
      <AnimatePresence>
        {mode === "hybrid" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Script Generation Model</Label>
                  <p className="text-xs text-muted-foreground">Choose AI model for script writing</p>
                </div>
                <ModelSelector
                  selectedModel={config.scriptModel || "anthropic/claude-sonnet-4-20250514"}
                  onSelectModel={(modelId) => onConfigChange({ ...config, scriptModel: modelId })}
                  narrativeStyle={narrativeStyle}
                  className="w-[200px]"
                />
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="h-3 w-3" />
                {showAdvanced ? "Hide" : "Show"} advanced options
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-2 border-t border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Voice Synthesis</Label>
                      <p className="text-xs text-muted-foreground">Audio generation method</p>
                    </div>
                    <Select
                      value={config.voiceSynthesis || "elevenlabs-tts"}
                      onValueChange={(v) => onConfigChange({ ...config, voiceSynthesis: v })}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elevenlabs-tts">ElevenLabs TTS</SelectItem>
                        <SelectItem value="elevenlabs-studio">ElevenLabs Studio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Studio mode options */}
      <AnimatePresence>
        {mode === "elevenlabs_studio" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Studio Format</Label>
                  <p className="text-xs text-muted-foreground">Production style</p>
                </div>
                <Select
                  value={config.studioFormat || "podcast"}
                  onValueChange={(v) =>
                    onConfigChange({ ...config, studioFormat: v as "podcast" | "audiobook" | "documentary" })
                  }
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="audiobook">Audiobook</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Duration Target</Label>
                  <p className="text-xs text-muted-foreground">Content length</p>
                </div>
                <Select
                  value={config.studioDuration || "default"}
                  onValueChange={(v) =>
                    onConfigChange({ ...config, studioDuration: v as "short" | "default" | "long" })
                  }
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (~5 min)</SelectItem>
                    <SelectItem value="default">Default (~15 min)</SelectItem>
                    <SelectItem value="long">Long (~30 min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
