"use client"

import { createBrowserClient } from "@supabase/ssr"

const FALLBACK_SUPABASE_URL = "https://ngmknjjnmhffnxsswnha.supabase.co"
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbWtuampubWhmZm54c3N3bmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNDA3ODMsImV4cCI6MjA4MzYxNjc4M30.aGArLh89l3fuXWHUNPbePP0McIE3xVzU8qIPyBA2EqQ"

// Mock client for when env vars are missing
function createMockClient() {
  const chainable: any = {
    eq: () => chainable,
    neq: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  }

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        error: {
          message: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
      }),
      signUp: async () => ({
        error: {
          message: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
      }),
      signInWithOAuth: async () => ({
        error: {
          message: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
      }),
    },
    from: () => ({
      select: () => chainable,
      insert: () => ({ select: () => chainable }),
      update: () => ({ eq: () => chainable }),
      delete: () => ({ eq: () => chainable }),
    }),
    rpc: async () => ({ data: null, error: null }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  } as any
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY

  console.log("[v0] Creating Supabase client with URL:", supabaseUrl)

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}

export async function getSupabaseClient() {
  return createClient()
}
