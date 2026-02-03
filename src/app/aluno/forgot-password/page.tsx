'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useTheme, ThemeProvider } from '@/lib/ThemeContext'
import { BoxReveal } from '@/components/ui/modern-animated-sign-in'
import { cn } from '@/lib/utils'

function AlunoForgotPasswordContent() {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/aluno/reset-password`
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar email de recuperação. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
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
          <BoxReveal boxColor='#FBBF24' duration={0.6}>
            <h1 className={cn(
              "text-3xl md:text-4xl font-bold mb-2",
              theme === 'dark'
                ? "bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent"
                : "text-gray-900"
            )}>
              Recuperar Senha
            </h1>
          </BoxReveal>
          <BoxReveal boxColor='#FBBF24' duration={0.6} className='pb-2'>
            <p className={cn(
              "text-sm md:text-base",
              theme === 'dark' ? "text-gray-400" : "text-gray-700"
            )}>
              Digite seu email para receber o link de recuperação
            </p>
          </BoxReveal>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-lg p-6 text-center border",
              theme === 'dark'
                ? "bg-green-500/10 border-green-500/20"
                : "bg-green-50 border-green-200"
            )}
          >
            <svg
              className={cn(
                "w-12 h-12 mx-auto mb-4",
                theme === 'dark' ? "text-green-400" : "text-green-600"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className={cn(
              "text-xl font-semibold mb-2",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Email enviado!
            </h2>
            <p className={cn(
              "text-sm mb-2",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Enviamos um link de recuperação para:
            </p>
            <p className={cn(
              "text-sm font-semibold mb-3",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )}>
              {email}
            </p>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Verifique sua caixa de entrada para redefinir sua senha.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <BoxReveal boxColor='#FBBF24' duration={0.6} width='100%'>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
            </BoxReveal>

            {error && (
              <BoxReveal boxColor='#FBBF24' duration={0.6} width='100%'>
                <div className={cn(
                  "p-3 rounded-lg text-sm text-center",
                  theme === 'dark'
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-red-50 border border-red-200 text-red-600"
                )}>
                  {error}
                </div>
              </BoxReveal>
            )}

            <BoxReveal boxColor='#FBBF24' duration={0.6} width='100%' overflow='visible'>
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
                  Enviando...
                </span>
              ) : (
                'Enviar link de recuperação'
              )}
              </button>
            </BoxReveal>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className={cn(
            "text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Lembrou sua senha?{' '}
            <Link
              href="/"
              className={cn(
                "font-medium transition-colors",
                theme === 'dark'
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-yellow-700 hover:text-yellow-800"
              )}
            >
              Entrar
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function AlunoForgotPasswordPage() {
  return (
    <ThemeProvider>
      <AlunoForgotPasswordContent />
    </ThemeProvider>
  )
}

