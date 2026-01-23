/**
 * Helper para obter token de autenticação do Supabase
 * Prioriza localStorage/cookies e só usa getSession() como último recurso
 * IMPORTANTE: Não usar Promise.race com timeout para evitar logout indevido
 */
import { supabase } from './supabase'

export async function getAuthToken(): Promise<string | null> {
  // Método 1: Tentar do localStorage primeiro (mais rápido e não causa logout)
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
                return parsed.currentSession.access_token
              }
              if (parsed?.access_token) {
                return parsed.access_token
              }
              // Tentar estrutura do Supabase v2
              if (parsed?.value?.access_token) {
                return parsed.value.access_token
              }
              // Tentar estrutura aninhada
              if (parsed?.session?.access_token) {
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
              return parsed.access_token
            }
          }
        } catch (e) {
          continue
        }
      }
    }
  } catch (e) {
    // Falha ao ler localStorage - continuar para próximo método
  }

  // Método 2: getSession() como último recurso (SEM timeout para evitar logout)
  // IMPORTANTE: Só chamar getSession() se localStorage não tiver token
  // Não usar Promise.race pois pode causar logout indevido
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) {
      return data.session.access_token
    }
  } catch (e) {
    // getSession() falhou - retornar null
  }

  // Se todos os métodos falharam, retornar null
  return null
}
