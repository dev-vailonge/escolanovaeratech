'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { CalendarRange } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { getAuthToken } from '@/lib/getAuthToken'
import { useAuth } from '@/lib/AuthContext'
import { getFormacaoGateAdminTestFetchHeaders } from '@/lib/formacao/formacaoGateAdminTest'
import { ALUNO_PLANO_ATIVO_QUERY_KEY } from '@/lib/hooks/useAlunoPlanoEstudoAtivo'
import { ALUNO_PLANOS_HISTORICO_QUERY_KEY } from '@/lib/hooks/useAlunoPlanosEstudoHistorico'

const CURSO_SLUG_DEFAULT = 'android'

/** Opções fixas de prazo (dias). */
export const PLANO_DESAFIO_DIAS_PRESETS = [7, 10, 15] as const

export type PlanoDesafioDiasPreset = (typeof PLANO_DESAFIO_DIAS_PRESETS)[number]

type Props = {
  open: boolean
  onClose: () => void
  /** `slug` do módulo em `cursos_desafios` (ex.: id do app na URL). */
  moduloSlug: string
  cursoSlug?: string
  isDark: boolean
  /** Contexto opcional no texto (nome do desafio). */
  desafioLabel?: string
}

export default function IniciarDesafioPlanoModal({
  open,
  onClose,
  moduloSlug,
  cursoSlug = CURSO_SLUG_DEFAULT,
  isDark,
  desafioLabel,
}: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [diasSelecionados, setDiasSelecionados] = useState<PlanoDesafioDiasPreset>(7)
  const [planoLoading, setPlanoLoading] = useState(false)
  const [planoError, setPlanoError] = useState('')
  const [planoReplaceConfirm, setPlanoReplaceConfirm] = useState(false)

  const muted = isDark ? 'text-gray-400' : 'text-gray-600'
  const labelMuted = isDark ? 'text-gray-500' : 'text-gray-500'

  useEffect(() => {
    if (!open) return
    setDiasSelecionados(7)
    setPlanoError('')
    setPlanoReplaceConfirm(false)
  }, [open, moduloSlug])

  const criarPlanoEstudo = async (replaceActive: boolean) => {
    setPlanoError('')
    const dias = diasSelecionados

    setPlanoLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        setPlanoError('Faça login para criar seu plano de estudos.')
        return
      }

      const res = await fetch('/api/aluno/plano-estudo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...getFormacaoGateAdminTestFetchHeaders(user?.role === 'admin'),
        },
        body: JSON.stringify({
          curso_slug: cursoSlug,
          modulo_slug: moduloSlug,
          dias,
          replace_active: replaceActive,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.status === 409 && data?.code === 'ACTIVE_PLAN_EXISTS' && !replaceActive) {
        setPlanoReplaceConfirm(true)
        return
      }

      if (!res.ok) {
        if (res.status === 403 && data?.code === 'FORMACAO_NAO_VALIDADA') {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Valide sua matrícula na formação (e-mail da Hotmart) antes de criar o plano.'
          )
        }
        throw new Error(data?.error || 'Não foi possível criar o plano.')
      }

      onClose()
      setPlanoReplaceConfirm(false)
      void queryClient.invalidateQueries({ queryKey: ALUNO_PLANO_ATIVO_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ALUNO_PLANOS_HISTORICO_QUERY_KEY })
      router.push('/aluno/command')
    } catch (e: unknown) {
      setPlanoError(e instanceof Error ? e.message : 'Erro ao criar plano.')
    } finally {
      setPlanoLoading(false)
    }
  }

  const handleClose = () => {
    if (planoLoading) return
    onClose()
    setPlanoReplaceConfirm(false)
    setPlanoError('')
  }

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={planoReplaceConfirm ? 'Substituir plano ativo?' : 'Plano de estudos personalizado'}
      size="md"
    >
      <div className="space-y-4">
        {planoReplaceConfirm ? (
          <>
            <p className={cn('text-sm leading-relaxed', muted)}>
              Você já tem um plano de estudos em andamento. Desistir dele e criar um novo com base neste desafio?
            </p>
            <p className={cn('text-sm font-semibold', isDark ? 'text-amber-200' : 'text-amber-900')}>
              O progresso do plano anterior será arquivado.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={planoLoading}
                onClick={() => setPlanoReplaceConfirm(false)}
                className={cn(
                  'flex-1 rounded-xl border py-3 text-sm font-bold',
                  isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300'
                )}
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={planoLoading}
                onClick={() => void criarPlanoEstudo(true)}
                className="flex-1 rounded-xl bg-[#F2C94C] py-3 text-sm font-bold text-black hover:bg-[#f5d35c]"
              >
                {planoLoading ? 'Salvando…' : 'Sim, substituir'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={cn('text-sm leading-relaxed', muted)}>
              {desafioLabel ? (
                <>
                  <span className="font-semibold text-inherit">{desafioLabel}</span>
                  {' — '}
                </>
              ) : null}
              Escolha em quantos dias quer concluir o desafio: 7 (padrão), 10 ou 15. As aulas sugeridas serão
              distribuídas nesse período. O plano e o desafio atual aparecem no{' '}
              <strong className="text-inherit">Plano de estudos</strong>.
            </p>

            <div>
              <p className={cn('text-xs font-bold uppercase tracking-wide', labelMuted)}>Prazo do plano</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLANO_DESAFIO_DIAS_PRESETS.map((d) => {
                  const selected = diasSelecionados === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiasSelecionados(d)}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-sm font-extrabold transition-colors',
                        selected
                          ? 'border-[#F2C94C] bg-[#F2C94C] text-black'
                          : isDark
                            ? 'border-white/20 text-gray-200 hover:bg-white/10'
                            : 'border-gray-300 text-gray-800 hover:bg-gray-100'
                      )}
                    >
                      {d} dias{d === 7 ? ' · padrão' : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {planoError ? (
              <p className="text-sm text-red-500" role="alert">
                {planoError}
              </p>
            ) : null}
            <button
              type="button"
              disabled={planoLoading || !moduloSlug}
              onClick={() => void criarPlanoEstudo(false)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F2C94C] py-3.5 text-sm font-extrabold uppercase tracking-wide text-black hover:bg-[#f5d35c] disabled:opacity-50"
            >
              <CalendarRange className="h-4 w-4" aria-hidden />
              {planoLoading ? 'Gerando…' : 'Gerar plano e ir ao Plano de estudos'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
