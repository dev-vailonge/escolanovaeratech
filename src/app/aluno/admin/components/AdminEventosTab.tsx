'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ALUNO_EVENTO_TIPO_LABELS } from '@/data/aluno-eventos'
import type { DatabaseAlunoEvento } from '@/types/database'
import AdminEventoFormModal from './AdminEventoFormModal'

function formatRange(start: string, end: string): string {
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '—'
  const dFmt = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const tFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dFmt.format(a)} · ${tFmt.format(a)} – ${tFmt.format(b)}`
}

export default function AdminEventosTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [eventos, setEventos] = useState<DatabaseAlunoEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<DatabaseAlunoEvento | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setEventos([])
        setError('Não autenticado')
        return
      }
      const res = await fetch('/api/admin/eventos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar eventos')
      setEventos(json.eventos ?? [])
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao carregar eventos')
      setEventos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir o evento "${title}"?`)) return
    setDeletingId(id)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')
      const res = await fetch(`/api/admin/eventos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erro ao excluir')
      await load()
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao excluir')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando eventos…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={cn('text-lg font-bold md:text-xl', isDark ? 'text-white' : 'text-gray-900')}>
            Eventos (área do aluno)
          </h2>
          <p className={cn('mt-1 text-xs md:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {eventos.length} evento{eventos.length !== 1 ? 's' : ''} cadastrado{eventos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setCreating(true)
          }}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors md:text-base',
            isDark ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-yellow-500 text-white hover:bg-yellow-600'
          )}
        >
          <Plus className="h-4 w-4" />
          Novo evento
        </button>
      </div>

      {error ? (
        <div
          className={cn(
            'rounded-lg border p-3 text-sm',
            isDark ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-800'
          )}
        >
          {error}
        </div>
      ) : null}

      <AdminEventoFormModal
        isOpen={creating || !!editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSaved={load}
        event={editing}
      />

      {eventos.length === 0 ? (
        <div
          className={cn(
            'rounded-xl border p-8 text-center text-sm',
            isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'
          )}
        >
          Nenhum evento cadastrado. Clique em &quot;Novo evento&quot;.
        </div>
      ) : (
        <ul className="space-y-3">
          {eventos.map((ev) => (
            <li
              key={ev.id}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                isDark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white/80'
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        isDark ? 'bg-yellow-400/20 text-yellow-200' : 'bg-yellow-100 text-yellow-900'
                      )}
                    >
                      {ALUNO_EVENTO_TIPO_LABELS[ev.tipo]}
                    </span>
                    {!ev.publicado ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        Rascunho
                      </span>
                    ) : null}
                  </div>
                  <h3 className={cn('font-semibold leading-snug', isDark ? 'text-white' : 'text-gray-900')}>
                    {ev.title}
                  </h3>
                  <p className={cn('text-xs md:text-sm', isDark ? 'text-gray-500' : 'text-gray-600')}>
                    {formatRange(ev.start_at, ev.end_at)}
                    {ev.series_label ? ` · ${ev.series_label}` : ''}
                  </p>
                  <p className={cn('text-xs md:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    {ev.description}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 sm:flex-col">
                  <button
                    type="button"
                    onClick={() => setEditing(ev)}
                    className={cn(
                      'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
                      isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                    )}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id, ev.title)}
                    disabled={deletingId === ev.id}
                    className={cn(
                      'inline-flex items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-50',
                      isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                    )}
                    title="Excluir"
                  >
                    {deletingId === ev.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
