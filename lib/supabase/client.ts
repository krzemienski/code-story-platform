import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip client creation during build time if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'placeholder') {
    // Return a mock client that does nothing during build
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
