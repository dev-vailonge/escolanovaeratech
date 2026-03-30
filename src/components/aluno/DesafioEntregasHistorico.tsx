'use client'

import { Github, ExternalLink, Loader2, AlertCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConclusoesModuloLista } from '@/lib/hooks/useConclusoesModuloLista'
import { useAuth } from '@/lib/AuthContext'
import { getAuthToken } from '@/lib/getAuthToken'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

/** Texto automático antigo — não exibir como feedback na lista */
const LEGACY_ADMIN_NOTES_PLANO_COMMAND =
  'Enviado ao concluir o plano de estudos (Plano de estudos). XP creditado automaticamente após validação do repositório.'

function adminNotesParaExibir(notes: string | null | undefined): string | null {
  if (notes == null || typeof notes !== 'string') return null
  const t = notes.trim()
  if (t === '' || t === LEGACY_ADMIN_NOTES_PLANO_COMMAND) return null
  return t
}

function statusLabel(status: string) {
  if (status === 'rejeitado') return 'Rejeitado'
  if (status === 'pendente') return 'Aguardando revisão'
  return status
}

function statusBadgeClass(status: string, isDark: boolean) {
  if (status === 'rejeitado')
    return isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-800 border-red-200'
  return isDark ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-yellow-50 text-yellow-900 border-yellow-200'
}

type Props = {
  isDark: boolean
  containerClassName: string
  carregandoIdModulo: boolean
  cursosDesafioId: string | null | undefined
  userId: string | undefined
  semModuloId?: boolean
  precisaLogin?: boolean
}

