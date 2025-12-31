"use client"

import * as React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: "smooth" | "instant"
  resize?: "smooth" | "instant"
}

interface ConversationContextValue {
  scrollToBottom: (behavior?: ScrollBehavior) => void
  isAtBottom: boolean
}

const ConversationContext = React.createContext<ConversationContextValue | null>(null)

export function useConversation() {
  const context = React.useContext(ConversationContext)
  if (!context) {
    throw new Error("useConversation must be used within a Conversation")
  }
  return context
}

export function Conversation({
  children,
  initial = "smooth",
  resize = "smooth",
  className,
  ...props
}: ConversationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      })
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const threshold = 100
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Auto-scroll to bottom when content changes and user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom(initial === "smooth" ? "smooth" : "instant")
    }
  }, [children, isAtBottom, scrollToBottom, initial])

  return (
    <ConversationContext.Provider value={{ scrollToBottom, isAtBottom }}>
      <div ref={containerRef} className={cn("relative flex flex-col overflow-y-auto", className)} {...props}>
        {children}
      </div>
    </ConversationContext.Provider>
  )
}

interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ConversationContent({ children, className, ...props }: ConversationContentProps) {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  )
}

interface ConversationEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function ConversationEmptyState({
  title = "No messages yet",
  description,
  icon,
  children,
  className,
  ...props
}: ConversationEmptyStateProps) {
  if (children) {
    return (
      <div className={cn("flex flex-1 items-center justify-center", className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-4 text-center", className)} {...props}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

interface ConversationScrollButtonProps extends React.ComponentProps<typeof Button> {}

export function ConversationScrollButton({ className, ...props }: ConversationScrollButtonProps) {
  const { scrollToBottom, isAtBottom } = useConversation()

  if (isAtBottom) return null

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute bottom-4 left-1/2 z-10 h-8 w-8 -translate-x-1/2 rounded-full shadow-lg bg-background",
        className,
      )}
      onClick={() => scrollToBottom()}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  )
}
