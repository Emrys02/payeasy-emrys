import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Server-side Supabase client for use in Next.js Server Components and API routes
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase server environment variables.'
    )
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll: async () => {
        const cookieStore = await cookies()
        return cookieStore.getAll()
      },
      setAll: async (cookiesToSet) => { // Renamed from 'cookies' to avoid shadow error
        const cookieStore = await cookies()
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Server-side middleware client for use in middleware
// Fixed: Using NextRequest and NextResponse instead of Request/Response
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables.'
    )
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => {
        return request.cookies.getAll()
      },
      setAll: (cookiesToSet) => { // Renamed parameter to avoid shadowing
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })
}