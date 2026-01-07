"use client"

let browserClient: ReturnType<typeof import("@supabase/supabase-js").createClient> | null = null
let isCreating = false
let createQueue: Array<(client: ReturnType<typeof import("@supabase/supabase-js").createClient>) => void> = []

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

const STORAGE_KEY = "codetales-auth-token"

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

  if (isCreating) {
    return new Promise((resolve) => {
      createQueue.push(resolve)
    })
  }

  isCreating = true

  try {
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")

    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeStorage,
        flowType: "pkce",
        storageKey: STORAGE_KEY,
      },
    })

    // Resolve all queued requests with the same client
    createQueue.forEach((resolve) => resolve(browserClient!))
    createQueue = []

    return browserClient
  } catch (err) {
    console.error("[CodeTales] Error creating auth client:", err)
    const mockClient = createMockClient()
    createQueue.forEach((resolve) => resolve(mockClient))
    createQueue = []
    return mockClient
  } finally {
    isCreating = false
  }
}

export function createClient(): ReturnType<typeof import("@supabase/supabase-js").createClient> {
  if (typeof window !== "undefined" && !browserClient && !isCreating) {
    // Trigger async creation but don't wait
    getSupabaseClient()
  }

  // Return cached client or mock
  return browserClient || createMockClient()
}

export function clearClient() {
  browserClient = null
  isCreating = false
  createQueue = []
}
