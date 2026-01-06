"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Logo } from "@/components/logo"
import { setDemoMode } from "@/lib/demo-mode"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const searchParams = useSearchParams()

  const redirectTo = searchParams.get("redirect") || "/dashboard"

  useEffect(() => {
    const logs: string[] = []

    // Check if we're in browser
    if (typeof window === "undefined") {
      logs.push("Running on server")
      return
    }

    logs.push("Running in browser")

    // Check localStorage availability
    try {
      window.localStorage.setItem("__login_test__", "1")
      window.localStorage.removeItem("__login_test__")
      logs.push("localStorage: available")
    } catch (e) {
      logs.push(`localStorage: BLOCKED - ${e instanceof Error ? e.message : "Unknown error"}`)
      setWarning(
        "Browser storage is blocked. This may be caused by a browser extension (like YoinkUI). Authentication may not persist across page reloads.",
      )
    }

    // Check for blocking extensions
    const extensionIndicators = [
      document.querySelector("[data-yoinkui]"),
      (window as unknown as Record<string, unknown>).YoinkUI,
    ].filter(Boolean)

    if (extensionIndicators.length > 0) {
      logs.push("Detected: YoinkUI extension")
    }

    setDebugInfo(logs)
    console.log("[v0] Login form debug:", logs)
  }, [])

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setError(null)

      console.log("[v0] Login attempt started")

      try {
        const { getSupabaseClient } = await import("@/lib/supabase/client")
        console.log("[v0] Getting Supabase client...")
        const supabase = await getSupabaseClient()
        console.log("[v0] Got Supabase client, attempting sign in...")

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        console.log("[v0] Sign in response:", {
          hasUser: !!data?.user,
          hasSession: !!data?.session,
          error: authError?.message,
        })

        if (authError) {
          console.log("[v0] Auth error:", authError.message)
          throw authError
        }

        if (!data?.user) {
          console.log("[v0] No user returned")
          throw new Error("No user returned from authentication")
        }

        console.log("[v0] Login successful, redirecting to:", redirectTo)
        window.location.href = redirectTo
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred during sign in"
        console.log("[v0] Login error:", errorMessage)
        setError(errorMessage)
        setIsLoading(false)
      }
    },
    [email, password, redirectTo],
  )

  const handleDemoMode = useCallback(() => {
    console.log("[v0] Entering demo mode")
    setDemoMode(true)
    window.location.href = redirectTo
  }, [redirectTo])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-sm">
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to your Code Tales account</CardDescription>
          </CardHeader>
          <CardContent>
            {warning && (
              <Alert variant="default" className="mb-4 border-yellow-500/50 bg-yellow-500/10">
                <Info className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-yellow-500">Storage Blocked</AlertTitle>
                <AlertDescription className="text-yellow-500/80 text-sm">
                  {warning}
                  <br />
                  <span className="text-xs mt-1 block">Try disabling browser extensions or using incognito mode.</span>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">
                      Password
                    </Label>
                    <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary/10 bg-transparent"
                  onClick={handleDemoMode}
                >
                  Try Demo Mode
                </Button>
              </div>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-primary underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </div>

              {debugInfo.length > 0 && process.env.NODE_ENV === "development" && (
                <div className="mt-4 p-2 bg-muted/50 rounded text-xs text-muted-foreground font-mono">
                  <div className="font-semibold mb-1">Debug Info:</div>
                  {debugInfo.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
