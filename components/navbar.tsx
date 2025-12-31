"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { UserMenu } from "@/components/user-menu"
import { Github, Menu, X, Compass } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/discover"
              className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <Compass className="h-4 w-4" />
              Discover
            </Link>
            <Link href="/docs" className="text-sm text-zinc-400 transition-colors hover:text-white">
              Docs
            </Link>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href="https://github.com/codestory/codestory"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <UserMenu />
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden text-zinc-400"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-b border-zinc-800/50 bg-zinc-950 transition-all duration-300 md:hidden",
          mobileMenuOpen ? "max-h-60" : "max-h-0 border-b-0",
        )}
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          <Link
            href="/discover"
            className="flex items-center gap-2 text-sm text-zinc-400"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Compass className="h-4 w-4" />
            Discover
          </Link>
          <Link href="/docs" className="text-sm text-zinc-400" onClick={() => setMobileMenuOpen(false)}>
            Docs
          </Link>
          <a
            href="https://github.com/codestory/codestory"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-zinc-400"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <div className="pt-4 border-t border-zinc-800">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
