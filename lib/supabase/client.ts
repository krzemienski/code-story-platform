let browserClient: ReturnType<typeof import("@supabase/supabase-js").createClient> | null = null
let clientPromise: Promise<ReturnType<typeof import("@supabase/supabase-js").createClient>> | null = null
let storagePatched = false

const memoryStorage: Record<string, string> = {}

function patchGlobalStorage() {
  if (typeof window === "undefined" || storagePatched) return

  try {
    // Test if localStorage works
    window.localStorage.setItem("__test__", "1")
    window.localStorage.removeItem("__test__")
    console.log("[v0] localStorage is available")
  } catch (e) {
    console.log("[v0] localStorage blocked, patching window.localStorage")
    // Replace localStorage with memory storage
    try {
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: (key: string) => {
            console.log("[v0] localStorage.getItem:", key)
            return memoryStorage[key] ?? null
          },
          setItem: (key: string, value: string) => {
            console.log("[v0] localStorage.setItem:", key)
            memoryStorage[key] = value
          },
          removeItem: (key: string) => {
            console.log("[v0] localStorage.removeItem:", key)
            delete memoryStorage[key]
          },
          clear: () => {
            console.log("[v0] localStorage.clear")
            Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k])
          },
          key: (index: number) => Object.keys(memoryStorage)[index] ?? null,
          get length() {
            return Object.keys(memoryStorage).length
          },
        },
        writable: true,
        configurable: true,
      })
      console.log("[v0] localStorage patched successfully")
    } catch (patchError) {
      console.log("[v0] Could not patch localStorage:", patchError)
    }
  }
  storagePatched = true
}

if (typeof window !== "undefined") {
  patchGlobalStorage()
}

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
  console.log("[v0] Creating mock Supabase client")
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: {
          message:
            "Storage access blocked by browser extension. Please disable extensions like YoinkUI or try incognito mode.",
        },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: {
          message:
            "Storage access blocked by browser extension. Please disable extensions like YoinkUI or try incognito mode.",
        },
      }),
      signInWithOAuth: async () => ({
        data: { provider: null, url: null },
        error: {
          message:
            "Storage access blocked by browser extension. Please disable extensions like YoinkUI or try incognito mode.",
        },
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
  console.log("[v0] getSupabaseClient called")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    console.log("[v0] Missing Supabase credentials, using mock client")
    return createMockClient()
  }

  // Server-side: always create new client without persistence
  if (typeof window === "undefined") {
    console.log("[v0] Server-side, creating non-persistent client")
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // Ensure storage is patched before creating client
  patchGlobalStorage()

  // Return cached client if available
  if (browserClient) {
    console.log("[v0] Returning cached browser client")
    return browserClient
  }

  // If already creating, wait for it
  if (clientPromise) {
    console.log("[v0] Waiting for existing client promise")
    return clientPromise
  }

  // Create the client lazily
  console.log("[v0] Creating new browser client")
  clientPromise = (async () => {
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
      console.log("[v0] Supabase module imported, creating client")
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
      console.log("[v0] Browser client created successfully")
      return browserClient
    } catch (err) {
      console.log("[v0] Error creating Supabase client:", err)
      return createMockClient()
    }
  })()

  return clientPromise
}

export function createClient(): ReturnType<typeof import("@supabase/supabase-js").createClient> {
  console.log("[v0] createClient called (sync)")

  // Ensure storage is patched
  if (typeof window !== "undefined") {
    patchGlobalStorage()
  }

  // Trigger async creation but don't wait
  if (typeof window !== "undefined" && !browserClient && !clientPromise) {
    console.log("[v0] Triggering async client creation")
    getSupabaseClient()
  }

  // Return cached client or mock
  if (browserClient) {
    console.log("[v0] Returning cached client from createClient")
    return browserClient
  }

  console.log("[v0] Returning mock client from createClient")
  return createMockClient()
}

export function clearClient() {
  console.log("[v0] Clearing cached client")
  browserClient = null
  clientPromise = null
}
