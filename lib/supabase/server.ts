import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return mock client during build time if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    const createChainableMock = () => {
      const chainable: any = {
        eq: () => chainable,
        neq: () => chainable,
        gt: () => chainable,
        gte: () => chainable,
        lt: () => chainable,
        lte: () => chainable,
        like: () => chainable,
        ilike: () => chainable,
        is: () => chainable,
        in: () => chainable,
        contains: () => chainable,
        containedBy: () => chainable,
        order: () => chainable,
        limit: () => chainable,
        range: () => chainable,
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: [], error: null }),
        data: [],
        error: null,
      }
      return chainable
    }

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => createChainableMock(),
        insert: () => ({ select: () => createChainableMock(), data: null, error: null }),
        update: () => ({ eq: () => createChainableMock(), data: null, error: null }),
        delete: () => ({ eq: () => createChainableMock(), data: null, error: null }),
        upsert: () => ({ select: () => createChainableMock(), data: null, error: null }),
      }),
      rpc: async () => ({ data: null, error: null }),
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          download: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as unknown as ReturnType<typeof createSupabaseClient>
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
