import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let browserClient: ReturnType<typeof createSupabaseClient> | null = null

function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false
    const test = "__storage_test__"
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

function createStorageAdapter() {
  const memoryStorage: Record<string, string> = {}
  const storageAvailable = isStorageAvailable()

  return {
    getItem: (key: string): string | null => {
      if (storageAvailable) {
        try {
          return window.localStorage.getItem(key)
        } catch {
          return memoryStorage[key] ?? null
        }
      }
      return memoryStorage[key] ?? null
    },
    setItem: (key: string, value: string): void => {
      if (storageAvailable) {
        try {
          window.localStorage.setItem(key, value)
        } catch {
          memoryStorage[key] = value
        }
      } else {
        memoryStorage[key] = value
      }
    },
    removeItem: (key: string): void => {
      if (storageAvailable) {
        try {
          window.localStorage.removeItem(key)
        } catch {
          delete memoryStorage[key]
        }
      } else {
        delete memoryStorage[key]
      }
    },
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip client creation during build time if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: null }),
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
    } as unknown as ReturnType<typeof createSupabaseClient>
  }

  if (typeof window !== "undefined") {
    if (browserClient) return browserClient

    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: createStorageAdapter(),
        flowType: "pkce",
      },
    })

    return browserClient
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
