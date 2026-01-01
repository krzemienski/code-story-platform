"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthModal } from "@/components/auth-modal"
import { LogOut, LayoutDashboard, Settings, Headphones } from "lucide-react"
import Link from "next/link"

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin")

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const openSignIn = () => {
    setAuthTab("signin")
    setShowAuthModal(true)
  }

  const openSignUp = () => {
    setAuthTab("signup")
    setShowAuthModal(true)
  }

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={openSignIn} className="text-zinc-400 hover:text-white">
            Sign In
          </Button>
          <Button size="sm" onClick={openSignUp}>
            Sign Up
          </Button>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultTab={authTab} />
      </>
    )
  }

  const initials =
    user.user_metadata?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    user.email?.[0].toUpperCase() ||
    "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.user_metadata?.avatar_url || "/placeholder.svg"}
              alt={user.user_metadata?.name || "User"}
            />
            <AvatarFallback className="bg-emerald-600 text-white">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white">{user.user_metadata?.name || "User"}</p>
            <p className="text-xs text-zinc-400">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem asChild className="text-zinc-300 focus:text-white focus:bg-zinc-800 cursor-pointer">
          <Link href="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-zinc-300 focus:text-white focus:bg-zinc-800 cursor-pointer">
          <Link href="/dashboard/stories">
            <Headphones className="w-4 h-4 mr-2" />
            My Stories
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-zinc-300 focus:text-white focus:bg-zinc-800 cursor-pointer">
          <Link href="/dashboard/settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-400 focus:text-red-300 focus:bg-zinc-800 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
