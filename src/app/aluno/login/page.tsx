'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { ThemeProvider } from '@/lib/ThemeContext'
import { AlunoLoginAnimated } from '@/components/ui/aluno-login-animated'
import Image from 'next/image'

function AlunoLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, initializeAuth } = useAuth()
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
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('message')
        router.replace(url.pathname + url.search, { scroll: false })
      }
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

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    name: keyof typeof formData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        throw signInError
      }

      if (data?.user && data?.session) {
        console.log('✅ Login bem-sucedido, redirecionando para criar cookies...')
        
        const redirectParam = searchParams.get('redirect')
        const finalRedirect = redirectParam ? encodeURIComponent(redirectParam) : encodeURIComponent('/aluno')
        
        const callbackUrl = `/api/aluno/auth-callback?access_token=${encodeURIComponent(data.session.access_token)}&refresh_token=${encodeURIComponent(data.session.refresh_token)}&redirect=${finalRedirect}`
        
        console.log('🔄 Redirecionando para callback:', callbackUrl)
        
        window.location.href = callbackUrl
        return
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setIsLoading(false)
      if (err?.message?.includes('Invalid login credentials') || err?.message?.includes('Invalid login')) {
        setError('Email ou senha inválidos.')
      } else if (err?.message?.includes('Email not confirmed') || err?.code === 'email_not_confirmed') {
        setError('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.')
      } else {
        setError(err?.message || 'Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.')
      }
    }
  }

  const handleForgotPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    router.push('/aluno/forgot-password')
  }

  // Logo component - usar logo_light_circle.svg que já vem em formato circular
  const logo = (
    <div className="relative mb-4 flex items-center justify-center lg:translate-x-4 max-w-full">
      <Image
        src="/logo_light_circle.svg"
        alt="Escola Nova Era Tech"
        width={96}
        height={96}
        quality={100}
        priority
        unoptimized={true}
        className="w-20 h-20 sm:w-24 sm:h-24"
        style={{
          imageRendering: 'auto' as const,
        }}
      />
    </div>
  )

  // Show loading while AuthContext is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#FBBF24' }}
        ></div>
      </div>
    )
  }

  return (
    <AlunoLoginAnimated
      formData={formData}
      isLoading={isLoading}
      error={error}
      successMessage={successMessage}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onForgotPassword={handleForgotPassword}
      logo={logo}
    />
  )
}

function AlunoLoginWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#FBBF24' }}
        ></div>
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

