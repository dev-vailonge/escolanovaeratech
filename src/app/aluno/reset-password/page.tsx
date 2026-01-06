'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useTheme, ThemeProvider } from '@/lib/ThemeContext'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { cn } from '@/lib/utils'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    // Check if we have a session and handle the email link
    const handleEmailLink = async () => {
      try {
        // Verificar se já tem sessão (pode ter sido criada automaticamente)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
        }

        // If we have a session, we're good to go
        if (session) {
          console.log('✅ Sessão já existe, pode redefinir senha')
          setIsValid(true)
          return
        }

        // Verificar query params primeiro (Supabase pode enviar tokens na query)
        const urlParams = new URLSearchParams(window.location.search)
        const accessTokenQuery = urlParams.get('access_token')
        const refreshTokenQuery = urlParams.get('refresh_token')
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        // Se tiver erro na query, processar erro
        if (error) {
          if (error === 'access_denied' && (errorDescription?.includes('expired') || errorDescription?.includes('invalid'))) {
            setError('O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.')
          } else {
            setError(errorDescription || 'Erro ao processar link de recuperação. Tente solicitar um novo link.')
          }
          return
        }

        // Se tiver tokens na query, processar
        if (accessTokenQuery && refreshTokenQuery) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessTokenQuery,
            refresh_token: refreshTokenQuery,
          })

          if (sessionError) {
            throw sessionError
          }

          if (data?.session) {
            console.log('✅ Sessão criada via query params, pode redefinir senha')
            setIsValid(true)
            return
          }
        }

        // Verificar hash fragment na URL (Supabase pode enviar tokens no hash)
        const hash = window.location.hash
        if (hash) {
          // Extrair tokens do hash
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const hashError = hashParams.get('error')
          const hashErrorDescription = hashParams.get('error_description')

          // Se tiver erro no hash, processar erro
          if (hashError) {
            if (hashError === 'access_denied' && (hashErrorDescription?.includes('expired') || hashErrorDescription?.includes('invalid'))) {
              setError('O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.')
            } else {
              setError(hashErrorDescription || 'Erro ao processar link de recuperação. Tente solicitar um novo link.')
            }
            return
          }

          if (accessToken && refreshToken) {
            // Definir sessão com os tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              throw sessionError
            }

            if (data?.session) {
              console.log('✅ Sessão criada via hash, pode redefinir senha')
              setIsValid(true)
              return
            }
          } else {
            // Tentar verificar OTP se tiver token_hash no hash
            const tokenHash = hashParams.get('token_hash') || hash.substring(1)
            if (tokenHash) {
              const { data, error: otpError } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'recovery'
              })

              if (otpError) {
                throw otpError
              }

              if (data?.session) {
                console.log('✅ Sessão criada via OTP, pode redefinir senha')
                setIsValid(true)
                return
              }
            }
          }
        }

        // Se chegou aqui sem tokens nem sessão, pode ser que o link já foi usado ou é inválido
        setError('Acesso inválido. Por favor, use o link enviado por email ou solicite um novo link.')
      } catch (error: any) {
        console.error('Error verifying recovery link:', error)
        if (error?.message?.includes('expired') || error?.message?.includes('invalid')) {
          setError('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.')
        } else {
          setError(error?.message || 'Erro ao processar link de recuperação. Tente solicitar um novo link.')
        }
      }
    }

    handleEmailLink()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      // Verificar se ainda tem sessão antes de atualizar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError)
        throw new Error('Sessão inválida. Por favor, use o link de recuperação novamente.')
      }

      if (!session) {
        console.error('Nenhuma sessão encontrada')
        throw new Error('Sessão expirada. Por favor, solicite um novo link de recuperação.')
      }

      console.log('🔄 Atualizando senha para usuário:', session.user.email)

      // Atualizar senha
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError)
        throw updateError
      }

      console.log('✅ Senha atualizada com sucesso', updateData)

      // Sign out the user after password change (não esperar erro, apenas tentar)
      try {
        await supabase.auth.signOut()
        console.log('✅ Usuário deslogado após alteração de senha')
      } catch (signOutErr) {
        console.warn('Aviso ao deslogar (não crítico):', signOutErr)
      }

      // Redirect to login page with success message
      // Usar window.location.replace para garantir que funcione e não permita voltar
      const successMessage = encodeURIComponent('Senha alterada com sucesso! Faça login com sua nova senha.')
      console.log('🔄 Redirecionando para login...')
      
      // Usar window.location.replace ao invés de href para garantir redirect
      // Não resetar isLoading aqui, deixar o redirect acontecer
      window.location.replace(`/aluno/login?message=${successMessage}`)
    } catch (err: any) {
      console.error('Erro completo ao redefinir senha:', err)
      const errorMessage = err?.message || err?.error_description || 'Erro ao redefinir senha. Tente novamente.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (!isValid) {
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
          className={cn(
            "w-full max-w-md relative z-10 backdrop-blur-xl rounded-xl p-6 md:p-8 border shadow-lg transition-colors duration-300 text-center",
            theme === 'dark'
              ? "bg-black/40 border-white/10 shadow-black/30"
              : "bg-yellow-400/90 border-yellow-500/30 shadow-yellow-400/20"
          )}
        >
          {error ? (
            <>
              <div className={cn(
                "p-3 rounded-lg text-sm mb-4",
                theme === 'dark'
                  ? "bg-red-500/10 border border-red-500/20 text-red-400"
                  : "bg-red-50 border border-red-200 text-red-600"
              )}>
                {error}
              </div>
              <Link
                href="/aluno/forgot-password"
                className={cn(
                  "font-medium transition-colors",
                  theme === 'dark'
                    ? "text-yellow-400 hover:text-yellow-300"
                    : "text-yellow-700 hover:text-yellow-800"
                )}
              >
                Solicitar novo link
              </Link>
            </>
          ) : (
            <>
              <div className={cn(
                "animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4",
                theme === 'dark' ? "border-yellow-400" : "border-yellow-600"
              )}></div>
              <p className={cn(
                "text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Verificando link de recuperação...
              </p>
            </>
          )}
        </motion.div>
      </div>
    )
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
            Redefinir Senha
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-700"
          )}>
            Digite sua nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput
            id="password"
            label="Nova Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            theme={theme}
            showHelperText
            helperText="Mínimo de 6 caracteres"
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            theme={theme}
          />

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
            disabled={isLoading || !password || !confirmPassword}
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
                Redefinindo senha...
              </span>
            ) : (
              'Redefinir Senha'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function AlunoResetPasswordContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

export default function AlunoResetPasswordPage() {
  return (
    <ThemeProvider>
      <AlunoResetPasswordContent />
    </ThemeProvider>
  )
}

