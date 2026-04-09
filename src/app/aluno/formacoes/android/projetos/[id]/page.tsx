'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  Server,
  Smartphone,
  Target,
  UserPlus,
  Users,
} from 'lucide-react'
import { ProjetoRealPhonePreview } from '@/components/formacao-android/ProjetoRealPhonePreview'
import { SubmittersFacepile } from '@/components/ui/SubmittersFacepile'
import type { FacepilePerson } from '@/components/ui/SubmittersFacepile'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/lib/AuthContext'
import { useFormacaoDesafioAccessGate } from '@/lib/hooks/useFormacaoDesafioAccessGate'
import { HOTMART_CURSOS } from '@/lib/constants/hotmart'
import {
  OBJETIVO_PRINCIPAL_PROJETOS_REAIS,
  TECH_AREAS_PROJETO_META,
  type FormacaoAndroidProjetoReal,
  type FormacaoAndroidTechAreaId,
} from '@/data/formacao-android-projetos'

type ParticipanteResumo = {
  user_id: string
  name: string
  avatar_url: string | null
  tech_area: string
}

const TECH_AREA_ORDER: FormacaoAndroidTechAreaId[] = [
  'android',
  'ios',
  'web',
  'backend',
  'data',
]

const ONBOARDING_TAREFAS_PROJETO: ReadonlyArray<{ label: string; href?: string }> = [
  {
    label: 'Assistir aulas Git & GitHub',
    href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/z7r2d1G07j?from=EditProductPage',
  },
  {
    label: 'Assistir aulas Git & GitHub avançado',
    href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/NOwAprwAem?from=EditProductPage',
  },
  {
    label: 'Assistir aulas Scrum',
    href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/kOXxgNoVOW?from=EditProductPage',
  },
  {
    label: 'Assistir aulas Kanban',
    href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/146qnjVwOd?from=EditProductPage',
  },
  {
    label: 'Ler o CONTRIBUTING do projeto',
    href: 'https://github.com/Escola-Nova-Era/BabyTracker/blob/main/CONTRIBUTING.md',
  },
  {
    label: 'Enviar mensagem no grupo do projeto avisando que entrou',
    href: 'https://discord.com/channels/1353076854189195264/1467457437467541740',
  },
  {
    label: 'Acessar o board de tarefas',
    href: 'https://github.com/orgs/Escola-Nova-Era/projects/1',
  },
]

const techIcons: Record<FormacaoAndroidTechAreaId, LucideIcon> = {
  android: Smartphone,
  ios: Apple,
  web: Globe,
  backend: Server,
  data: BarChart3,
}

