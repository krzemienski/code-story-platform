import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const FALLBACK_SUPABASE_URL = "https://ngmknjjnmhffnxsswnha.supabase.co"
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbWtuampubWhmZm54c3N3bmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNDA3ODMsImV4cCI6MjA4MzYxNjc4M30.aGArLh89l3fuXWHUNPbePP0McIE3xVzU8qIPyBA2EqQ"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
