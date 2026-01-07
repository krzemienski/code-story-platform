"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText, Code, Brain, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ContextPreviewProps {
  repoAnalysis?: {
    fileCount: number
    totalLines: number
    languages: string[]
    structure: string
  }
  promptContext?: string
  scriptPreview?: string
  wordCount?: number
  targetDuration?: number
  isExpanded?: boolean
  onToggle?: () => void
}

export function ContextPreview({
  repoAnalysis,
  promptContext,
  scriptPreview,
  wordCount = 0,
  targetDuration = 15,
  isExpanded = false,
  onToggle,
}: ContextPreviewProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "prompt" | "script">("analysis")
  const [copied, setCopied] = useState(false)

  const targetWords = targetDuration * 150
  const wordProgress = Math.min((wordCount / targetWords) * 100, 100)
  const estimatedMinutes = Math.round(wordCount / 150)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!repoAnalysis && !promptContext && !scriptPreview) {
    return null
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-black/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-purple-400" />
          <span className="font-medium">AI Context Preview</span>
          {wordCount > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
              {wordCount.toLocaleString()} words / {estimatedMinutes} min
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isExpanded && (
        <div className="border-t border-white/10">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("analysis")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "analysis"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-white/50 hover:text-white/70",
              )}
            >
              <FileText className="inline h-4 w-4 mr-1.5" />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab("prompt")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "prompt"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-white/50 hover:text-white/70",
              )}
            >
              <Code className="inline h-4 w-4 mr-1.5" />
              Prompt
            </button>
            <button
              onClick={() => setActiveTab("script")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "script"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-white/50 hover:text-white/70",
              )}
            >
              <Brain className="inline h-4 w-4 mr-1.5" />
              Script
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === "analysis" && repoAnalysis && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-white/50">Files Analyzed</p>
                    <p className="text-lg font-semibold">{repoAnalysis.fileCount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-white/50">Lines of Code</p>
                    <p className="text-lg font-semibold">{repoAnalysis.totalLines.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-white/50 mb-2">Languages Detected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {repoAnalysis.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                {repoAnalysis.structure && (
                  <ScrollArea className="h-32 rounded-lg bg-white/5 p-3">
                    <pre className="text-xs text-white/70 font-mono">{repoAnalysis.structure}</pre>
                  </ScrollArea>
                )}
              </div>
            )}

            {activeTab === "prompt" && promptContext && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(promptContext)} className="text-xs h-7">
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="h-64 rounded-lg bg-white/5 p-3">
                  <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap">{promptContext}</pre>
                </ScrollArea>
              </div>
            )}

            {activeTab === "script" && (
              <div className="space-y-3">
                {/* Word count progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Word Count Progress</span>
                    <span className="text-white/70">
                      {wordCount.toLocaleString()} / {targetWords.toLocaleString()} target
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        wordProgress >= 90 ? "bg-green-500" : wordProgress >= 50 ? "bg-yellow-500" : "bg-red-500",
                      )}
                      style={{ width: `${wordProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/50">
                    {wordProgress >= 90
                      ? "Script meets target duration"
                      : `Need ${(targetWords - wordCount).toLocaleString()} more words for ${targetDuration} min`}
                  </p>
                </div>

                {scriptPreview ? (
                  <ScrollArea className="h-48 rounded-lg bg-white/5 p-3">
                    <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap">
                      {scriptPreview.slice(0, 2000)}
                      {scriptPreview.length > 2000 && "..."}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="h-48 rounded-lg bg-white/5 flex items-center justify-center">
                    <p className="text-sm text-white/30">Script will appear here during generation</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
