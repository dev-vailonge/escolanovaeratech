'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useTheme, ThemeProvider } from '@/lib/ThemeContext'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { cn } from '@/lib/utils'

function AlunoLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, initializeAuth, refreshSession } = useAuth()
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
      // Remove message from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    // Initialize auth when page loads
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    // If user is already authenticated, redirect to aluno dashboard or redirect URL
    if (user && !loading) {
      const redirectParam = searchParams.get('redirect')
      const redirectTo = redirectParam ? decodeURIComponent(redirectParam) : '/aluno'
      router.push(redirectTo)
    }
  }, [user, loading, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // #region agent log
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:52',message:'Login attempt starting',data:{email:formData.email,hasSupabaseUrl:!!supabaseUrl,supabaseUrl:supabaseUrl?.substring(0,30)+'...',hasSupabaseKey,isProduction:process.env.NODE_ENV==='production'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    try {
      // Usar API route que cria cookies automaticamente via auth-helpers
      const response = await fetch('/api/aluno/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer login')
      }

      if (result.success && result.user) {
        console.log('✅ Login bem-sucedido via API, cookies criados automaticamente')
        
        // Forçar refresh da sessão no AuthContext
        try {
          await refreshSession()
          console.log('✅ Sessão atualizada')
        } catch (refreshError) {
          console.error('⚠️ Erro ao atualizar sessão:', refreshError)
        }
        
        // Aguardar um pouco para garantir que os cookies foram criados
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Successful login - redirect to aluno dashboard
        const redirectParam = searchParams.get('redirect')
        const redirectTo = redirectParam ? decodeURIComponent(redirectParam) : '/aluno'
        console.log('🔄 Redirecionando para:', redirectTo)
        
        // Usar window.location.href para garantir reload completo
        // Isso garante que o middleware veja os cookies criados pela API
        window.location.href = redirectTo
        return
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err?.message?.includes('Invalid login credentials') || err?.message?.includes('Invalid login')) {
        setError('Email ou senha inválidos.')
      } else if (err?.message?.includes('Email not confirmed') || err?.code === 'email_not_confirmed') {
        setError('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.')
      } else {
        setError(err?.message || 'Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.')
      }
    }
  }

  return (
    <div className={cn(
      "min-h-screen overflow-x-hidden relative transition-colors duration-300 flex items-center justify-center p-4",
      theme === 'dark' ? "bg-black" : "bg-white"
    )}>
      {/* Background Gradient */}
      <div className={cn(
        "fixed inset-0 pointer-events-none transition-colors duration-300",
        theme === 'dark' 
          ? "bg-gradient-to-br from-black via-black to-yellow-600/20"
          : "bg-gradient-to-br from-white via-white to-yellow-50/30"
      )}></div>
      
      {/* Geometric Grid Pattern */}
      <div className={cn(
        "fixed inset-0 pointer-events-none transition-opacity duration-300",
        theme === 'dark' ? "opacity-10" : "opacity-[0.15]"
      )}>
        <div className="absolute inset-0" style={{
          backgroundImage: theme === 'dark'
            ? `
              linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px)
            `
            : `
              linear-gradient(rgba(234, 179, 8, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(234, 179, 8, 0.4) 1px, transparent 1px)
            `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-full max-w-md relative z-10 backdrop-blur-xl rounded-xl p-6 md:p-8 border shadow-lg transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/40 border-white/10 shadow-black/30"
            : "bg-yellow-400/90 border-yellow-500/30 shadow-yellow-400/20"
        )}
      >
        <div className="text-center mb-8">
          <h1 className={cn(
            "text-3xl md:text-4xl font-bold mb-2",
            theme === 'dark'
              ? "bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent"
              : "text-gray-900"
          )}>
            Bem-vindo de volta
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-700"
          )}>
            Entre com suas credenciais para acessar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all",
                theme === 'dark'
                  ? "bg-black/50 border border-white/10"
                  : "bg-white/90 border border-yellow-500/30 text-gray-900 placeholder-gray-400"
              )}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <PasswordInput
              id="password"
              label="Senha"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              theme={theme}
            />
            <div className="mt-2 text-right">
              <Link
                href="/aluno/forgot-password"
                className={cn(
                  "text-sm transition-colors",
                  theme === 'dark'
                    ? "text-yellow-400 hover:text-yellow-300"
                    : "text-yellow-700 hover:text-yellow-800"
                )}
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          {successMessage && (
            <div className={cn(
              "p-3 rounded-lg text-sm text-center",
              theme === 'dark'
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-green-50 border border-green-200 text-green-600"
            )}>
              {successMessage}
            </div>
          )}

          {error && (
            <div className={cn(
              "p-3 rounded-lg text-sm text-center",
              theme === 'dark'
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-red-50 border border-red-200 text-red-600"
            )}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              theme === 'dark'
                ? "bg-yellow-500 text-black hover:bg-yellow-400 focus:ring-offset-black shadow-lg shadow-yellow-400/30 hover:shadow-yellow-400/50"
                : "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-offset-white shadow-lg shadow-yellow-600/30 hover:shadow-yellow-700/50"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={cn(
            "text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Não tem uma conta?{' '}
            <Link
              href="/aluno/signup"
              className={cn(
                "font-medium transition-colors",
                theme === 'dark'
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-yellow-700 hover:text-yellow-800"
              )}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function AlunoLoginWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    }>
      <AlunoLoginContent />
    </Suspense>
  )
}

export default function AlunoLoginPage() {
  return (
    <ThemeProvider>
      <AlunoLoginWrapper />
    </ThemeProvider>
  )
}

