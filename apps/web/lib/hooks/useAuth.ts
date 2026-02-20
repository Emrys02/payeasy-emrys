'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

/**
 * Hook to get the current authenticated user
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = getClient()
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser()
        if (getUserError) throw getUserError
        setUser(user)
      } catch (err) {
        const errorMessage = err instanceof Error ? err : new Error('Failed to fetch user')
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  return { user, loading, error }
}

/**
 * Hook to handle user sign up
 */
export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const signUp = useCallback(
    async (email: string, password: string, options?: { redirectTo?: string }) => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getClient()
        const { error: signupError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: options?.redirectTo,
          },
        })
        if (signupError) throw signupError
        return data
      } catch (err) {
        const errorMessage = err instanceof Error ? err : new Error('Sign up failed')
        setError(errorMessage)
        throw errorMessage
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { signUp, loading, error }
}

/**
 * Hook to handle user sign in
 */
export function useSignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getClient()
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.push('/dashboard')
        return data
      } catch (err) {
        const errorMessage = err instanceof Error ? err : new Error('Sign in failed')
        setError(errorMessage)
        throw errorMessage
      } finally {
        setLoading(false)
      }
    },
    [router]
  )

  return { signIn, loading, error }
}

/**
 * Hook to handle user sign out
 */
export function useSignOut() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getClient()
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      router.push('/')
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Sign out failed')
      setError(errorMessage)
      throw errorMessage
    } finally {
      setLoading(false)
    }
  }, [router])

  return { signOut, loading, error }
}

/**
 * Hook to listen for auth state changes
 * Note: Pass callback wrapped in useCallback to avoid unnecessary re-subscriptions
 */
export function useAuthStateChange(callback?: (user: User | null) => void) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = getClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      setUser(user)
      callback?.(user)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      callback?.(authUser)
    })

    return () => {
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return user
}
