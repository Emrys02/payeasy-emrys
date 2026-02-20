import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client with anon key (respects RLS)
// This is used in Next.js client components and browser context
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton instance for client-side usage
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient()
  }
  return supabaseClientInstance
}
