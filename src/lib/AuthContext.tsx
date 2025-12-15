'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'
import { getUserById } from './database'
import type { AuthUser } from './types/auth'
import type { DatabaseUser } from '@/types/database'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  initializeAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Função helper para converter DatabaseUser em AuthUser
function convertToAuthUser(dbUser: DatabaseUser | null, supabaseUser: User | null): AuthUser | null {
  if (!dbUser || !supabaseUser) return null

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as 'aluno' | 'admin',
    accessLevel: dbUser.access_level as 'full' | 'limited',
    avatarUrl: dbUser.avatar_url || null,
    bio: dbUser.bio || null,
    level: dbUser.level,
    xp: dbUser.xp,
    xpMensal: dbUser.xp_mensal,
    coins: dbUser.coins,
    streak: dbUser.streak,
    createdAt: dbUser.created_at,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Buscar dados completos do usuário do banco
  const fetchUserData = async (supabaseUser: User | null): Promise<AuthUser | null> => {
    if (!supabaseUser) return null

    try {
      const dbUser = await getUserById(supabaseUser.id)
      
      if (!dbUser) {
        console.warn(`⚠️ Usuário ${supabaseUser.id} não encontrado na tabela users. Verifique se o usuário foi criado corretamente.`)
        // Retornar null para que o sistema saiba que precisa criar o usuário
        return null
      }
      
      return convertToAuthUser(dbUser, supabaseUser)
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  const initializeAuth = async () => {
    if (initialized) return
    
    setLoading(true)
    try {
      // Verifica se Supabase está configurado antes de usar
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const authUser = await fetchUserData(session.user)
          setUser(authUser)
        } else {
          setUser(null)
        }
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
        if (session?.user) {
          const authUser = await fetchUserData(session.user)
          setUser(authUser)
        } else {
          setUser(null)
        }
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
            // Auth state changed - buscar dados completos do usuário
            if (session?.user) {
              const authUser = await fetchUserData(session.user)
              setUser(authUser)
            } else {
              setUser(null)
            }
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