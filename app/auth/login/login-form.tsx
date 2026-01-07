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
import { AlertCircle } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  const redirectTo = searchParams.get("redirect") || "/dashboard"

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason)
      if (message.includes("storage") || message.includes("Access") || message.includes("not allowed")) {
        event.preventDefault()
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection)
  }, [])

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setError(null)

      try {
        const { getSupabaseClient } = await import("@/lib/supabase/client")
        const supabase = await getSupabaseClient()

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          throw authError
        }

        if (!data?.user) {
          throw new Error("No user returned from authentication")
        }

        window.location.href = redirectTo
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred during sign in"
        setError(errorMessage)
        setIsLoading(false)
      }
    },
    [email, password, redirectTo],
  )

  const handleDemoMode = useCallback(() => {
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
