import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let browserClient: ReturnType<typeof createSupabaseClient> | null = null
let storageAvailable: boolean | null = null

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false
  if (storageAvailable !== null) return storageAvailable

  try {
    if (!window.localStorage) {
      storageAvailable = false
      return false
    }
    const test = "__storage_test__"
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    storageAvailable = true
    return true
  } catch {
    storageAvailable = false
    return false
  }
}

const memoryStorage: Record<string, string> = {}

const safeStorage = {
  getItem: (key: string): string | null => {
    if (storageAvailable) {
      try {
        return window.localStorage.getItem(key)
      } catch {
        // Fall through to memory
      }
    }
    return memoryStorage[key] ?? null
  },
  setItem: (key: string, value: string): void => {
    if (storageAvailable) {
      try {
        window.localStorage.setItem(key, value)
        return
      } catch {
        // Fall through to memory
      }
    }
    memoryStorage[key] = value
  },
  removeItem: (key: string): void => {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(key)
        return
      } catch {
        // Fall through to memory
      }
    }
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
        error: { message: "Storage access is restricted in this context" },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Storage access is restricted in this context" },
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
  } as unknown as ReturnType<typeof createSupabaseClient>
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip client creation during build time if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return createMockClient()
  }

  if (typeof window !== "undefined") {
    if (browserClient) return browserClient

    const canUseStorage = isStorageAvailable()

    try {
      browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: canUseStorage,
          autoRefreshToken: canUseStorage,
          detectSessionInUrl: true,
          storage: safeStorage,
          flowType: "pkce",
        },
      })

      return browserClient
    } catch (error) {
      console.warn("[v0] Supabase client creation failed, using mock client:", error)
      return createMockClient()
    }
  }

  // Server-side: always create new client (no singleton)
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function clearClient() {
  browserClient = null
}
