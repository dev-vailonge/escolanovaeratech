'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'
import { getUserById } from './database'
import type { AuthUser } from './types/auth'
import type { DatabaseUser } from '@/types/database'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
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
  const [loading, setLoading] = useState(true) // Inicia como true para evitar flash de login
  const [initialized, setInitialized] = useState(false)

  // Buscar dados completos do usuário do banco
  // IMPORTANTE: Esta função só é chamada quando há um usuário autenticado (supabaseUser)
  // A API /api/users/create valida que o usuário existe no auth.users antes de criar
  const fetchUserData = async (supabaseUser: User | null): Promise<AuthUser | null> => {
    if (!supabaseUser) return null

    try {
      let dbUser = await getUserById(supabaseUser.id)
      
      // Se o usuário não existe na tabela users, criar automaticamente
      // SEGURANÇA: Só cria se o usuário estiver autenticado (supabaseUser existe)
      // A API valida que o ID corresponde a um usuário válido no auth.users
      if (!dbUser) {
        console.warn(`⚠️ Usuário ${supabaseUser.id} não encontrado na tabela users. Criando automaticamente...`)
        
        try {
          // Chamar API para criar o usuário e confirmar email
          // A API valida que o usuário existe no auth.users antes de criar
          const response = await fetch('/api/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || 
                    supabaseUser.user_metadata?.full_name || 
                    supabaseUser.user_metadata?.display_name ||
                    supabaseUser.email?.split('@')[0] || 
                    'Usuário',
              role: 'aluno',
              access_level: 'limited'
            }),
          })

          const result = await response.json()

          if (response.ok && result.success && result.user) {
            console.log(`✅ Usuário criado automaticamente: ${supabaseUser.email}`)
            dbUser = result.user
          } else {
            console.error('❌ Erro ao criar usuário automaticamente:', result.error)
            // Tentar buscar novamente (pode ter sido criado pelo trigger ou outra fonte)
            dbUser = await getUserById(supabaseUser.id)
            if (!dbUser) {
              return null
            }
          }
        } catch (apiError: any) {
          console.error('❌ Erro ao chamar API de criar usuário:', apiError)
          // Tentar buscar novamente (pode ter sido criado por outra fonte)
          dbUser = await getUserById(supabaseUser.id)
          if (!dbUser) {
            return null
          }
        }
      }
      
      return convertToAuthUser(dbUser, supabaseUser)
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  const initializeAuth = useCallback(async () => {
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
  }, [initialized])

  const refreshSession = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:142',message:'refreshSession called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: { session } } = await supabase.auth.getSession()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:145',message:'getSession result',data:{hasSession:!!session,hasUser:!!session?.user,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (session?.user) {
          const authUser = await fetchUserData(session.user)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:148',message:'fetchUserData result',data:{hasAuthUser:!!authUser,userId:authUser?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setUser(authUser)
        } else {
          setUser(null)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:151',message:'No session user, setting user to null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      // Error refreshing session
      setUser(null)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:156',message:'refreshSession error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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

  // Inicializar autenticação automaticamente quando o componente monta
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

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

  // Escutar eventos de XP ganho para atualizar o usuário
  useEffect(() => {
    if (!user) return

    const handleXPGained = () => {
      // Atualizar dados do usuário quando ganhar XP
      refreshSession()
    }

    window.addEventListener('xpGained', handleXPGained)

    return () => {
      window.removeEventListener('xpGained', handleXPGained)
    }
  }, [user, refreshSession])

  return (
    <AuthContext.Provider value={{ user, loading, initialized, signOut, refreshSession, initializeAuth }}>
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