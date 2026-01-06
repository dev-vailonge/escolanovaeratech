'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTheme, ThemeProvider } from '@/lib/ThemeContext'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { cn } from '@/lib/utils'

function AlunoSignUpContent() {
  const router = useRouter()
  const { user, loading, initializeAuth } = useAuth()
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Não redirecionar automaticamente - usuário precisa verificar email primeiro
  // useEffect(() => {
  //   if (user && !loading) {
  //     router.push('/aluno')
  //   }
  // }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      // Criar conta no Supabase Auth
      // IMPORTANTE: emailRedirectTo aponta para a rota que processa a confirmação de email
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          },
          emailRedirectTo: `${window.location.origin}/aluno/auth/confirm`
        }
      })

      // Verificar se houve erro no signUp
      if (signUpError) {
        console.error('Erro no signUp:', signUpError)
        throw signUpError
      }

      // Verificar se o usuário foi criado
      if (!data?.user?.id) {
        throw new Error('Usuário não foi criado. Por favor, tente novamente.')
      }

      const userId = data.user.id

      // Tentar criar usuário na tabela users via API (opcional - pode falhar se não tiver service role key)
      // Se falhar, o trigger do banco criará automaticamente
      try {
        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userId,
            email: formData.email,
            name: formData.name,
            role: 'aluno',
            access_level: 'full'
          }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          console.log('✅ Usuário criado na tabela users via API')
        } else {
          // Se não tiver service role key ou outro erro, não bloquear - continuar normalmente
          // O trigger do banco criará o usuário automaticamente
          console.warn('⚠️ API de criar usuário não disponível (pode ser falta de service role key), continuando...')
          console.warn('⚠️ O usuário será criado pelo trigger do banco automaticamente')
        }
      } catch (apiError: any) {
        // Não bloquear em caso de erro - continuar normalmente
        console.warn('⚠️ Erro ao chamar API de criar usuário (não bloqueante):', apiError.message)
        console.warn('⚠️ O usuário será criado pelo trigger do banco automaticamente')
      }

      // Mostrar mensagem de verificação de email
      setEmailSent(true)
      setUserEmail(formData.email)
      setIsLoading(false)
    } catch (err: any) {
      console.error('Erro no signup:', err)
      if (err?.message?.includes('User already registered') || err?.message?.includes('already registered')) {
        setError('Este email já está cadastrado. Tente fazer login.')
      } else if (err?.message?.includes('Password')) {
        setError('A senha deve ter pelo menos 6 caracteres')
      } else if (err?.message?.includes('Invalid email')) {
        setError('Email inválido. Por favor, verifique o email digitado.')
      } else if (err?.message?.includes('Invalid login credentials')) {
        setError('Credenciais inválidas. Tente fazer login.')
      } else {
        setError(err?.message || 'Erro ao criar conta. Por favor, tente novamente.')
      }
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
        {emailSent ? (
          // Mensagem de verificação de email
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className={cn(
                "rounded-full p-4",
                theme === 'dark'
                  ? "bg-yellow-400/20 border border-yellow-400/30"
                  : "bg-yellow-500/20 border border-yellow-600/30"
              )}>
                <svg 
                  className={cn(
                    "w-12 h-12",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div>
              <h1 className={cn(
                "text-2xl md:text-3xl font-bold mb-3",
                theme === 'dark'
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent"
                  : "text-gray-900"
              )}>
                Verifique seu e-mail
              </h1>
              <p className={cn(
                "text-sm md:text-base leading-relaxed",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                Enviamos um e-mail de verificação para
              </p>
              <p className={cn(
                "text-base md:text-lg font-semibold mt-2 break-all",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
              )}>
                {userEmail}
              </p>
            </div>

            <div className={cn(
              "p-4 rounded-lg text-left",
              theme === 'dark'
                ? "bg-yellow-400/10 border border-yellow-400/20"
                : "bg-yellow-50 border border-yellow-200"
            )}>
              <p className={cn(
                "text-sm leading-relaxed",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                <strong>Próximos passos:</strong>
              </p>
              <ol className={cn(
                "text-sm mt-2 space-y-1 list-decimal list-inside",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                <li>Abra sua caixa de entrada</li>
                <li>Procure pelo e-mail da Nova Era Tech</li>
                <li>Clique no link de verificação</li>
                <li>Faça login com suas credenciais</li>
              </ol>
            </div>

            <div className="pt-4">
              <Link
                href="/aluno/login"
                className={cn(
                  "inline-block font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all",
                  theme === 'dark'
                    ? "bg-yellow-500 text-black hover:bg-yellow-400 focus:ring-offset-black shadow-lg shadow-yellow-400/30 hover:shadow-yellow-400/50"
                    : "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-offset-white shadow-lg shadow-yellow-600/30 hover:shadow-yellow-700/50"
                )}
              >
                Ir para Login
              </Link>
            </div>

            <div className="pt-2">
              <p className={cn(
                "text-xs",
                theme === 'dark' ? "text-gray-500" : "text-gray-500"
              )}>
                Não recebeu o e-mail? Verifique sua pasta de spam
              </p>
            </div>
          </div>
        ) : (
          // Formulário de cadastro
          <>
            <div className="text-center mb-8">
              <h1 className={cn(
                "text-3xl md:text-4xl font-bold mb-2",
                theme === 'dark'
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent"
                  : "text-gray-900"
              )}>
                Criar Conta
              </h1>
              <p className={cn(
                "text-sm md:text-base",
                theme === 'dark' ? "text-gray-400" : "text-gray-700"
              )}>
                Junte-se à Nova Era Tech e comece sua jornada
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label 
              htmlFor="name" 
              className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}
            >
              Nome Completo
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all",
                theme === 'dark'
                  ? "bg-black/50 border border-white/10"
                  : "bg-white/90 border border-yellow-500/30 text-gray-900 placeholder-gray-400"
              )}
              placeholder="Seu nome completo"
              required
            />
          </div>

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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

          <PasswordInput
            id="password"
            label="Senha"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            theme={theme}
            showHelperText
            helperText="Mínimo de 6 caracteres"
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirmar Senha"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                Criando conta...
              </span>
            ) : (
              'Criar conta'
            )}
          </button>
            </form>

            <div className="mt-6 text-center">
              <p className={cn(
                "text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Já tem uma conta?{' '}
                <Link
                  href="/aluno/login"
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
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function AlunoSignUpPage() {
  return (
    <ThemeProvider>
      <AlunoSignUpContent />
    </ThemeProvider>
  )
}

