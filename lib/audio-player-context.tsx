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
  const [chunkDurations, setChunkDurations] = useState<number[]>([])

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = "metadata"

      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      })

      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
          setIsBuffering(false)
        }
      })

      audioRef.current.addEventListener("ended", () => {
        // Handle chunk or track ending
        handleTrackEnded()
      })

      audioRef.current.addEventListener("waiting", () => setIsBuffering(true))
      audioRef.current.addEventListener("canplay", () => setIsBuffering(false))
      audioRef.current.addEventListener("play", () => setIsPlaying(true))
      audioRef.current.addEventListener("pause", () => setIsPlaying(false))
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
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
        audioRef.current.play()
      }
    } else if (queueIndex < queue.length - 1) {
      // Play next in queue
      const nextIndex = queueIndex + 1
      setQueueIndex(nextIndex)
      playItem(queue[nextIndex])
    } else {
      // End of queue
      setIsPlaying(false)
    }
  }, [currentItem, currentChunkIndex, queue, queueIndex])

  const playItem = useCallback(
    (item: QueueItem) => {
      setCurrentItem(item)
      setCurrentChunkIndex(0)
      setIsPlayerVisible(true)

      if (audioRef.current) {
        const audioSrc = item.audioChunks?.[0] || item.audioUrl
        if (audioSrc) {
          audioRef.current.src = audioSrc
          audioRef.current.playbackRate = playbackRate
          audioRef.current.volume = isMuted ? 0 : volume
          audioRef.current.play().catch(console.error)
        }
      }
    },
    [playbackRate, volume, isMuted],
  )

  const play = useCallback(
    (item?: QueueItem) => {
      if (item) {
        // Add to queue and play
        const existingIndex = queue.findIndex((q) => q.id === item.id)
        if (existingIndex >= 0) {
          setQueueIndex(existingIndex)
          playItem(queue[existingIndex])
        } else {
          setQueue((prev) => [...prev, item])
          setQueueIndex(queue.length)
          playItem(item)
        }
      } else if (audioRef.current && currentItem) {
        audioRef.current.play().catch(console.error)
      }
    },
    [queue, currentItem, playItem],
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
      playItem(queue[nextIndex])
    }
  }, [queueIndex, queue, playItem])

  const skipPrevious = useCallback(() => {
    if (currentTime > 3) {
      seek(0)
    } else if (queueIndex > 0) {
      const prevIndex = queueIndex - 1
      setQueueIndex(prevIndex)
      playItem(queue[prevIndex])
    }
  }, [queueIndex, queue, currentTime, seek, playItem])

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
      setQueue((prev) => {
        if (prev.find((q) => q.id === item.id)) return prev
        return [...prev, item]
      })
      if (!currentItem) {
        setQueueIndex(0)
        playItem(item)
      }
    },
    [currentItem, playItem],
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
        playItem(queue[index])
      }
    },
    [queue, playItem],
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
