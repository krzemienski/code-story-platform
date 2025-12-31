"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface RestartButtonProps {
  storyId: string
  isDemo: boolean
  variant?: "default" | "outline" | "ghost"
  label?: string
}

export function RestartButton({ storyId, isDemo, variant = "default", label = "Try Again" }: RestartButtonProps) {
  const router = useRouter()
  const [isRestarting, setIsRestarting] = useState(false)

  const handleRestart = async () => {
    if (isDemo) {
      router.refresh()
      return
    }

    setIsRestarting(true)
    try {
      const res = await fetch(`/api/stories/${storyId}/restart`, { method: "POST" })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error("[v0] Failed to restart:", err)
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <Button onClick={handleRestart} disabled={isRestarting} variant={variant}>
      {isRestarting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  )
}
