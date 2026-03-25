'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'
import { getUserById, getUserByEmail } from './database'
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

// Função helper para criar usuário diretamente usando cliente autenticado
// Isso funciona se o RLS permitir que o próprio usuário crie seu registro
async function createUserDirectly(supabaseUser: User, userName: string): Promise<DatabaseUser | null> {
  try {
    console.log(`🔄 Tentando criar usuário diretamente na tabela users: ${supabaseUser.email}`)
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: userName,
        role: 'aluno',
        access_level: 'full'
      })
      .select()
      .single()

    if (error) {
      // Se o erro for que o usuário já existe, tentar buscar
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        console.log('ℹ️ Usuário já existe, buscando...')
        return await getUserById(supabaseUser.id)
      }
      
      // Se for erro de permissão (RLS bloqueando), logar mas não mostrar erro assustador
      // Verificar código de erro ou mensagem que indica problema de permissão
      const errorMessage = error.message?.toLowerCase() || ''
      const isPermissionError = error.code === '42501' || 
                               errorMessage.includes('permission') || 
                               errorMessage.includes('policy') ||
                               errorMessage.includes('forbidden') ||
                               errorMessage.includes('not acceptable')
      
      if (isPermissionError) {
        console.warn('⚠️ RLS bloqueou criação direta do usuário. Isso é esperado se não houver política RLS permitindo.')
        console.warn('⚠️ O usuário será criado por trigger do banco ou precisa de configuração de RLS.')
        return null
      }
      
      console.error('❌ Erro ao criar usuário diretamente:', error)
      return null
    }

    console.log(`✅ Usuário criado diretamente na tabela users: ${supabaseUser.email}`)
    return data
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário diretamente:', error)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true) // Inicia como true para evitar flash de login
  const [initialized, setInitialized] = useState(false)
  const isInitializingRef = useRef(false)

  // Buscar dados completos do usuário do banco
  // IMPORTANTE: Esta função só é chamada quando há um usuário autenticado (supabaseUser)
  // A API /api/users/create valida que o usuário existe no auth.users antes de criar
  const fetchUserData = async (supabaseUser: User | null): Promise<AuthUser | null> => {
    if (!supabaseUser) return null

    try {
      let dbUser = await getUserById(supabaseUser.id)
      
      // Se o usuário não existe na tabela users, criar automaticamente
      // SEGURANÇA: Só cria se o usuário estiver autenticado (supabaseUser existe)
      if (!dbUser) {
        console.warn(`⚠️ Usuário ${supabaseUser.id} não encontrado na tabela users. Criando automaticamente...`)
        
        const userName = supabaseUser.user_metadata?.name || 
                         supabaseUser.user_metadata?.full_name || 
                         supabaseUser.user_metadata?.display_name ||
                         supabaseUser.email?.split('@')[0] || 
                         'Usuário'
        
        // Primeiro, tentar criar via API (se tiver service role key)
        // Adicionar timeout de 5 segundos
        try {
          const fetchPromise = fetch('/api/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: userName,
              role: 'aluno',
              access_level: 'full'
            }),
          })
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('fetch timeout')), 5000)
          )
          
          const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

          if (!response || !response.ok) {
            throw new Error('Response não OK')
          }

          const result = await response.json()

          if (response.ok && result.success && result.user) {
            console.log(`✅ Usuário criado automaticamente via API: ${supabaseUser.email}`)
            dbUser = result.user
          } else if (result.code === 'MISSING_SERVICE_ROLE_KEY') {
            // Se não tiver service role key, criar diretamente usando cliente autenticado
            console.warn('⚠️ Service role key não disponível, criando usuário diretamente com cliente autenticado...')
            dbUser = await createUserDirectly(supabaseUser, userName)
          } else {
            console.error('❌ Erro ao criar usuário automaticamente:', result.error)
            // Tentar criar diretamente como fallback
            dbUser = await createUserDirectly(supabaseUser, userName)
          }
        } catch (apiError: any) {
          console.warn('⚠️ Erro ao chamar API de criar usuário, tentando criar diretamente:', apiError.message)
          // Tentar criar diretamente usando cliente autenticado
          dbUser = await createUserDirectly(supabaseUser, userName)
        }
        
        // Se ainda não conseguiu criar, aguardar um pouco e tentar buscar novamente
        // (pode ter sido criado por trigger do banco de dados que demora alguns segundos)
        // REDUZIDO para 1.5 segundos para evitar travamento
        if (!dbUser) {
          console.log('⏳ Aguardando 1.5 segundos para verificar se trigger criou o usuário...')
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Tentar buscar novamente após aguardar (com timeout)
          try {
            const getUserPromise = getUserById(supabaseUser.id)
            const getUserTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('getUserById timeout')), 3000)
            )
            dbUser = await Promise.race([getUserPromise, getUserTimeoutPromise]) as DatabaseUser | null
          } catch (error) {
            console.warn('⚠️ getUserById timeout após aguardar:', error)
            dbUser = null
          }
          
          if (!dbUser) {
            // Tentar buscar por email como fallback (pode ter sido criado com ID diferente)
            dbUser = await getUserByEmail(supabaseUser.email || '')
            
            if (!dbUser) {
              console.warn('⚠️ Usuário ainda não existe na tabela users após tentativas.')
              console.warn('⚠️ Criando usuário temporário para permitir login...')
              
              // Criar um usuário "temporário" usando os dados do Supabase Auth
              // Isso permite que o usuário faça login mesmo sem registro na tabela users
              // O registro será criado depois por um trigger ou processo em background
              const tempUser: DatabaseUser = {
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || 
                      supabaseUser.user_metadata?.full_name || 
                      supabaseUser.user_metadata?.display_name ||
                      supabaseUser.email?.split('@')[0] || 
                      'Usuário',
                role: 'aluno',
                access_level: 'full',
                avatar_url: null,
                bio: null,
                level: 1,
                xp: 0,
                xp_mensal: 0,
                coins: 0,
                streak: 0,
                created_at: supabaseUser.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              
              console.log('✅ Usuário temporário criado para permitir login')
              dbUser = tempUser
            } else {
              console.log('✅ Usuário encontrado por email após aguardar')
            }
          } else {
            console.log('✅ Usuário encontrado após aguardar (criado por trigger)')
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
    if (initialized || isInitializingRef.current) return
    
    isInitializingRef.current = true
    setLoading(true)
    try {
      // Verifica se Supabase está configurado antes de usar
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // Adicionar timeout para getSession (5 segundos)
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 5000)
        )
        
        let session
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any
          session = result?.data
        } catch (error) {
          console.warn('⚠️ getSession timeout ou erro:', error)
          session = null
        }
        
        if (session?.user) {
          // Adicionar timeout para fetchUserData (10 segundos)
          const fetchUserPromise = fetchUserData(session.user)
          const fetchTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('fetchUserData timeout')), 10000)
          )
          
          try {
            const authUser = await Promise.race([fetchUserPromise, fetchTimeoutPromise]) as AuthUser | null
            setUser(authUser)
          } catch (error) {
            console.warn('⚠️ fetchUserData timeout ou erro:', error)
            // Não fazer logout automático - manter estado anterior
          }
        } else {
          // Só fazer setUser(null) se nunca houve usuário (primeira inicialização)
          // Se já havia usuário, não fazer logout automático
          if (!user) {
            setUser(null)
          }
        }
      } else {
        // Modo mockado - não há usuário autenticado mas não quebra
        // Só fazer setUser(null) se nunca houve usuário
        if (!user) {
          setUser(null)
        }
      }
      setInitialized(true)
    } catch (error) {
      // Error getting initial session - não fazer logout automático
      console.error('❌ Erro ao inicializar autenticação:', error)
      // Não fazer setUser(null) - manter estado anterior
      setInitialized(true)
    } finally {
      setLoading(false)
      isInitializingRef.current = false
    }
  }, [initialized, user])

  const refreshSession = async () => {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // Adicionar timeout para getSession (5 segundos)
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 5000)
        )
        
        let session
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any
          session = result?.data
        } catch (error) {
          console.warn('⚠️ refreshSession: getSession timeout ou erro:', error)
          session = null
        }
        if (session?.user) {
          // Adicionar timeout para fetchUserData (10 segundos)
          const fetchUserPromise = fetchUserData(session.user)
          const fetchTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('fetchUserData timeout')), 10000)
          )
          
          let authUser
          try {
            authUser = await Promise.race([fetchUserPromise, fetchTimeoutPromise]) as AuthUser | null
            setUser(authUser)
          } catch (error) {
            console.warn('⚠️ refreshSession: fetchUserData timeout ou erro:', error)
            // Não fazer logout automático - manter estado anterior
          }
        }
      }
      // Não fazer setUser(null) quando Supabase não está configurado - manter estado anterior
    } catch (error) {
      // Error refreshing session - não fazer logout automático
      // Não fazer setUser(null) - manter estado anterior
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

  // Fallback de segurança para evitar loading infinito em falhas de sessão.
  useEffect(() => {
    if (!loading) return

    const timeout = setTimeout(() => {
      setLoading(false)
      setInitialized(true)
      isInitializingRef.current = false
    }, 12000)

    return () => clearTimeout(timeout)
  }, [loading])

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
            } else if (event === 'SIGNED_OUT') {
              // Só fazer logout se for um evento explícito de SIGNED_OUT
              setUser(null)
            }
            // Se session é null mas não é SIGNED_OUT, manter estado anterior (não fazer logout automático)
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

  // Escutar eventos de atualização de usuário (sem refresh completo da sessão)
  useEffect(() => {
    const handleUserUpdated = (event: CustomEvent<AuthUser>) => {
      // Atualizar apenas os dados do usuário sem fazer refresh completo
      // Isso evita problemas de logout quando refreshSession falha
      setUser(event.detail)
    }

    window.addEventListener('userUpdated', handleUserUpdated as EventListener)

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdated as EventListener)
    }
  }, [])

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