import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function createChainableMock(): any {
  const chainable: any = {
    select: () => chainable,
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
    range: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
    data: [],
    error: null,
  }
  return chainable
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => createChainableMock(),
      rpc: async () => ({ data: null, error: null }),
    } as unknown as ReturnType<typeof createSupabaseClient>
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
