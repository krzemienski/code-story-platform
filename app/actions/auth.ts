"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Create server-side Supabase client with cookie handling
async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from Server Component - ignore
        }
      },
    },
  })
}

// Sign in with email and password
export async function signInWithPassword(email: string, password: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Invalid email or password" }
      }
      return { error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[Auth] Sign in error:", err)
    return { error: "Failed to sign in. Please try again." }
  }
}

// Sign up with email and password
export async function signUpWithPassword(email: string, password: string) {
  try {
    const supabase = await createClient()

    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://codetale.ai"

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectUrl}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "This email is already registered" }
      }
      return { error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[Auth] Sign up error:", err)
    return { error: "Failed to create account. Please try again." }
  }
}

// Sign out
export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  } catch (err) {
    console.error("[Auth] Sign out error:", err)
    redirect("/")
  }
}

// Get current user
export async function getUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return { user: null, error: error.message }
    }

    return { user, error: null }
  } catch (err) {
    console.error("[Auth] Get user error:", err)
    return { user: null, error: "Failed to get user" }
  }
}

// Get OAuth sign-in URL
export async function getOAuthUrl(provider: "github" | "google") {
  try {
    const supabase = await createClient()

    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://codetale.ai"

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${redirectUrl}/auth/callback`,
      },
    })

    if (error) {
      return { url: null, error: error.message }
    }

    return { url: data.url, error: null }
  } catch (err) {
    console.error("[Auth] OAuth error:", err)
    return { url: null, error: "Failed to initialize OAuth" }
  }
}