export function DesafioEntregasHistorico({
  isDark,
  containerClassName,
  carregandoIdModulo,
  cursosDesafioId,
  userId,
  semModuloId,
  precisaLogin,
}: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const muted = isDark ? 'text-gray-400' : 'text-gray-600'
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; aluno: string } | null>(null)

  const listaEnabled = Boolean(userId && cursosDesafioId && !precisaLogin && !semModuloId)
  const listaQ = useConclusoesModuloLista(cursosDesafioId, listaEnabled)
  const isAdmin = user?.role === 'admin'

  const handleDelete = async (id: string) => {
    if (!isAdmin || deletingId) return

    setDeleteError('')
    setDeletingId(id)
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Não autenticado')
      const res = await fetch(`/api/admin/curso-desafio-conclusoes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'Não foi possível excluir o envio.')
      }
      await queryClient.invalidateQueries({ queryKey: ['conclusoes-modulo-lista'] })
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Não foi possível excluir o envio.')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  if (precisaLogin) {
    return (
      <div className={cn(containerClassName, 'py-10 text-center')}>
        <p className={cn('text-sm', muted)}>Entre na sua conta para ver o histórico de envios deste desafio.</p>
      </div>
    )
  }

  if (semModuloId) {
    return (
      <div className={cn(containerClassName, 'py-10 text-center')}>
        <p className={cn('text-sm', muted)}>
          Não foi possível identificar o módulo do curso para exibir conclusões. Verifique se o curso está carregado ou
          inicie um plano novo neste módulo.
        </p>
      </div>
    )
  }

  if (carregandoIdModulo && !cursosDesafioId) {
    return (
      <div className={cn(containerClassName, 'flex flex-col items-center justify-center gap-3 py-12')}>
        <Loader2 className={cn('h-8 w-8 animate-spin', isDark ? 'text-[#F2C94C]' : 'text-yellow-600')} />
        <p className={cn('text-sm', muted)}>Carregando…</p>
      </div>
    )
  }

  const lista = listaQ.data ?? []

  return (
    <div className={cn(containerClassName, 'space-y-4 p-5 text-left md:p-6')}>
      <h3
        id="desafio-envios-unificados"
        className={cn('text-base font-extrabold', isDark ? 'text-white' : 'text-gray-900')}
      >
        Envios registrados
      </h3>
      <p className={cn('text-sm', muted)}>
        Todos os alunos que enviaram o repositório neste módulo aparecem abaixo, com nome e foto quando disponíveis.
      </p>
      {deleteError ? (
        <p className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-700')}>{deleteError}</p>
      ) : null}

      {listaQ.isPending ? (
        <div className="flex items-center gap-2 py-6">
          <Loader2 className={cn('h-5 w-5 animate-spin', isDark ? 'text-[#F2C94C]' : 'text-yellow-600')} />
          <span className={cn('text-sm', muted)}>Carregando envios…</span>
        </div>
      ) : listaQ.isError ? (
        <div className="flex items-start gap-3 py-4">
          <AlertCircle className={cn('h-5 w-5 shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
          <p className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-800')}>
            {listaQ.error instanceof Error ? listaQ.error.message : 'Não foi possível carregar os envios.'} Tente de
            novo em instantes.
          </p>
        </div>
      ) : lista.length === 0 ? (
        <p className={cn('text-sm', muted)}>Ninguém registrou envio neste módulo ainda.</p>
      ) : (
        <ul
          className={cn(
            'divide-y',
            isDark ? 'divide-white/10' : 'divide-gray-200'
          )}
        >
          {lista.map((e) => {
            const isYou = userId && e.user_id === userId
            const displayName = e.userName?.trim() || 'Aluno'
            const feedbackTexto = adminNotesParaExibir(e.admin_notes)
            return (
              <li key={e.id} className="py-4">
                <div className="mb-3 flex flex-wrap items-start gap-3">
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2',
                      isDark ? 'border-white/15 bg-white/10' : 'border-gray-200 bg-gray-200'
                    )}
                  >
                    {e.userAvatarUrl ? (
                      <img src={e.userAvatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className={cn('h-6 w-6', muted)} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                      {displayName}
                      {isYou ? (
                        <span
                          className={cn(
                            'ml-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            isDark ? 'border-[#F2C94C]/50 text-[#F2C94C]' : 'border-yellow-600 text-yellow-800'
                          )}
                        >
                          Você
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {e.status !== 'aprovado' ? (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                            statusBadgeClass(e.status, isDark)
                          )}
                        >
                          {statusLabel(e.status)}
                        </span>
                      ) : null}
                      <span className={cn('text-xs', muted)}>
                        {new Date(e.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <a
                  href={e.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-2 break-all text-sm font-medium hover:underline',
                    isDark ? 'text-[#F2C94C]' : 'text-yellow-800'
                  )}
                >
                  <Github className="h-4 w-4 shrink-0" />
                  <span className="min-w-0">{e.github_url}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                </a>
                {feedbackTexto ? (
                  <p className={cn('mt-3 text-sm leading-relaxed', muted)}>
                    <span className="font-semibold text-inherit">Feedback: </span>
                    {feedbackTexto}
                  </p>
                ) : null}
                {isAdmin ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ id: e.id, aluno: displayName })}
                      disabled={deletingId === e.id}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-60',
                        isDark
                          ? 'border-red-400/40 text-red-300 hover:bg-red-500/10'
                          : 'border-red-300 text-red-700 hover:bg-red-50'
                      )}
                    >
                      {deletingId === e.id ? 'Excluindo...' : 'Excluir envio'}
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {deleteConfirm ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div
            className={cn(
              'w-full max-w-md rounded-xl border p-5',
              isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'
            )}
          >
            <h4 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Confirmar exclusão
            </h4>
            <p className={cn('mt-2 text-sm leading-relaxed', muted)}>
              Excluir o envio de <strong className="text-inherit">{deleteConfirm.aluno}</strong>? Esta ação remove o
              envio da base e também remove os pontos concedidos por esse envio.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={Boolean(deletingId)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-semibold',
                  isDark ? 'border-white/15 text-gray-200 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                )}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(deleteConfirm.id)}
                disabled={Boolean(deletingId)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-60',
                  isDark ? 'bg-red-500 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'
                )}
              >
                {deletingId ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
