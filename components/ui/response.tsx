"use client"

import type * as React from "react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Response({ children, className, ...props }: ResponseProps) {
  const content = typeof children === "string" ? children : String(children)

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      {...props}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
