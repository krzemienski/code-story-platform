"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { UserMenu } from "@/components/user-menu"
import { Menu, X, Sparkles, Headphones, Radio } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useAudioPlayerContext } from "@/lib/audio-player-context"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { currentItem, isPlaying, setPlayerExpanded, isPlayerVisible } = useAudioPlayerContext()

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | undefined

    getSupabaseClient().then((supabase) => {
      if (!mounted) return

      supabase.auth.getUser().then(({ data }) => {
        if (mounted) setUser(data.user)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) setUser(session?.user ?? null)
      })

      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  const isActive = (path: string) => pathname === path

  const handleCreateTale = (e: React.MouseEvent) => {
    e.preventDefault()
    if (pathname === "/") {
      // Already on home page, just scroll to section
      const element = document.getElementById("generate")
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      // Navigate to home page with hash
      router.push("/#generate")
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/discover"
              className={cn(
                "px-3 py-2 text-sm transition-colors rounded-lg",
                isActive("/discover")
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
            >
              Tales
            </Link>
            <Link
              href="/discover?tab=trending"
              className={cn(
                "px-3 py-2 text-sm transition-colors rounded-lg",
                pathname.includes("trending")
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
            >
              Trending
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={cn(
                  "px-3 py-2 text-sm transition-colors rounded-lg",
                  isActive("/dashboard")
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                My Tales
              </Link>
            )}
          </div>
        </div>

        {/* Desktop right section */}
        <div className="hidden items-center gap-3 md:flex">
          {isPlayerVisible && currentItem && (
            <button
              onClick={() => setPlayerExpanded(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors",
                isPlaying
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground border border-border",
              )}
            >
              {isPlaying && (
                <span className="flex items-center gap-[2px]">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-primary rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.1}s`, height: "12px" }}
                    />
                  ))}
                </span>
              )}
              {!isPlaying && <Radio className="h-3 w-3" />}
              <span className="max-w-[120px] truncate">{currentItem.title}</span>
            </button>
          )}
          <Link
            href="https://github.com/krzemienski/code-story-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </Link>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleCreateTale}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Create Tale
          </Button>
          <UserMenu />
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden text-muted-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-b border-border/50 bg-background transition-all duration-300 md:hidden",
          mobileMenuOpen ? "max-h-80" : "max-h-0 border-b-0",
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {isPlayerVisible && currentItem && (
            <button
              onClick={() => {
                setPlayerExpanded(true)
                setMobileMenuOpen(false)
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors mb-2",
                isPlaying ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
              )}
            >
              {isPlaying ? (
                <span className="flex items-center gap-[2px]">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className="w-0.5 h-3 bg-primary rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </span>
              ) : (
                <Radio className="h-4 w-4" />
              )}
              <span className="truncate">Now Playing: {currentItem.title}</span>
            </button>
          )}
          <Link
            href="/discover"
            className={cn(
              "px-3 py-2.5 text-sm rounded-lg transition-colors",
              isActive("/discover") ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Headphones className="inline-block mr-2 h-4 w-4" />
            Tales
          </Link>
          <Link
            href="/discover?tab=trending"
            className="px-3 py-2.5 text-sm text-muted-foreground rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            Trending
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className={cn(
                "px-3 py-2.5 text-sm rounded-lg transition-colors",
                isActive("/dashboard") ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              My Tales
            </Link>
          )}
          <Link
            href="https://github.com/krzemienski/code-story-platform"
            target="_blank"
            className="px-3 py-2.5 text-sm text-muted-foreground rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            GitHub
          </Link>
          <div className="pt-3 mt-2 border-t border-border">
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleCreateTale}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Create Tale
            </Button>
          </div>
          <div className="pt-2">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
