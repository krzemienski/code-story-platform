"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Github, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface NavbarProps {
  user?: { email: string } | null
}

export function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Docs
            </Link>
            <Link href="/api" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              API
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href="https://github.com/codestory/codestory"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            <span>Star on GitHub</span>
          </a>
          {user ? (
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Try Free</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-b border-border/40 bg-background transition-all duration-300 md:hidden",
          mobileMenuOpen ? "max-h-80" : "max-h-0 border-b-0",
        )}
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          <Link href="/#features" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
            Features
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
            Docs
          </Link>
          <Link href="/api" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
            API
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
            Pricing
          </Link>
          <div className="flex flex-col gap-2 pt-4">
            {user ? (
              <Button asChild className="w-full">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/auth/sign-up">Try Free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
