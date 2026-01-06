import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let browserClient: ReturnType<typeof createSupabaseClient> | null = null
let storageAvailable: boolean | null = null

function checkStorageAvailability(): boolean {
  if (typeof window === "undefined") return false
  if (storageAvailable !== null) return storageAvailable

  try {
    // Use a getter to avoid immediate property access errors
    const storage = "localStorage" in window ? window.localStorage : null
    if (!storage) {
      storageAvailable = false
      return false
    }
    const test = "__storage_test__"
    storage.setItem(test, test)
    storage.removeItem(test)
    storageAvailable = true
    return true
  } catch {
    storageAvailable = false
    return false
  }
}

try {
  if (typeof window !== "undefined") {
    checkStorageAvailability()
  }
} catch {
  storageAvailable = false
}

const memoryStorage: Record<string, string> = {}

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return memoryStorage[key] ?? null
    if (storageAvailable === false) return memoryStorage[key] ?? null

    try {
      const storage = "localStorage" in window ? window.localStorage : null
      if (storage) return storage.getItem(key)
    } catch {
      // Silently fall through
    }
    return memoryStorage[key] ?? null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") {
      memoryStorage[key] = value
      return
    }
    if (storageAvailable === false) {
      memoryStorage[key] = value
      return
    }

    try {
      const storage = "localStorage" in window ? window.localStorage : null
      if (storage) {
        storage.setItem(key, value)
        return
      }
    } catch {
      // Silently fall through
    }
    memoryStorage[key] = value
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") {
      delete memoryStorage[key]
      return
    }
    if (storageAvailable === false) {
      delete memoryStorage[key]
      return
    }

    try {
      const storage = "localStorage" in window ? window.localStorage : null
      if (storage) {
        storage.removeItem(key)
        return
      }
    } catch {
      // Silently fall through
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

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return createMockClient()
  }

  if (typeof window !== "undefined") {
    if (browserClient) return browserClient

    const canUseStorage = storageAvailable === true

    try {
      browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: canUseStorage,
          autoRefreshToken: canUseStorage,
          detectSessionInUrl: canUseStorage,
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
