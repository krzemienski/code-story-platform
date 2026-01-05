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

  // Get the auth token from cookies
  const authCookie =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get(`sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`)?.value

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authCookie ? { Authorization: `Bearer ${authCookie}` } : {},
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    // Check for demo mode cookie
    const isDemoMode = request.cookies.get("codetales_demo_mode")?.value === "true"
    if (!isDemoMode) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users from auth pages to dashboard
  if (request.nextUrl.pathname.startsWith("/auth/") && !request.nextUrl.pathname.includes("/callback") && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
