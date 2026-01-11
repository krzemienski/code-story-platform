"use client"

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react"

export interface QueueItem {
  id: string
  title: string
  subtitle?: string
  repoName?: string
  audioUrl?: string
  audioChunks?: string[]
  duration?: number
  coverUrl?: string
}

interface AudioPlayerContextType {
  // Current playback
  currentItem: QueueItem | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isBuffering: boolean

  // Queue
  queue: QueueItem[]
  queueIndex: number

  // Controls
  play: (item?: QueueItem) => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setPlaybackRate: (rate: number) => void
  skipNext: () => void
  skipPrevious: () => void
  skipForward: (seconds?: number) => void
  skipBackward: (seconds?: number) => void

  // Queue management
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  playFromQueue: (index: number) => void

  // UI
  isPlayerVisible: boolean
  isPlayerExpanded: boolean
  setPlayerExpanded: (expanded: boolean) => void
  showPlayer: () => void
  hidePlayer: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null)

export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error("useAudioPlayerContext must be used within AudioPlayerProvider")
  }
  return context
}

function isSafari(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android")
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // State
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRateState] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)

  // UI
  const [isPlayerVisible, setIsPlayerVisible] = useState(false)
  const [isPlayerExpanded, setPlayerExpanded] = useState(false)

  // Chunk handling
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)

  const updateMediaSession = useCallback((item: QueueItem | null) => {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !item) return

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.title,
        artist: item.repoName || "Code Tales",
        album: "Code Tales",
        artwork: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      })
    } catch (e) {
      console.log("[v0] MediaSession metadata not supported")
    }
  }, [])

  const setupMediaSessionHandlers = useCallback(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        audioRef.current?.play()
      })
      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause()
      })
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15)
        }
      })
      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 15)
        }
      })
      navigator.mediaSession.setActionHandler("previoustrack", null)
      navigator.mediaSession.setActionHandler("nexttrack", null)
    } catch (e) {
      console.log("[v0] MediaSession handlers not fully supported")
    }
  }, [])

  const handleTrackEnded = useCallback(() => {
    // Check if there are more chunks
    if (currentItem?.audioChunks && currentChunkIndex < currentItem.audioChunks.length - 1) {
      // Play next chunk
      const nextChunkIndex = currentChunkIndex + 1
      setCurrentChunkIndex(nextChunkIndex)
      if (audioRef.current && currentItem.audioChunks[nextChunkIndex]) {
        audioRef.current.src = currentItem.audioChunks[nextChunkIndex]
        audioRef.current.play().catch(console.error)
      }
    } else if (queueIndex < queue.length - 1) {
      // Play next in queue
      const nextIndex = queueIndex + 1
      setQueueIndex(nextIndex)
      playItemInternal(queue[nextIndex])
    } else {
      // End of queue
      setIsPlaying(false)
    }
  }, [currentItem, currentChunkIndex, queue, queueIndex])

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = "metadata"

      if (isIOS() || isSafari()) {
        audioRef.current.setAttribute("playsinline", "true")
        audioRef.current.setAttribute("webkit-playsinline", "true")
      }

      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
          if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
            try {
              navigator.mediaSession.setPositionState({
                duration: audioRef.current.duration || 0,
                playbackRate: audioRef.current.playbackRate,
                position: audioRef.current.currentTime,
              })
            } catch (e) {
              // Ignore errors
            }
          }
        }
      })

      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
          setIsBuffering(false)
        }
      })

      audioRef.current.addEventListener("ended", handleTrackEnded)
      audioRef.current.addEventListener("waiting", () => setIsBuffering(true))
      audioRef.current.addEventListener("canplay", () => setIsBuffering(false))
      audioRef.current.addEventListener("play", () => setIsPlaying(true))
      audioRef.current.addEventListener("pause", () => setIsPlaying(false))

      audioRef.current.addEventListener("error", (e) => {
        const audio = e.target as HTMLAudioElement
        const error = audio?.error
        console.error("[v0] Audio error:", {
          code: error?.code,
          message: error?.message,
          src: audio?.src,
          networkState: audio?.networkState,
          readyState: audio?.readyState,
        })
        setIsBuffering(false)
        setIsPlaying(false)
      })

      // Setup media session handlers
      setupMediaSessionHandlers()
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [handleTrackEnded, setupMediaSessionHandlers])

  const playItemInternal = useCallback(
    async (item: QueueItem) => {
      const audioSrc = item.audioChunks?.[0] || item.audioUrl
      if (!audioSrc) {
        console.warn("[v0] Cannot play item - no audio URL available:", item.title)
        return
      }

      setCurrentItem(item)
      setCurrentChunkIndex(0)
      setIsPlayerVisible(true)
      updateMediaSession(item)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = audioSrc
        audioRef.current.playbackRate = playbackRate
        audioRef.current.volume = isMuted ? 0 : volume

        try {
          await audioRef.current.play()
        } catch (e) {
          console.log("[v0] Autoplay blocked, waiting for user interaction")
          setIsPlaying(false)
        }
      }
    },
    [playbackRate, volume, isMuted, updateMediaSession],
  )

  const play = useCallback(
    (item?: QueueItem) => {
      if (item) {
        // Add to queue and play
        const existingIndex = queue.findIndex((q) => q.id === item.id)
        if (existingIndex >= 0) {
          setQueueIndex(existingIndex)
          playItemInternal(queue[existingIndex])
        } else {
          setQueue((prev) => [...prev, item])
          setQueueIndex(queue.length)
          playItemInternal(item)
        }
      } else if (audioRef.current && currentItem) {
        audioRef.current.play().catch(console.error)
      }
    },
    [queue, currentItem, playItemInternal],
  )

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const setVolume = useCallback(
    (vol: number) => {
      setVolumeState(vol)
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : vol
      }
    },
    [isMuted],
  )

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (audioRef.current) {
        audioRef.current.volume = prev ? volume : 0
      }
      return !prev
    })
  }, [volume])

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }, [])

  const skipNext = useCallback(() => {
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1
      setQueueIndex(nextIndex)
      playItemInternal(queue[nextIndex])
    }
  }, [queueIndex, queue, playItemInternal])

  const skipPrevious = useCallback(() => {
    if (currentTime > 3) {
      seek(0)
    } else if (queueIndex > 0) {
      const prevIndex = queueIndex - 1
      setQueueIndex(prevIndex)
      playItemInternal(queue[prevIndex])
    }
  }, [queueIndex, queue, currentTime, seek, playItemInternal])

  const skipForward = useCallback(
    (seconds = 15) => {
      seek(Math.min(duration, currentTime + seconds))
    },
    [seek, duration, currentTime],
  )

  const skipBackward = useCallback(
    (seconds = 15) => {
      seek(Math.max(0, currentTime - seconds))
    },
    [seek, currentTime],
  )

  const addToQueue = useCallback(
    (item: QueueItem) => {
      const audioSrc = item.audioChunks?.[0] || item.audioUrl
      if (!audioSrc) {
        console.warn("[v0] Cannot add to queue - no audio URL:", item.title)
        return
      }

      setQueue((prev) => {
        if (prev.find((q) => q.id === item.id)) return prev
        return [...prev, item]
      })
      if (!currentItem) {
        setQueueIndex(0)
        playItemInternal(item)
      }
    },
    [currentItem, playItemInternal],
  )

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id))
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    setQueueIndex(-1)
    setCurrentItem(null)
    setIsPlayerVisible(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
  }, [])

  const playFromQueue = useCallback(
    (index: number) => {
      if (index >= 0 && index < queue.length) {
        setQueueIndex(index)
        playItemInternal(queue[index])
      }
    },
    [queue, playItemInternal],
  )

  const showPlayer = useCallback(() => setIsPlayerVisible(true), [])
  const hidePlayer = useCallback(() => {
    setIsPlayerVisible(false)
    pause()
  }, [pause])

  return (
    <AudioPlayerContext.Provider
      value={{
        currentItem,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isBuffering,
        queue,
        queueIndex,
        play,
        pause,
        toggle,
        seek,
        setVolume,
        toggleMute,
        setPlaybackRate,
        skipNext,
        skipPrevious,
        skipForward,
        skipBackward,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playFromQueue,
        isPlayerVisible,
        isPlayerExpanded,
        setPlayerExpanded,
        showPlayer,
        hidePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}
