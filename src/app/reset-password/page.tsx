'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    // Check if we have a session and handle the email link
    const handleEmailLink = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return
      }

      // If we have a session, we're good to go
      if (session) {
        setIsValid(true)
        return
      }

      // If no session, check for hash in URL
      const hash = window.location.hash
      if (!hash) {
        // No session and no hash means user accessed the page directly
        // We'll let them stay on the page but show an error
        setError('Acesso inválido. Por favor, use o link enviado por email.')
        return
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: hash.substring(1),
          type: 'recovery'
        })

        if (error) throw error

        if (data?.session) {
          setIsValid(true)
        }
      } catch (error) {
        console.error('Error verifying OTP:', error)
        setError('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.')
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
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // Sign out the user after password change
      await supabase.auth.signOut()

      // Redirect to sign in page with success message
      router.push('/signin?message=Senha alterada com sucesso! Faça login com sua nova senha.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao redefinir senha')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          {error ? (
            <>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm mb-4">
                {error}
              </div>
              <Link
                href="/forgot-password"
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Solicitar novo link
              </Link>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Verificando link de recuperação...</p>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Redefinir Senha</h1>
          <p className="text-gray-400">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
              Nova Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">
              Mínimo de 6 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full py-3 px-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Redefinindo senha...' : 'Redefinir Senha'}
          </button>
        </form>
      </motion.div>
    </div>
  )
} 