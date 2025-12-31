"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant"
}

export function Message({ from, children, className, ...props }: MessageProps) {
  return (
    <div className={cn("flex gap-3", from === "user" ? "flex-row-reverse" : "flex-row", className)} {...props}>
      {children}
    </div>
  )
}

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MessageContent({ children, className, ...props }: MessageContentProps) {
  return (
    <div className={cn("max-w-[80%] rounded-2xl px-4 py-3", className)} {...props}>
      {children}
    </div>
  )
}
