'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processando confirmação de email...')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Verificar se já tem sessão (pode ter sido criada automaticamente)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Se já tem sessão, criar usuário na tabela users e deslogar
        if (session && session.user) {
          console.log('✅ Sessão já existe, criando usuário na tabela users...')
          
          // Criar usuário na tabela users
          try {
            const userName = session.user.user_metadata?.name || 
                             session.user.user_metadata?.full_name || 
                             session.user.user_metadata?.display_name ||
                             session.user.email?.split('@')[0] || 
                             'Usuário'
            
            // Tentar criar via API primeiro
            const createResponse = await fetch('/api/users/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: session.user.id,
                email: session.user.email || '',
                name: userName,
                role: 'aluno',
                access_level: 'full'
              }),
            })
            
            const createResult = await createResponse.json()
            
            if (createResponse.ok && createResult.success) {
              console.log('✅ Usuário criado na tabela users após confirmação de email')
            } else if (createResult.code === 'MISSING_SERVICE_ROLE_KEY') {
              // Se não tiver service role key, tentar criar diretamente
              console.log('⚠️ Tentando criar usuário diretamente...')
              const { error: insertError } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: userName,
                  role: 'aluno',
                  access_level: 'full'
                })
              
              if (insertError) {
                console.warn('⚠️ Não foi possível criar usuário diretamente (RLS pode estar bloqueando):', insertError.message)
                console.warn('⚠️ O usuário será criado quando fizer login')
              } else {
                console.log('✅ Usuário criado diretamente na tabela users')
              }
            }
          } catch (createError: any) {
            console.warn('⚠️ Erro ao criar usuário na tabela users:', createError.message)
            console.warn('⚠️ O usuário será criado quando fizer login')
          }
          
          // Deslogar após criar usuário
          await supabase.auth.signOut()
          setStatus('success')
          setMessage('Email confirmado com sucesso! Redirecionando para login...')
          setTimeout(() => {
            router.push('/aluno/login?message=Email confirmado com sucesso! Faça login para continuar.')
          }, 2000)
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
            setStatus('error')
            setMessage('O link de confirmação expirou ou é inválido. Por favor, solicite um novo link ou faça login.')
          } else {
            setStatus('error')
            setMessage(errorDescription || 'Erro ao confirmar email. Tente fazer login.')
          }
          return
        }

        // Se tiver tokens na query, processar
        if (accessTokenQuery && refreshTokenQuery) {
          // Confirmar email e criar usuário na tabela users
          const { data, error } = await supabase.auth.setSession({
            access_token: accessTokenQuery,
            refresh_token: refreshTokenQuery,
          })

          if (error) {
            throw error
          }

          if (data?.session && data?.user) {
            console.log('✅ Email confirmado via query params')
            
            // Criar usuário na tabela users após confirmação
            try {
              const userName = data.user.user_metadata?.name || 
                               data.user.user_metadata?.full_name || 
                               data.user.user_metadata?.display_name ||
                               data.user.email?.split('@')[0] || 
                               'Usuário'
              
              // Tentar criar via API primeiro
              const createResponse = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: data.user.id,
                  email: data.user.email || '',
                  name: userName,
                  role: 'aluno',
                  access_level: 'full'
                }),
              })
              
              const createResult = await createResponse.json()
              
              if (createResponse.ok && createResult.success) {
                console.log('✅ Usuário criado na tabela users após confirmação de email')
              } else if (createResult.code === 'MISSING_SERVICE_ROLE_KEY') {
                // Se não tiver service role key, tentar criar diretamente
                console.log('⚠️ Tentando criar usuário diretamente...')
                const { error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: data.user.id,
                    email: data.user.email || '',
                    name: userName,
                    role: 'aluno',
                    access_level: 'full'
                  })
                
                if (insertError) {
                  console.warn('⚠️ Não foi possível criar usuário diretamente (RLS pode estar bloqueando):', insertError.message)
                  console.warn('⚠️ O usuário será criado quando fizer login')
                } else {
                  console.log('✅ Usuário criado diretamente na tabela users')
                }
              }
            } catch (createError: any) {
              console.warn('⚠️ Erro ao criar usuário na tabela users:', createError.message)
              console.warn('⚠️ O usuário será criado quando fizer login')
            }
            
            // Deslogar imediatamente após confirmar e criar usuário
            await supabase.auth.signOut()
            setStatus('success')
            setMessage('Email confirmado com sucesso! Redirecionando para login...')
            setTimeout(() => {
              router.push('/aluno/login?message=Email confirmado com sucesso! Faça login para continuar.')
            }, 2000)
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
              setStatus('error')
              setMessage('O link de confirmação expirou ou é inválido. Por favor, solicite um novo link ou faça login.')
            } else {
              setStatus('error')
              setMessage(hashErrorDescription || 'Erro ao confirmar email. Tente fazer login.')
            }
            return
          }

          if (accessToken && refreshToken) {
            // Confirmar email e criar usuário na tabela users
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) {
              throw error
            }

            if (data?.session && data?.user) {
              console.log('✅ Email confirmado via hash')
              
              // Criar usuário na tabela users após confirmação
              try {
                const userName = data.user.user_metadata?.name || 
                                 data.user.user_metadata?.full_name || 
                                 data.user.user_metadata?.display_name ||
                                 data.user.email?.split('@')[0] || 
                                 'Usuário'
                
                // Tentar criar via API primeiro
                const createResponse = await fetch('/api/users/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: data.user.id,
                    email: data.user.email || '',
                    name: userName,
                    role: 'aluno',
                    access_level: 'full'
                  }),
                })
                
                const createResult = await createResponse.json()
                
                if (createResponse.ok && createResult.success) {
                  console.log('✅ Usuário criado na tabela users após confirmação de email')
                } else if (createResult.code === 'MISSING_SERVICE_ROLE_KEY') {
                  // Se não tiver service role key, tentar criar diretamente
                  console.log('⚠️ Tentando criar usuário diretamente...')
                  const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                      id: data.user.id,
                      email: data.user.email || '',
                      name: userName,
                      role: 'aluno',
                      access_level: 'full'
                    })
                  
                  if (insertError) {
                    console.warn('⚠️ Não foi possível criar usuário diretamente (RLS pode estar bloqueando):', insertError.message)
                    console.warn('⚠️ O usuário será criado quando fizer login')
                  } else {
                    console.log('✅ Usuário criado diretamente na tabela users')
                  }
                }
              } catch (createError: any) {
                console.warn('⚠️ Erro ao criar usuário na tabela users:', createError.message)
                console.warn('⚠️ O usuário será criado quando fizer login')
              }
              
              // Deslogar imediatamente após confirmar e criar usuário
              await supabase.auth.signOut()
              setStatus('success')
              setMessage('Email confirmado com sucesso! Redirecionando para login...')
              setTimeout(() => {
                router.push('/aluno/login?message=Email confirmado com sucesso! Faça login para continuar.')
              }, 2000)
              return
            }
          }
        }

        // Se chegou aqui sem tokens nem erro, pode ser que o link já foi usado
        setStatus('error')
        setMessage('Link inválido ou já utilizado. Tente fazer login.')
      } catch (error: any) {
        console.error('Erro ao processar confirmação:', error)
        setStatus('error')
        setMessage(error?.message || 'Erro ao confirmar email. Tente fazer login.')
      }
    }

    handleEmailConfirmation()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/40 border border-white/10 rounded-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Confirmado!</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Erro na Confirmação</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <a
              href="/aluno/login"
              className="inline-block px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Ir para Login
            </a>
          </>
        )}
      </div>
    </div>
  )
}

