'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

interface SafeLoadingProps {
  loading: boolean
  error?: string | null
  timeout?: number // em segundos (ms)
  timeoutMs?: number // em milissegundos, alternativa a timeout
  onRetry?: () => void
  children?: React.ReactNode
  loadingMessage?: string
  errorMessage?: string
}

/**
 * Componente de loading que mostra erro após timeout
 * Previne loading infinito - sempre mostra algo ao usuário
 */
export default function SafeLoading({
  loading,
  error = null,
  timeout = 15,
  timeoutMs,
  onRetry,
  children,
  loadingMessage = 'Carregando...',
  errorMessage = 'A operação está demorando mais que o esperado.'
}: SafeLoadingProps) {
  const { theme } = useTheme()
  const [showTimeoutError, setShowTimeoutError] = useState(false)
  const timeoutInMs = timeoutMs || (timeout * 1000)

  useEffect(() => {
    if (loading && !error) {
      const timeoutId = setTimeout(() => {
        setShowTimeoutError(true)
      }, timeoutInMs)

      return () => clearTimeout(timeoutId)
    } else {
      setShowTimeoutError(false)
    }
  }, [loading, error, timeoutInMs])

  // Se tem erro explícito, mostrar erro
  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 rounded-xl border",
        theme === 'dark'
          ? "bg-red-500/10 border-red-500/30"
          : "bg-red-50 border-red-200"
      )}>
        <AlertCircle className={cn(
          "w-8 h-8",
          theme === 'dark' ? "text-red-400" : "text-red-600"
        )} />
        <p className={cn(
          "text-sm md:text-base font-medium mb-4",
          theme === 'dark' ? "text-red-300" : "text-red-700"
        )}>
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              theme === 'dark'
                ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300"
                : "bg-red-100 hover:bg-red-200 border border-red-300 text-red-700"
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        )}
      </div>
    )
  }

  if (!loading && !showTimeoutError) {
    return <>{children}</>
  }

  if (showTimeoutError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 rounded-xl",
        theme === 'dark'
          ? "bg-red-500/10 border border-red-500/30"
          : "bg-red-50 border border-red-200"
      )}>
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          theme === 'dark'
            ? "bg-red-500/20 border border-red-500/50"
            : "bg-red-100 border border-red-300"
        )}>
          <AlertCircle className={cn(
            "w-8 h-8",
            theme === 'dark' ? "text-red-400" : "text-red-600"
          )} />
        </div>
        
        <div className="text-center max-w-md">
          <h3 className={cn(
            "text-lg font-semibold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Operação demorada
          </h3>
          <p className={cn(
            "text-sm mb-4",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {errorMessage}
          </p>
          
          {onRetry && (
            <button
              onClick={() => {
                setShowTimeoutError(false)
                onRetry()
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    )
  }

  // Loading normal
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center rounded-lg border",
      theme === 'dark'
        ? "bg-gray-800/30 border-white/10 text-gray-400"
        : "bg-gray-50 border-gray-200 text-gray-600"
    )}>
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm md:text-base font-medium">{loadingMessage}</p>
    </div>
  )
}
