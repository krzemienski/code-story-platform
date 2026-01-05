"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface StoryProgress {
  status: string
  progress: number
}

interface StoryComplete {
  audioUrl: string
  audioChunks: string[]
  duration: number
}

interface UseStoryWebSocketOptions {
  storyId: string | null
  enabled: boolean
  onProgress?: (progress: StoryProgress) => void
  onComplete?: (data: StoryComplete) => void
  onError?: (message: string) => void
}

export function useStoryWebSocket({
  storyId,
  enabled,
  onProgress,
  onComplete,
  onError,
}: UseStoryWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (!storyId || !enabled) {
      cleanup()
      return
    }

    // Determine WebSocket URL based on environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws"
    const wsHost = apiUrl.replace(/^https?:\/\//, "")
    const wsUrl = `${wsProtocol}://${wsHost}/ws/stories/${storyId}/progress`

    console.log("[ws] Connecting to:", wsUrl)

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log("[ws] Connected to story progress WebSocket")
          setIsConnected(true)

          // Start ping interval to keep connection alive
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("ping")
            }
          }, 25000)
        }

        ws.onmessage = (event) => {
          try {
            // Handle pong response
            if (event.data === "pong" || event.data === "ping") {
              return
            }

            const message = JSON.parse(event.data)
            console.log("[ws] Received:", message.type)

            switch (message.type) {
              case "status":
                onProgress?.({
                  status: message.data.status,
                  progress: message.data.progress,
                })
                break

              case "complete":
                onComplete?.({
                  audioUrl: message.data.audioUrl,
                  audioChunks: message.data.audioChunks,
                  duration: message.data.duration,
                })
                break

              case "error":
                onError?.(message.data.message)
                break

              case "log":
                // Logs are handled by ProcessingLogs component via Supabase Realtime
                // This is just for completeness
                break
            }
          } catch (err) {
            console.error("[ws] Failed to parse message:", err)
          }
        }

        ws.onerror = (error) => {
          console.error("[ws] WebSocket error:", error)
        }

        ws.onclose = (event) => {
          console.log("[ws] Connection closed:", event.code, event.reason)
          setIsConnected(false)

          // Clear ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current)
            pingIntervalRef.current = null
          }

          // Reconnect if not a normal closure and still enabled
          if (event.code !== 1000 && enabled) {
            console.log("[ws] Reconnecting in 3s...")
            reconnectTimeoutRef.current = setTimeout(connect, 3000)
          }
        }
      } catch (err) {
        console.error("[ws] Failed to create WebSocket:", err)
        // Fallback reconnect
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
    }

    connect()

    return cleanup
  }, [storyId, enabled, onProgress, onComplete, onError, cleanup])

  return { isConnected }
}
