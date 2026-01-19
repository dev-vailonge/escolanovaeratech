'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseSafeAsyncOptions {
  timeout?: number // em segundos
  retry?: boolean
  retryAttempts?: number
  retryDelay?: number
  onError?: (error: Error) => void
}

/**
 * Hook que gerencia operações assíncronas com timeout automático
 * Previne loading infinito - sempre mostra erro após timeout
 */
export function useSafeAsync<T = any>(
  asyncFn: () => Promise<T>,
  options: UseSafeAsyncOptions = {}
) {
  const {
    timeout = 15,
    retry = false,
    retryAttempts = 2,
    retryDelay = 1000,
    onError
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [showTimeoutError, setShowTimeoutError] = useState(false)
  const mountedRef = useRef(true)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  // Limpar timeout quando desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [])

  const execute = useCallback(async (retryCount = 0): Promise<void> => {
    if (!mountedRef.current) return

    setLoading(true)
    setError(null)
    setShowTimeoutError(false)

    // Timeout visual: mostrar erro após X segundos
    timeoutIdRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setShowTimeoutError(true)
        setError(new Error(`Operação demorou mais de ${timeout} segundos`))
        setLoading(false)
      }
    }, timeout * 1000)

    try {
      // Timeout real: cancelar após X segundos
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout * 1000)
      )

      const result = await Promise.race([asyncFn(), timeoutPromise])
      
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }

      if (!mountedRef.current) return

      setData(result)
      setLoading(false)
      setError(null)
      setShowTimeoutError(false)
    } catch (err: any) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }

      if (!mountedRef.current) return

      const error = err instanceof Error ? err : new Error(String(err))

      // Se é timeout e tem retries, tenta novamente
      if (retry && retryCount < retryAttempts && error.message === 'Timeout') {
        console.log(`🔄 Retry ${retryCount + 1}/${retryAttempts} após timeout...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)))
        return execute(retryCount + 1)
      }

      setError(error)
      setLoading(false)
      setShowTimeoutError(error.message === 'Timeout')

      if (onError) {
        onError(error)
      }
    }
  }, [asyncFn, timeout, retry, retryAttempts, retryDelay, onError])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setShowTimeoutError(false)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    showTimeoutError,
    execute,
    reset
  }
}
