'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'

interface Profile {
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  email?: string | null
  role?: string | null
  scopus_author_id?: string | null
}


interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('first_name, middle_name, last_name, email, role, scopus_author_id')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data)
    }
  }

  // const fetchUserAndProfile = async () => {
  //   setLoading(true)
  //   try {
  //     const { data: { user } } = await supabase.auth.getUser()
  //     setUser(user ?? null)

  //     if (user) {
  //       const { data, error } = await supabase.from('users').select('first_name, middle_name, last_name, email, role, scopus_author_id').eq('id', user.id).single()
  //       if (!error && data) {
  //         setProfile({ first_name: data.first_name, middle_name: data.middle_name, last_name: data.last_name, email: data.email, role: data.role, scopus_author_id: data.scopus_author_id })
  //       } else {
  //         setProfile(null)
  //       }
  //     } else {
  //       setProfile(null)
  //     }
  //   } catch (e) {
  //     setProfile(null)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange:', event, session?.user?.id)

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        const newUser = session.user
        setUser(newUser)
        await fetchProfile(newUser.id)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    const handleStorageChange = () => {
      supabase.auth.getSession()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setUser(null)
      setProfile(null)
      return
    }
    if (session.user) {
      setUser(session.user)
      await fetchProfile(session.user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthProvider
