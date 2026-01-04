import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return mock client during build time if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            order: () => ({ limit: async () => ({ data: [], error: null }) }),
            data: null,
            error: null,
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
            data: [],
            error: null,
          }),
          data: null,
          error: null,
        }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    } as unknown as ReturnType<typeof createSupabaseClient>
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
