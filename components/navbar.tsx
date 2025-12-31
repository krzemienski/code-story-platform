"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { UserMenu } from "@/components/user-menu"
import { Menu, X, Sparkles, Headphones } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const isActive = (path: string) => pathname === path

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
              Stories
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
                My Stories
              </Link>
            )}
          </div>
        </div>

        {/* Desktop right section */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="https://github.com/krzemienski/codestory"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </Link>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link href="/#generate">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Generate
            </Link>
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
          <Link
            href="/discover"
            className={cn(
              "px-3 py-2.5 text-sm rounded-lg transition-colors",
              isActive("/discover") ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Headphones className="inline-block mr-2 h-4 w-4" />
            Stories
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
              My Stories
            </Link>
          )}
          <Link
            href="https://github.com/krzemienski/codestory"
            target="_blank"
            className="px-3 py-2.5 text-sm text-muted-foreground rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            GitHub
          </Link>
          <div className="pt-3 mt-2 border-t border-border">
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/#generate" onClick={() => setMobileMenuOpen(false)}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate
              </Link>
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
