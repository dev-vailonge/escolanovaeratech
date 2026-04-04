/**
 * Helper para fazer queries Supabase com timeout automático
 * Previne loading infinito em todas as páginas
 */

import { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_TIMEOUT = 10000 // 10 segundos

interface SafeQueryOptions {
  timeout?: number
  retry?: boolean
  retryAttempts?: number
  retryDelay?: number
}

/**
 * Executa uma query Supabase com timeout e retry automático
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: SafeQueryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retry = true,
    retryAttempts = 2,
    retryDelay = 1000
  } = options

  const executeWithTimeout = async (attempt = 0): Promise<{ data: T | null; error: any }> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // Para queries do Supabase, não podemos passar signal diretamente
      // Mas podemos usar Promise.race para timeout
      const queryPromise = queryFn()
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )

      const result = await Promise.race([queryPromise, timeoutPromise])
      clearTimeout(timeoutId)
      
      return result
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Se é timeout e tem retries disponíveis, tenta novamente
      if (
        retry && 
        attempt < retryAttempts && 
        (error?.message === 'Query timeout' || error?.name === 'AbortError')
      ) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        return executeWithTimeout(attempt + 1)
      }

      // Retorna erro
      return {
        data: null,
        error: error?.message === 'Query timeout' 
          ? { message: `Operação demorou mais de ${timeout / 1000}s`, code: 'TIMEOUT' }
          : error
      }
    }
  }

  return executeWithTimeout()
}

/**
 * Executa um fetch com timeout e retry automático
 */
export async function safeFetch(
  url: string,
  options: RequestInit & { timeout?: number; retry?: boolean; retryAttempts?: number; retryDelay?: number } = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retry = true,
    retryAttempts = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  const executeWithTimeout = async (attempt = 0): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      // Se a resposta não é OK e temos retries, tenta novamente
      if (!response.ok && retry && attempt < retryAttempts) {
        clearTimeout(timeoutId)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        return executeWithTimeout(attempt + 1)
      }

      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Se é timeout/abort e tem retries disponíveis, tenta novamente
      if (
        retry && 
        attempt < retryAttempts && 
        (error?.name === 'AbortError' || error?.message?.includes('timeout'))
      ) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        return executeWithTimeout(attempt + 1)
      }

      throw error
    }
  }

  return executeWithTimeout()
}
