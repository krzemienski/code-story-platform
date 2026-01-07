"use client"

let browserClient: ReturnType<typeof import("@supabase/supabase-js").createClient> | null = null
let clientCreationPromise: Promise<ReturnType<typeof import("@supabase/supabase-js").createClient>> | null = null
let storageAccessRequested = false

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

async function requestStorageAccess(): Promise<boolean> {
  if (storageAccessRequested) return true
  storageAccessRequested = true

  if (typeof window === "undefined") return false

  try {
    // Check if we're in an iframe
    if (window.self !== window.top) {
      // Check if Storage Access API is available
      if (document.requestStorageAccess) {
        const hasAccess = (await document.hasStorageAccess?.()) ?? false
        if (!hasAccess) {
          // Note: This will only work after user interaction
          // We try anyway in case it was previously granted
          try {
            await document.requestStorageAccess()
            return true
          } catch {
            // Expected to fail without user gesture - that's OK
            return false
          }
        }
        return hasAccess
      }
    }
    return true // Not in iframe, storage should work
  } catch {
    return false
  }
}

if (typeof window !== "undefined") {
  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args[0]?.toString?.() || ""
    // Suppress storage access errors - we handle this gracefully with memory storage
    if (
      message.includes("Access to storage is not allowed") ||
      message.includes("localStorage") ||
      message.includes("storage is not allowed")
    ) {
      return
    }
    originalConsoleError.apply(console, args)
  }

  // Also suppress unhandled promise rejections for storage errors
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || event.reason?.toString?.() || ""
    if (message.includes("Access to storage is not allowed") || message.includes("storage is not allowed")) {
      event.preventDefault()
    }
  })
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
      upsert: () => ({
        select: () => ({ single: async () => ({ data: null, error: null }) }),
        data: null,
        error: null,
      }),
      delete: () => ({ eq: () => ({ data: null, error: null }), data: null, error: null }),
    }),
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>
}

const STORAGE_KEY = "codetales-session"

async function createBrowserClient(): Promise<ReturnType<typeof import("@supabase/supabase-js").createClient>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return createMockClient()
  }

  await requestStorageAccess()

  try {
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")

    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeStorage,
        flowType: "pkce",
        storageKey: STORAGE_KEY,
      },
      global: {
        fetch: (...args) => fetch(...args),
      },
    })

    return client
  } catch (err) {
    console.error("[CodeTales] Error creating auth client:", err)
    return createMockClient()
  }
}

export async function getSupabaseClient(): Promise<ReturnType<typeof import("@supabase/supabase-js").createClient>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return createMockClient()
  }

  // Server-side: always create fresh client without persistence
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

  // If creation is in progress, wait for it
  if (clientCreationPromise) {
    return clientCreationPromise
  }

  // Create the client once
  clientCreationPromise = createBrowserClient()
  browserClient = await clientCreationPromise
  clientCreationPromise = null

  return browserClient
}

export function createClient(): ReturnType<typeof import("@supabase/supabase-js").createClient> {
  // Return cached client if available
  if (browserClient) {
    return browserClient
  }

  // For synchronous calls, trigger async creation and return mock
  if (typeof window !== "undefined") {
    getSupabaseClient().catch(() => {})
  }

  return createMockClient()
}

export function clearClient() {
  browserClient = null
  clientCreationPromise = null
}
