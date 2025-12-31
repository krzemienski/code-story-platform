"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Settings, LogOut, Menu, X, Headphones, Compass, Github, Search, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import type { Profile } from "@/lib/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { setDemoMode } from "@/lib/demo-mode"
import { Input } from "@/components/ui/input"

interface DashboardNavProps {
  user: SupabaseUser
  profile: Profile | null
  isDemo?: boolean
}

export function DashboardNav({ user, profile, isDemo }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSignOut = async () => {
    if (isDemo) {
      setDemoMode(false)
      router.push("/")
      router.refresh()
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const navItems = [
    { href: "/dashboard", label: "My Stories", icon: Headphones },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/docs", label: "Docs", icon: BookOpen },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Center section: Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search stories, repos, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-secondary/50 border-transparent focus:border-border"
            />
          </div>
        </form>

        {/* Right section: Actions + Profile */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/codestory/codestory"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>

          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/">
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-500 ring-2 ring-emerald-500/20 transition-all hover:ring-emerald-500/40">
                {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-foreground">{profile?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {isDemo && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                    Demo Mode
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <Headphones className="mr-2 h-4 w-4" />
                  My Stories
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isDemo ? "Exit Demo" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-b border-border bg-background transition-all duration-300 md:hidden",
          mobileMenuOpen ? "max-h-80" : "max-h-0 border-b-0",
        )}
      >
        <div className="flex flex-col gap-2 p-4">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </form>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          <a
            href="https://github.com/codestory/codestory"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>

          <Button asChild size="sm" className="mt-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
