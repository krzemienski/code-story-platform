import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (typeof window === "undefined") {
    // Server-side: use singleton
    if (client) return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip client creation during build time if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    // Return a mock client that does nothing during build
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: null, error: null }), data: null, error: null }),
          order: () => ({ limit: async () => ({ data: [], error: null }) }),
          data: null,
          error: null,
        }),
        insert: () => ({
          select: () => ({ single: async () => ({ data: null, error: null }) }),
          data: null,
          error: null,
        }),
        update: () => ({ eq: () => ({ data: null, error: null }), data: null, error: null }),
        delete: () => ({ eq: () => ({ data: null, error: null }), data: null, error: null }),
      }),
    } as unknown as ReturnType<typeof createSupabaseClient>
  }

  const newClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  if (typeof window === "undefined") {
    client = newClient
  }

  return newClient
}

export function clearClient() {
  client = null
}
