'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  initializeAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const initializeAuth = async () => {
    if (initialized) return
    
    setLoading(true)
    try {
      // Verifica se Supabase está configurado antes de usar
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } else {
        // Modo mockado - não há usuário autenticado mas não quebra
        setUser(null)
      }
      setInitialized(true)
    } catch (error) {
      // Error getting initial session - modo mockado continua funcionando
      setUser(null)
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } else {
        setUser(null)
      }
    } catch (error) {
      // Error refreshing session
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        await supabase.auth.signOut()
      }
      setUser(null)
    } catch (error) {
      // Error signing out
      setUser(null)
    }
  }

  useEffect(() => {
    let mounted = true

    // Listen for auth changes only after initialization and if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (mounted && initialized) {
            // Auth state changed
            setUser(session?.user ?? null)
          }
        }
      )

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }

    return () => {
      mounted = false
    }
  }, [initialized])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshSession, initializeAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 