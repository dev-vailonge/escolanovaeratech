'use client'

import { useState, useEffect } from 'react'
import type { DatabaseMentoriaTarefa } from '@/types/database'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

type MentoriaTarefasProps = {
  tarefas: DatabaseMentoriaTarefa[]
  canToggle?: boolean
  onToggleSuccess?: () => void
}

export function MentoriaTarefas({
  tarefas,
  canToggle = true,
  onToggleSuccess,
}: MentoriaTarefasProps) {
  const [localState, setLocalState] = useState(
    tarefas.map((t) => ({ id: t.id, concluida: t.concluida }))
  )
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    setLocalState(tarefas.map((t) => ({ id: t.id, concluida: t.concluida })))
  }, [tarefas])

  const handleToggle = async (id: string) => {
    if (!canToggle) return
    const current = localState.find((t) => t.id === id)?.concluida ?? false
    const next = !current
    setLocalState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, concluida: next } : t))
    )

    if (onToggleSuccess) {
      setPendingId(id)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return
        const res = await fetch(`/api/aluno/mentorias/tarefas/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ concluida: next }),
        })
        if (res.ok) onToggleSuccess()
        else setLocalState((prev) =>
          prev.map((t) => (t.id === id ? { ...t, concluida: current } : t))
        )
      } catch {
        setLocalState((prev) =>
          prev.map((t) => (t.id === id ? { ...t, concluida: current } : t))
        )
      } finally {
        setPendingId(null)
      }
    }
  }

  return (
    <ul className="space-y-3">
      {tarefas.map((tarefa) => {
        const local = localState.find((t) => t.id === tarefa.id)
        const concluida = local ? local.concluida : tarefa.concluida

        return (
          <li
            key={tarefa.id}
            className={cn('flex items-start gap-3 text-sm md:text-base', concluida ? 'text-green-400' : 'text-gray-200')}
          >
            <button
              type="button"
              onClick={() => handleToggle(tarefa.id)}
              disabled={!canToggle || pendingId === tarefa.id}
              className={cn(
                'mt-0.5 h-4 w-4 rounded border flex items-center justify-center text-[10px]',
                concluida
                  ? 'border-green-400 bg-green-500/20'
                  : 'border-gray-500 bg-black/40',
                canToggle &&
                  'hover:border-yellow-400 hover:bg-yellow-500/10 transition-colors'
              )}
            >
              {concluida ? '✓' : ''}
            </button>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-gray-100">
                {tarefa.titulo ?? tarefa.descricao}
              </p>
              {tarefa.descricao && (
                <p className="text-sm text-gray-400">
                  {tarefa.descricao}
                </p>
              )}
              {tarefa.links && tarefa.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {tarefa.links.map((link) => (
                    <a
                      key={link.label + link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium',
                        'border border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10 transition-colors'
                      )}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

