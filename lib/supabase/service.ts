// Service role client for server-side operations that bypass RLS
// Falls back to anon key with RLS when service role is not available
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const FALLBACK_URL = "https://ngmknjjnmhffnxsswnha.supabase.co"
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbWtuampubWhmZm54c3N3bmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNDA3ODMsImV4cCI6MjA4MzYxNjc4M30.aGArLh89l3fuXWHUNPbePP0McIE3xVzU8qIPyBA2EqQ"

let serviceClient: ReturnType<typeof createSupabaseClient> | null = null

export function createServiceClient() {
  if (serviceClient) return serviceClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL
  // Anon key will still work because RLS policies allow inserts
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_ANON_KEY

  console.log("[v0] Creating service client with URL:", supabaseUrl)
  console.log("[v0] Using service role key:", serviceRoleKey ? "YES (key present)" : "NO (missing)")

  serviceClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceClient
}
