'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, ChevronDown, Eye } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { MentoriaTimeline } from './components/MentoriaTimeline'
import { supabase } from '@/lib/supabase'
import type { MentoriaWithSteps } from '@/types/database'
import { adminMentoriaDetailToWithSteps } from './previewUtils'

type AdminMentoriaListItem = {
  id: string
  mentorado_id: string
  objetivo_principal: string
  status: string
  mentorado?: { id: string; name: string; email: string }
}

export default function MentoriasPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [mentoria, setMentoria] = useState<MentoriaWithSteps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** null = carregar mentoria do próprio usuário (API aluno) */
  const [previewMentoriaId, setPreviewMentoriaId] = useState<string | null>(null)
  const [adminMentoriasList, setAdminMentoriasList] = useState<AdminMentoriaListItem[]>([])
  const [loadingAdminList, setLoadingAdminList] = useState(false)

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [])

  const loadOwnMentoria = useCallback(async () => {
    const token = await getToken()
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
  }, [getToken])

  const loadPreviewMentoria = useCallback(
    async (mentoriaId: string) => {
      const token = await getToken()
      if (!token) {
        setMentoria(null)
        return
      }
      const res = await fetch(`/api/admin/mentorias/${mentoriaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar mentoria')
      setMentoria(adminMentoriaDetailToWithSteps(data as Record<string, unknown>))
    },
    [getToken]
  )

  const loadMentoria = useCallback(async () => {
    try {
      setError(null)
      if (isAdmin && previewMentoriaId) {
        await loadPreviewMentoria(previewMentoriaId)
      } else {
        await loadOwnMentoria()
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao carregar mentoria')
      setMentoria(null)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, previewMentoriaId, loadOwnMentoria, loadPreviewMentoria])

  useEffect(() => {
    setLoading(true)
    loadMentoria()
  }, [loadMentoria])

  useEffect(() => {
    if (!isAdmin) {
      setAdminMentoriasList([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoadingAdminList(true)
        const token = await getToken()
        if (!token || cancelled) return
        const res = await fetch('/api/admin/mentorias', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok || cancelled) return
        const list = (data.mentorias || []) as AdminMentoriaListItem[]
        const ativas = list.filter((m) => m.status === 'ativa')
        setAdminMentoriasList(ativas)
      } catch {
        if (!cancelled) setAdminMentoriasList([])
      } finally {
        if (!cancelled) setLoadingAdminList(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin, getToken])

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
          onClick={() => {
            setLoading(true)
            loadMentoria()
          }}
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
        {isAdmin && (
          <div
            className={cn(
              'w-full max-w-md text-left rounded-xl border p-4 space-y-2',
              isDark ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50'
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500">
              <Eye className="w-4 h-4 shrink-0" />
              Visualizar como aluno (admin)
            </div>
            <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Escolha um mentorado para ver a timeline e as etapas como ele vê. Somente leitura.
            </p>
            <div className="relative">
              <select
                value={previewMentoriaId ?? ''}
                disabled={loadingAdminList}
                onChange={(e) => {
                  const v = e.target.value
                  setPreviewMentoriaId(v === '' ? null : v)
                  setLoading(true)
                }}
                className={cn(
                  'w-full appearance-none rounded-lg border px-3 py-2.5 text-sm pr-9',
                  isDark ? 'bg-black/60 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                )}
              >
                <option value="">Minha mentoria (como aluno)</option>
                {adminMentoriasList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.mentorado?.name ?? m.mentorado_id} — {m.objetivo_principal.length > 48 ? `${m.objetivo_principal.slice(0, 48)}…` : m.objetivo_principal}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}

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

  const readOnlyPreview = Boolean(isAdmin && previewMentoriaId)

  return (
    <section className="space-y-6">
      {isAdmin && (
        <div
          className={cn(
            'rounded-xl border p-4 space-y-2',
            isDark ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-gray-50'
          )}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500">
            <Eye className="w-4 h-4 shrink-0" />
            Visualizar como aluno (admin)
          </div>
          <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Escolha um mentorado para ver a mesma interface que ele. Na pré-visualização, as tarefas não podem ser alteradas.
          </p>
          <div className="relative max-w-xl">
            <select
              value={previewMentoriaId ?? ''}
              disabled={loadingAdminList}
              onChange={(e) => {
                const v = e.target.value
                setPreviewMentoriaId(v === '' ? null : v)
                setLoading(true)
              }}
              className={cn(
                'w-full appearance-none rounded-lg border px-3 py-2.5 text-sm pr-9',
                isDark ? 'bg-black/60 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
              )}
            >
              <option value="">Minha mentoria (como aluno)</option>
              {adminMentoriasList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mentorado?.name ?? m.mentorado_id} — {m.objetivo_principal.length > 48 ? `${m.objetivo_principal.slice(0, 48)}…` : m.objetivo_principal}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}

      {readOnlyPreview && (
        <div
          className={cn(
            'rounded-lg border px-4 py-2 text-sm',
            isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-900'
          )}
        >
          Pré-visualização: visão de <strong>{mentoria.mentorado?.name ?? 'aluno'}</strong> (somente leitura).
        </div>
      )}

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

      <MentoriaTimeline
        key={mentoria.id}
        mentoria={mentoria}
        onRefetch={readOnlyPreview ? undefined : loadMentoria}
        readOnly={readOnlyPreview}
      />
    </section>
  )
}