export default function FormacaoAndroidProjetoDetalhePage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const [projeto, setProjeto] = useState<FormacaoAndroidProjetoReal | null>(null)
  const [participantesAlunos, setParticipantesAlunos] = useState<ParticipanteResumo[]>([])
  const [minhaParticipacao, setMinhaParticipacao] = useState<{ tech_area: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [joiningTech, setJoiningTech] = useState<FormacaoAndroidTechAreaId | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const { gate, requestValidation, validarModal } = useFormacaoDesafioAccessGate({
    hotmartSubdomain: HOTMART_CURSOS.android.subdomain,
  })

  const facepilePeople = useMemo<FacepilePerson[]>(() => {
    if (!projeto) return []
    const fromAlunos: FacepilePerson[] = participantesAlunos
      .filter((p) => typeof p.avatar_url === 'string' && p.avatar_url.trim().length > 0)
      .map((p) => ({
        id: p.user_id,
        name: p.name,
        avatarUrl: p.avatar_url,
      }))
    const fromTime = projeto.team.filter(
      (p) => typeof p.avatarUrl === 'string' && p.avatarUrl.trim().length > 0
    )
    return [...fromTime, ...fromAlunos]
  }, [projeto, participantesAlunos])

  const loadProjeto = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id?.trim()) {
      setProjeto(null)
      setParticipantesAlunos([])
      setMinhaParticipacao(null)
      if (!opts?.silent) setLoading(false)
      return
    }
    if (!opts?.silent) setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setProjeto(null)
        setParticipantesAlunos([])
        setMinhaParticipacao(null)
        return
      }
      const res = await fetch(`/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) {
        setProjeto(null)
        setParticipantesAlunos([])
        setMinhaParticipacao(null)
        return
      }
      setProjeto(json.projeto ?? null)
      setParticipantesAlunos(Array.isArray(json.participantesAlunos) ? json.participantesAlunos : [])
      setMinhaParticipacao(json.minhaParticipacao ?? null)
    } catch {
      setProjeto(null)
      setParticipantesAlunos([])
      setMinhaParticipacao(null)
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProjeto()
  }, [loadProjeto])

  const confirmParticipar = async (tech: FormacaoAndroidTechAreaId) => {
    if (!id?.trim()) return
    setJoiningTech(tech)
    setJoinError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setJoinError('Faça login novamente.')
        return
      }
      const res = await fetch(
        `/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/participar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tech_area: tech }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 403 && json?.code === 'FORMACAO_NAO_VALIDADA') {
          setJoinError('')
          setModalOpen(false)
          requestValidation(() => setModalOpen(true))
          return
        }
        setJoinError(typeof json?.error === 'string' ? json.error : 'Não foi possível participar.')
        return
      }
      setModalOpen(false)
      await loadProjeto({ silent: true })
    } catch {
      setJoinError('Erro de rede. Tente de novo.')
    } finally {
      setJoiningTech(null)
    }
  }

  const sairDoProjeto = async () => {
    if (!id?.trim() || leaving) return

    setLeaving(true)
    setLeaveError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setLeaveError('Faça login novamente.')
        return
      }
      const res = await fetch(
        `/api/aluno/projetos-reais/${encodeURIComponent(id.trim())}/sair`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLeaveError(typeof json?.error === 'string' ? json.error : 'Não foi possível sair do projeto.')
        return
      }
      setMinhaParticipacao(null)
      if (user?.id) {
        setParticipantesAlunos((prev) => prev.filter((p) => p.user_id !== user.id))
      }
      setLeaveModalOpen(false)
      await loadProjeto({ silent: true })
    } catch {
      setLeaveError('Erro de rede. Tente de novo.')
    } finally {
      setLeaving(false)
    }
  }

  if (loading) {
    return (
      <section className={cn('flex min-h-[50vh] items-center justify-center px-4 py-16', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#F2C94C] border-t-transparent" />
      </section>
    )
  }

  if (!projeto) {
    return (
      <section className={cn('min-h-[50vh] px-4 py-16', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
        <div className="mx-auto max-w-xl text-center">
          <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Projeto não encontrado
          </h1>
          <Link
            href="/aluno/projetos"
            className="mt-6 inline-flex items-center gap-2 text-[#F2C94C] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para projetos
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('min-h-[70vh]', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <Link
          href="/aluno/projetos"
          className={cn(
            'mb-8 inline-flex items-center gap-2 text-sm font-semibold transition-colors',
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Projetos reais
        </Link>

        <div
          className={cn(
            'overflow-hidden rounded-3xl border',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="md:flex">
            <div className="relative md:w-[42%] md:max-w-[340px] md:shrink-0">
              <ProjetoRealPhonePreview variant={projeto.preview} isDark={isDark} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-6 md:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F2C94C]">
                {projeto.detailBadge ?? 'Projeto real · Formação Android'}
              </p>
              <h1
                className={cn(
                  'mt-2 text-2xl font-black uppercase leading-tight tracking-tight md:text-3xl',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                {projeto.title}
              </h1>
              <p
                className={cn(
                  'mt-4 text-sm leading-relaxed md:text-base',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {projeto.detailLead ?? projeto.description}
              </p>
              {projeto.bullets.length > 0 ? (
                <ul className="mt-6 space-y-2">
                  {projeto.bullets.map((b) => (
                    <li
                      key={b}
                      className={cn(
                        'flex items-start gap-2.5 text-sm font-semibold',
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      )}
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F2C94C]" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                isDark ? 'bg-[#F2C94C]/15 text-[#F2C94C]' : 'bg-yellow-100 text-yellow-800'
              )}
            >
              <Target className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2
                className={cn(
                  'text-sm font-black uppercase tracking-[0.12em]',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                Objetivo principal
              </h2>
              <p
                className={cn(
                  'mt-2 text-sm leading-relaxed md:text-[0.95rem]',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {OBJETIVO_PRINCIPAL_PROJETOS_REAIS}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Users className={cn('h-5 w-5', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} />
            <h2
              className={cn(
                'text-sm font-black uppercase tracking-[0.12em]',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Quem está no projeto
            </h2>
          </div>
          <p
            className={cn(
              'mt-2 text-sm',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Pessoas que compartilham o código, revisões e rituais com você neste squad. Alunos da escola podem
            aparecer aqui ao se juntar ao projeto.
          </p>
          <div
            className={cn(
              'mt-4 rounded-2xl border p-4 md:p-5',
              minhaParticipacao
                ? isDark
                  ? 'border-green-500/35 bg-green-500/10'
                  : 'border-green-200 bg-green-50'
                : isDark
                  ? 'border-white/10 bg-[#0a0a0a]'
                  : 'border-gray-200 bg-gray-50/70'
            )}
          >
            <p className={cn('text-sm leading-relaxed', minhaParticipacao ? (isDark ? 'text-green-200' : 'text-green-900') : isDark ? 'text-gray-300' : 'text-gray-700')}>
              {minhaParticipacao ? (
                <>
                  <Check className="mr-1 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Você já participa deste projeto em{' '}
                  <strong>
                    {TECH_AREAS_PROJETO_META[minhaParticipacao.tech_area as FormacaoAndroidTechAreaId]?.label ??
                      minhaParticipacao.tech_area}
                  </strong>
                  . Seu avatar aparece no squad abaixo.
                </>
              ) : (
                'Você ainda não participa deste projeto. Entre para colaborar com o time, acessar o board e pegar sua primeira tarefa.'
              )}
            </p>
            <p className={cn('mt-2 text-xs', isDark ? 'text-gray-500' : 'text-gray-600')}>
              Mesma regra dos desafios da formação: você precisa comprovar matrícula na Formação Android (e-mail da Hotmart).
            </p>
          </div>

          <div
            className={cn(
              'mt-4 rounded-2xl border p-4 md:p-5',
              isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50/60'
            )}
          >
            <p className={cn('text-xs font-black uppercase tracking-[0.12em]', isDark ? 'text-white' : 'text-gray-900')}>
              Squad ativo
            </p>
            <p className={cn('mt-2 text-xs md:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Pessoas que estão colaborando neste projeto.
            </p>
            <div className="mt-4">
              <SubmittersFacepile people={facepilePeople} isDark={isDark} maxVisible={14} size="md" />
            </div>
          </div>

          {minhaParticipacao ? (
            <div
              className={cn(
                'mt-4 rounded-2xl border p-4 md:p-5',
                isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50/60'
              )}
            >
              <h3
                className={cn(
                  'text-xs font-black uppercase tracking-[0.12em]',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                Onboarding no projeto
              </h3>
              <p className={cn('mt-2 text-xs md:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Complete este checklist para acelerar sua integração no time.
              </p>
              <ul className="mt-4 list-disc space-y-2.5 pl-5">
                {ONBOARDING_TAREFAS_PROJETO.map((tarefa) => (
                  <li key={tarefa.label} className={cn('pl-0.5', isDark ? 'text-gray-300' : 'text-gray-800')}>
                    {tarefa.href ? (
                      <a
                        href={tarefa.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'inline-flex items-center gap-1.5 text-sm font-medium leading-relaxed underline decoration-dotted underline-offset-4 transition-colors',
                          isDark
                            ? 'text-[#F2C94C] hover:text-[#f7d875]'
                            : 'text-yellow-800 hover:text-yellow-900'
                        )}
                      >
                        {tarefa.label}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                      </a>
                    ) : (
                      <span className={cn('text-sm leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-800')}>
                        {tarefa.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={cn('mt-5 border-t pt-4', isDark ? 'border-white/10' : 'border-gray-200')}>
            {minhaParticipacao ? (
              <button
                type="button"
                onClick={() => {
                  setLeaveError(null)
                  setLeaveModalOpen(true)
                }}
                disabled={leaving}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60',
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-gray-900 text-white hover:bg-black'
                )}
              >
                {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {leaving ? 'Saindo...' : 'Sair do projeto'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setJoinError(null)
                  gate(() => setModalOpen(true))
                }}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors',
                  'bg-[#F2C94C] text-black hover:bg-[#e8bd3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2',
                  isDark ? 'focus-visible:ring-offset-[#0e0e0e]' : 'focus-visible:ring-offset-gray-100'
                )}
              >
                <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                Quero me juntar ao projeto
              </button>
            )}
          </div>

          <Modal
            isOpen={leaveModalOpen}
            onClose={() => {
              if (!leaving) {
                setLeaveModalOpen(false)
                setLeaveError(null)
              }
            }}
            title="Sair do projeto"
            size="sm"
          >
            <div
              className={cn(
                'rounded-2xl border p-4',
                isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'
              )}
            >
              <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Você será removido do squad deste projeto. Depois, se quiser voltar, basta entrar novamente.
              </p>
            </div>
            {leaveError ? (
              <p className="mt-3 text-sm text-red-500" role="alert">
                {leaveError}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveModalOpen(false)
                  setLeaveError(null)
                }}
                disabled={leaving}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60',
                  isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                )}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sairDoProjeto}
                disabled={leaving}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:opacity-60',
                  'bg-[#F2C94C] text-black hover:bg-[#e8bd3d]'
                )}
              >
                {leaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Confirmar saída
              </button>
            </div>
          </Modal>
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              if (!joiningTech) {
                setModalOpen(false)
                setJoinError(null)
              }
            }}
            title="Escolha sua tecnologia"
            size="md"
          >
            <p className={cn('mb-4 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Selecione em qual frente você quer colaborar neste projeto.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TECH_AREA_ORDER.map((key) => {
                const meta = TECH_AREAS_PROJETO_META[key]
                const Icon = techIcons[key]
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={joiningTech !== null}
                    onClick={() => confirmParticipar(key)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors',
                      isDark
                        ? 'border-white/15 bg-black/40 text-white hover:border-[#F2C94C]/50 hover:bg-white/5'
                        : 'border-gray-200 bg-gray-50 text-gray-900 hover:border-yellow-300 hover:bg-yellow-50/80',
                      joiningTech !== null && 'pointer-events-none opacity-60'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} />
                    <span>{meta.label}</span>
                    {joiningTech === key ? (
                      <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin opacity-90" />
                    ) : null}
                  </button>
                )
              })}
            </div>
            {joinError ? (
              <p className="mt-3 text-sm text-red-500" role="alert">
                {joinError}
              </p>
            ) : null}
          </Modal>
          {validarModal}
        </div>

        <div
          className={cn(
            'mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white'
          )}
        >
          <h2
            className={cn(
              'text-sm font-black uppercase tracking-[0.12em]',
              isDark ? 'text-white' : 'text-gray-900'
            )}
          >
            Tecnologias que temos
          </h2>
          <p
            className={cn(
              'mt-2 text-sm',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Ecossistema multidisciplinar para projetos que se aproximam do mercado.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projeto.techAreas.map((key) => {
              const meta = TECH_AREAS_PROJETO_META[key]
              const Icon = techIcons[key]
              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-2xl border p-4',
                    isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-gray-50/80'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4 shrink-0', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} />
                    <span className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {meta.label}
                    </span>
                  </div>
                  <p className={cn('mt-2 text-xs leading-relaxed', isDark ? 'text-gray-500' : 'text-gray-600')}>
                    {meta.short}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className={cn(
            'mb-10 mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <CalendarDays className={cn('h-5 w-5', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} />
            <h2
              className={cn(
                'text-sm font-black uppercase tracking-[0.12em]',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Nossos encontros e rituais
            </h2>
          </div>
          <p
            className={cn(
              'mt-2 text-sm',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Daylis, planejamento, sprint e momentos de revisão — o mesmo vocabulário que você verá em empresa.
          </p>
          <ul className="mt-6 space-y-4">
            {projeto.ceremonias.map((c) => (
              <li
                key={c.titulo}
                className={cn(
                  'rounded-2xl border p-4 md:p-5',
                  isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50/50'
                )}
              >
                <p className={cn('text-sm font-bold', isDark ? 'text-[#F2C94C]' : 'text-yellow-800')}>
                  {c.titulo}
                </p>
                <p
                  className={cn(
                    'mt-2 text-sm leading-relaxed',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  {c.descricao}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
