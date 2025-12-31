"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ui/conversation"
import { Message, MessageContent } from "@/components/ui/message"
import { Response } from "@/components/ui/response"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"

interface IntentChatProps {
  repoName: string
  repoOwner: string
  onIntentComplete: (intent: string, focusAreas: string[]) => void
  className?: string
}

const QUICK_OPTIONS = [
  {
    label: "Understand the architecture",
    value: "I want to understand the overall architecture and how the modules connect",
  },
  { label: "Learn how to contribute", value: "I want to learn how to contribute to this project effectively" },
  { label: "Prepare for code review", value: "I need to prepare for a code review of this codebase" },
  { label: "Explore specific feature", value: "I want to explore a specific feature in detail" },
]

export function IntentChat({ repoName, repoOwner, onIntentComplete, className }: IntentChatProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showQuickOptions, setShowQuickOptions] = useState(true)
  const [inputValue, setInputValue] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/intent",
      body: { repoName, repoOwner },
    }),
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: `I see you want to explore **${repoOwner}/${repoName}**. Great choice!\n\nTo create the perfect story for you, I have a few questions. Feel free to answer as much or as little as you like—I can fill in the gaps.\n\n**What's your main goal with this codebase?**`,
      },
    ],
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSend = async (content: string) => {
    if (!content?.trim() || isLoading) return

    setShowQuickOptions(false)
    setInputValue("")

    sendMessage({
      role: "user",
      content: content.trim(),
    })

    // After a few exchanges, allow completion
    if (messages.length >= 4) {
      setTimeout(() => {
        onIntentComplete(content, ["architecture", "patterns"])
      }, 2000)
    }
  }

  const handleQuickOption = (value: string) => {
    handleSend(value)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(inputValue)
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <Card className={cn("flex h-[500px] flex-col", className)}>
      <CardContent className="relative flex flex-1 flex-col overflow-hidden p-0">
        <Conversation className="absolute inset-0 pb-20">
          <ConversationContent className="flex min-w-0 flex-col gap-4 p-6">
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent
                  className={cn(message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                  <Response>
                    {typeof message.content === "string"
                      ? message.content
                      : message.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") || ""}
                  </Response>
                </MessageContent>
                {message.role === "assistant" && (
                  <div className="ring-border size-8 shrink-0 overflow-hidden rounded-full ring-1">
                    <Orb
                      className="h-full w-full"
                      colors={["#4ade80", "#22c55e"]}
                      agentState={isLoading && message.id === messages[messages.length - 1]?.id ? "talking" : null}
                    />
                  </div>
                )}
              </Message>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <Message from="assistant">
                <MessageContent className="bg-muted">
                  <ShimmeringText text="Thinking..." duration={1} repeat />
                </MessageContent>
                <div className="ring-border size-8 shrink-0 overflow-hidden rounded-full ring-1">
                  <Orb className="h-full w-full" colors={["#4ade80", "#22c55e"]} agentState="thinking" />
                </div>
              </Message>
            )}

            {/* Quick options - show only initially */}
            {showQuickOptions && messages.length === 1 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSend(option.value)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary hover:bg-secondary"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* Show completion button after enough exchanges */}
            {messages.length >= 4 && (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => {
                    const userMessages = messages.filter((m) => m.role === "user")
                    const intentSummary = userMessages
                      .map((m) => (typeof m.content === "string" ? m.content : ""))
                      .join(" ")
                    onIntentComplete(intentSummary, ["architecture", "patterns"])
                  }}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Continue with this plan
                </Button>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
