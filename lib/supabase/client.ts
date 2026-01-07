"use client"

let browserClient: ReturnType<typeof import("@supabase/supabase-js").createClient> | null = null
let clientPromise: Promise<ReturnType<typeof import("@supabase/supabase-js").createClient>> | null = null

// Memory storage - never touches localStorage
const memoryStorage: Record<string, string> = {}

const safeStorage = {
  getItem: (key: string): string | null => {
    return memoryStorage[key] ?? null
  },
  setItem: (key: string, value: string): void => {
    memoryStorage[key] = value
  },
  removeItem: (key: string): void => {
    delete memoryStorage[key]
  },
}

function createMockClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Authentication unavailable. Try disabling browser extensions or use incognito mode." },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Authentication unavailable. Try disabling browser extensions or use incognito mode." },
      }),
      signInWithOAuth: async () => ({
        data: { provider: null, url: null },
        error: { message: "Authentication unavailable. Try disabling browser extensions or use incognito mode." },
      }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: async () => ({ data: { user: null }, error: null }),
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
    rpc: async () => ({ data: null, error: null }),
  } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>
}

export async function getSupabaseClient(): Promise<ReturnType<typeof import("@supabase/supabase-js").createClient>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return createMockClient()
  }

  // Server-side: always create new client without persistence
  if (typeof window === "undefined") {
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // Return cached client if available
  if (browserClient) {
    return browserClient
  }

  // If already creating, wait for it
  if (clientPromise) {
    return clientPromise
  }

  // Create the client lazily with memory-only storage
  clientPromise = (async () => {
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")

      browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: safeStorage,
          flowType: "pkce",
          storageKey: "sb-auth-token",
        },
      })

      return browserClient
    } catch (err) {
      console.error("[CodeTales] Error creating auth client:", err)
      return createMockClient()
    }
  })()

  return clientPromise
}

export function createClient(): ReturnType<typeof import("@supabase/supabase-js").createClient> {
  // Trigger async creation but don't wait
  if (typeof window !== "undefined" && !browserClient && !clientPromise) {
    getSupabaseClient()
  }

  // Return cached client or mock
  if (browserClient) {
    return browserClient
  }

  return createMockClient()
}

export function clearClient() {
  browserClient = null
  clientPromise = null
}
