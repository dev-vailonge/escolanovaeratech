/**
 * Helper para obter token de autenticação do Supabase
 * Tenta múltiplas formas para evitar travamentos
 */
import { supabase } from './supabase'

export async function getAuthToken(): Promise<string | null> {
  // Método 1: Tentar do localStorage primeiro (mais rápido e não trava)
  try {
    if (typeof window !== 'undefined') {
      // O Supabase armazena a sessão em diferentes formatos
      const keys = Object.keys(localStorage)
      
      // Procurar por todas as chaves do Supabase
      for (const key of keys) {
        if (key.includes('supabase') && (key.includes('auth') || key.includes('session'))) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              
              // Tentar diferentes estruturas
              if (parsed?.currentSession?.access_token) {
                console.log('✅ Token obtido do localStorage (currentSession)')
                return parsed.currentSession.access_token
              }
              if (parsed?.access_token) {
                console.log('✅ Token obtido do localStorage (access_token)')
                return parsed.access_token
              }
              // Tentar estrutura do Supabase v2
              if (parsed?.value?.access_token) {
                console.log('✅ Token obtido do localStorage (value.access_token)')
                return parsed.value.access_token
              }
              // Tentar estrutura aninhada
              if (parsed?.session?.access_token) {
                console.log('✅ Token obtido do localStorage (session.access_token)')
                return parsed.session.access_token
              }
            }
          } catch (parseError) {
            // Continuar tentando outras chaves
            continue
          }
        }
      }
      
      // Se não encontrou nas chaves do Supabase, tentar procurar em todas as chaves
      for (const key of keys) {
        try {
          const stored = localStorage.getItem(key)
          if (stored && stored.includes('access_token')) {
            const parsed = JSON.parse(stored)
            if (parsed?.access_token) {
              console.log('✅ Token obtido do localStorage (busca ampla)')
              return parsed.access_token
            }
          }
        } catch (e) {
          continue
        }
      }
    }
  } catch (e) {
    console.warn('Método 1 (localStorage) falhou:', e)
  }

  // Método 2: getSession com timeout muito curto (500ms apenas)
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 500)
    )
    
    const sessionPromise = supabase.auth.getSession()
    const result = await Promise.race([sessionPromise, timeoutPromise]) as any
    
    if (result?.data?.session?.access_token) {
      console.log('✅ Token obtido do getSession (com timeout)')
      return result.data.session.access_token
    }
  } catch (e) {
    console.warn('Método 2 (getSession com timeout) falhou ou timeout:', e)
  }

  // Não tentar getSession sem timeout pois pode travar
  console.error('❌ Todos os métodos falharam ao obter token')
  return null
}

