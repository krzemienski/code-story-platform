"use client"

import { useEffect, type ReactNode } from "react"

export function StorageErrorBoundary({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Global handler for storage access errors from browser extensions
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason)
      if (
        message.includes("storage") ||
        message.includes("Access") ||
        message.includes("localStorage") ||
        message.includes("not allowed")
      ) {
        event.preventDefault()
        // Silently suppress storage errors from extensions like YoinkUI
      }
    }

    const handleError = (event: ErrorEvent) => {
      const message = event.message || ""
      if (
        message.includes("storage") ||
        message.includes("Access") ||
        message.includes("localStorage") ||
        message.includes("not allowed")
      ) {
        event.preventDefault()
        // Silently suppress storage errors from extensions like YoinkUI
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleError)
    }
  }, [])

  return <>{children}</>
}
