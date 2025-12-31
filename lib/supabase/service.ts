// Service role client for server-side operations that bypass RLS
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let serviceClient: ReturnType<typeof createSupabaseClient> | null = null

export function createServiceClient() {
  if (serviceClient) return serviceClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials")
  }

  serviceClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceClient
}
