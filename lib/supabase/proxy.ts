import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip during build time
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return supabaseResponse
  }

  // Look for all possible Supabase auth cookie patterns
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0]

  // Supabase stores session in chunks for large tokens
  const authCookies = request.cookies
    .getAll()
    .filter(
      (cookie) =>
        cookie.name.startsWith(`sb-${projectRef}-auth-token`) ||
        cookie.name === "sb-access-token" ||
        (cookie.name.startsWith("sb-") && cookie.name.includes("auth")),
    )

  // Reconstruct the auth token from chunks if needed
  let authToken: string | null = null

  // Check for single token first
  const singleToken = request.cookies.get(`sb-${projectRef}-auth-token`)?.value
  if (singleToken) {
    try {
      const parsed = JSON.parse(singleToken)
      authToken = parsed.access_token
    } catch {
      authToken = singleToken
    }
  }

  // If no single token, check for chunked tokens
  if (!authToken && authCookies.length > 0) {
    // Sort chunks by name to ensure correct order
    const sortedCookies = authCookies.sort((a, b) => a.name.localeCompare(b.name))
    const combinedValue = sortedCookies.map((c) => c.value).join("")

    try {
      const parsed = JSON.parse(combinedValue)
      authToken = parsed.access_token
    } catch {
      // If parsing fails, it might be the raw token
      if (sortedCookies.length === 1) {
        authToken = sortedCookies[0].value
      }
    }
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    // Check for demo mode cookie
    const isDemoMode = request.cookies.get("codetales_demo_mode")?.value === "true"
    if (!isDemoMode) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users from auth pages to dashboard
  if (request.nextUrl.pathname.startsWith("/auth/") && !request.nextUrl.pathname.includes("/callback") && user) {
    const url = request.nextUrl.clone()
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard"
    url.pathname = redirectTo
    url.search = ""
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
