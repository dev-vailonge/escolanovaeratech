'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { MentoriaTimeline } from './components/MentoriaTimeline'
import { supabase } from '@/lib/supabase'
import type { MentoriaWithSteps } from '@/types/database'

export default function MentoriasPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [mentoria, setMentoria] = useState<MentoriaWithSteps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMentoria = useCallback(async () => {
    try {
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setMentoria(null)
        return
      }

      const res = await fetch('/api/aluno/mentorias', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar')
      setMentoria(data.mentoria ?? null)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar mentoria')
      setMentoria(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMentoria()
  }, [loadMentoria])

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className={cn('animate-spin rounded-full h-10 w-10 border-2 border-t-transparent', isDark ? 'border-yellow-400' : 'border-yellow-600')} />
        <p className={cn('mt-3 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Carregando...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="max-w-2xl mx-auto text-center">
        <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
        <button
          type="button"
          onClick={() => { setLoading(true); loadMentoria(); }}
          className={cn('mt-3 px-4 py-2 rounded-lg text-sm font-medium', isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800')}
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  if (!mentoria) {
    return (
      <section className="max-w-2xl mx-auto min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/15 border border-yellow-400/50 text-yellow-300 shadow-lg shadow-yellow-500/30">
          <Sparkles className="w-9 h-9" />
        </div>
        <div className="space-y-3">
          <h1
            className={cn(
              'text-2xl md:text-3xl font-bold',
              isDark ? 'text-white' : 'text-gray-900'
            )}
          >
            Você ainda não faz parte de nenhuma mentoria.
          </h1>
          <p
            className={cn(
              'text-base md:text-lg',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}
          >
            Se deseja participar de uma mentoria individual com o Roque, preencha
            o formulário abaixo.
          </p>
        </div>
        <a
          href="https://forms.gle/uCTNWqSBsorDCRAz8"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
            'bg-yellow-500 text-black hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/30'
          )}
        >
          Solicitar Mentoria
        </a>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <h1
        className={cn(
          'text-3xl md:text-4xl font-bold',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        Mentoria
      </h1>
      <p
        className={cn(
          'text-base md:text-lg max-w-2xl',
          isDark ? 'text-gray-300' : 'text-gray-700'
        )}
      >
        Acompanhe sua evolução etapa por etapa na mentoria individual com o
        Roque.
      </p>

      <MentoriaTimeline mentoria={mentoria} onRefetch={loadMentoria} />
    </section>
  )
}
