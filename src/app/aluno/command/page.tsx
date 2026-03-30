'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  dayPlansFromAlunoPlano,
  isPlanFullyCompleted,
  MODULO_SLUG_ANDROID_10D_CHALLENGE,
  moduloSnapshotToFormacaoAndroidApp,
  normalizeProgress,
} from '@/lib/planoEstudoAluno'
import {
  useAlunoPlanoEstudoAtivo,
  useInvalidateAlunoPlanoAtivo,
} from '@/lib/hooks/useAlunoPlanoEstudoAtivo'
import { useAlunoPlanosEstudoHistorico } from '@/lib/hooks/useAlunoPlanosEstudoHistorico'
import {
  BookOpen,
  Check,
  Github,
  Target,
  ExternalLink,
  Zap,
  CheckCircle2,
  History,
  X,
} from 'lucide-react'
import type { DatabaseAlunoPlanoEstudo } from '@/types/database'
import { useAndroidCursoBundleQuery } from '@/lib/formacao/androidCursoFromDb'
import { DesafioEntregasHistorico } from '@/components/aluno/DesafioEntregasHistorico'
import { getFormacaoGateAdminTestFetchHeaders } from '@/lib/formacao/formacaoGateAdminTest'

type CommandDesafioTab = 'overview' | 'requisitos' | 'concluidos'

const COMMAND_DESAFIO_TABS: { id: CommandDesafioTab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'requisitos', label: 'Requisitos' },
  { id: 'concluidos', label: 'Concluídos' },
]

function lessonCheckRowKey(day: number, index: number, href: string, title: string) {
  return `${day}:${index}:${href || title}`
}

function lessonCheckStorageKey(userId: string, planId: string) {
  return `command-plano-aulas:${userId}:${planId}`
}

function formacaoModuloDetailHrefFromSnapshot(snap: {
  slug?: string
  curso_slug?: string
} | null | undefined): string {
  const moduloSlug = typeof snap?.slug === 'string' ? snap.slug : 'c1'
  const curso =
    typeof snap?.curso_slug === 'string' && snap.curso_slug.trim() !== ''
      ? snap.curso_slug.trim()
      : 'android'
  if (moduloSlug === MODULO_SLUG_ANDROID_10D_CHALLENGE) {
    return `/aluno/formacoes/${curso}#${MODULO_SLUG_ANDROID_10D_CHALLENGE}`
  }
  return `/aluno/formacoes/${curso}/apps/${moduloSlug}`
}

/** Tempo para o usuário ver os checks do dia antes de mudar para o próximo. */
const ADVANCE_DAY_DELAY_MS = 850

export default function CommandPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const androidBundleQ = useAndroidCursoBundleQuery()
  const {
    data: planoAtivoRes,
    refetch: refetchPlanoAtivo,
    isPending: planoAtivoLoading,
  } = useAlunoPlanoEstudoAtivo(Boolean(user), user?.id)
  const { data: historicoRes, isPending: historicoLoading } = useAlunoPlanosEstudoHistorico(
    Boolean(user),
    user?.id
  )
  const invalidatePlano = useInvalidateAlunoPlanoAtivo()

  const personalPlan =
    planoAtivoRes?.plan && planoAtivoRes.plan.status === 'active' ? planoAtivoRes.plan : null

  /** Apenas plano salvo no banco; sem fallback para jornada 10D. */
  const studyPlanDayPlans = useMemo(() => {
    if (!personalPlan) return []
    const fromDb = dayPlansFromAlunoPlano(personalPlan)
    if (fromDb.length > 0) return fromDb
    if (personalPlan.dias >= 1) {
      return Array.from({ length: personalPlan.dias }, (_, i) => ({
        day: i + 1,
        lessons: [] as { title: string; href: string; description: string }[],
      }))
    }
    return []
  }, [personalPlan])

  const planProgress = useMemo(
    () => (personalPlan ? normalizeProgress(personalPlan.progress) : { completedDays: [] as number[] }),
    [personalPlan]
  )

  const entregaGithubPendente = useMemo(() => {
    if (!personalPlan) return false
    if (!isPlanFullyCompleted(personalPlan.dias, planProgress)) return false
    const gh =
      typeof personalPlan.github_repo_url === 'string' ? personalPlan.github_repo_url.trim() : ''
    return gh.length === 0
  }, [personalPlan, planProgress])

  const [selectedDay, setSelectedDay] = useState(1)
  const [togglingDay, setTogglingDay] = useState(false)
  const [lessonLocalChecks, setLessonLocalChecks] = useState<Record<string, boolean>>({})
  const [commandDesafioTab, setCommandDesafioTab] = useState<CommandDesafioTab>('overview')
  const advanceDayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [planoGithubModalOpen, setPlanoGithubModalOpen] = useState(false)
  const [planoGithubModalPhase, setPlanoGithubModalPhase] = useState<'form' | 'success'>('form')
  const [planoGithubUrl, setPlanoGithubUrl] = useState('')
  const [planoGithubError, setPlanoGithubError] = useState('')
  const [planoGithubSubmitting, setPlanoGithubSubmitting] = useState(false)
  const [planoGithubXpGanho, setPlanoGithubXpGanho] = useState(0)
  const [planoGithubXpAlreadyClaimed, setPlanoGithubXpAlreadyClaimed] = useState(false)
  const prevEntregaGithubPendenteRef = useRef(false)

  useEffect(() => {
    if (!entregaGithubPendente) {
      prevEntregaGithubPendenteRef.current = false
      return
    }
    if (planoGithubSubmitting) {
      prevEntregaGithubPendenteRef.current = true
      return
    }
    if (!prevEntregaGithubPendenteRef.current) {
      setPlanoGithubModalOpen(true)
      setPlanoGithubModalPhase('form')
      setPlanoGithubUrl('')
      setPlanoGithubError('')
      setPlanoGithubXpAlreadyClaimed(false)
    }
    prevEntregaGithubPendenteRef.current = true
  }, [entregaGithubPendente, planoGithubSubmitting])

  const maxDay = useMemo(() => {
    if (personalPlan) return personalPlan.dias
    if (studyPlanDayPlans.length === 0) return 1
    return Math.max(...studyPlanDayPlans.map((d) => d.day))
  }, [personalPlan, studyPlanDayPlans])

  const clampedDay = Math.min(Math.max(selectedDay, 1), maxDay)

  useEffect(() => {
    setSelectedDay((d) => (d > maxDay ? maxDay : d < 1 ? 1 : d))
  }, [maxDay])

  useEffect(() => {
    if (!personalPlan) return
    const done = new Set(planProgress.completedDays)
    for (let d = 1; d <= personalPlan.dias; d++) {
      if (!done.has(d)) {
        setSelectedDay(d)
        return
      }
    }
    setSelectedDay(personalPlan.dias)
  }, [personalPlan?.id, personalPlan?.dias])

  useEffect(() => {
    if (!user?.id || !personalPlan?.id) {
      setLessonLocalChecks({})
      return
    }
    try {
      const raw = localStorage.getItem(lessonCheckStorageKey(user.id, personalPlan.id))
      setLessonLocalChecks(raw ? (JSON.parse(raw) as Record<string, boolean>) : {})
    } catch {
      setLessonLocalChecks({})
    }
  }, [user?.id, personalPlan?.id])

  useEffect(() => {
    return () => {
      if (advanceDayTimeoutRef.current) {
        clearTimeout(advanceDayTimeoutRef.current)
        advanceDayTimeoutRef.current = null
      }
    }
  }, [])

  const persistLessonChecks = (next: Record<string, boolean>) => {
    if (!user?.id || !personalPlan?.id) return
    try {
      localStorage.setItem(lessonCheckStorageKey(user.id, personalPlan.id), JSON.stringify(next))
    } catch {
      /* quota / private mode */
    }
  }

  const currentPlan = useMemo(() => {
    const hit = studyPlanDayPlans.find((d) => d.day === clampedDay)
    if (hit) return hit
    const fallback = studyPlanDayPlans[0] ?? {
      day: 1,
      lessons: [] as { title: string; href: string; description: string }[],
    }
    return fallback
  }, [clampedDay, studyPlanDayPlans])

  const nextPlan = studyPlanDayPlans.find((d) => d.day === clampedDay + 1)
  const afterNextPlan = studyPlanDayPlans.find((d) => d.day === clampedDay + 2)

  const firstLessonTitle = currentPlan?.lessons[0]?.title ?? '—'
  const focusTitle =
    currentPlan && currentPlan.lessons.length > 0
      ? `Dia ${clampedDay}: ${firstLessonTitle}`
      : `Dia ${clampedDay}`

  const pageBg = isDark ? 'bg-[#070707]' : 'bg-gray-100'
  const cardBg = isDark ? 'bg-[#121212] border-white/[0.08]' : 'bg-white border-gray-200'
  const muted = isDark ? 'text-gray-400' : 'text-gray-600'
  const heading = isDark ? 'text-white' : 'text-gray-900'

  const commandDesafioVisual = useMemo(() => {
    if (!personalPlan?.modulo_snapshot) return null
    return moduloSnapshotToFormacaoAndroidApp(personalPlan.modulo_snapshot)
  }, [personalPlan])

  const cursosDesafioIdParaConclusoes = useMemo(() => {
    const fromVisual = commandDesafioVisual?.cursosDesafioId
    if (typeof fromVisual === 'string' && fromVisual.trim() !== '') return fromVisual.trim()
    const snap = personalPlan?.modulo_snapshot
    if (!snap || typeof snap !== 'object') return null
    const o = snap as { slug?: string; cursos_desafio_id?: string | null }
    if (typeof o.cursos_desafio_id === 'string' && o.cursos_desafio_id.trim() !== '')
      return o.cursos_desafio_id.trim()
    const slug = typeof o.slug === 'string' ? o.slug : null
    if (!slug || !androidBundleQ.data?.modulos?.length) return null
    const row = androidBundleQ.data.modulos.find((m) => m.slug === slug)
    return row?.id ?? null
  }, [commandDesafioVisual?.cursosDesafioId, personalPlan?.modulo_snapshot, androidBundleQ.data?.modulos])

  const carregandoIdModulo = Boolean(
    user && commandDesafioVisual && !cursosDesafioIdParaConclusoes && androidBundleQ.isPending
  )

  const entregasSemModuloId = Boolean(
    user && commandDesafioVisual && !cursosDesafioIdParaConclusoes && !androidBundleQ.isPending
  )

  useEffect(() => {
    const snap = personalPlan?.modulo_snapshot
    const slug =
      snap && typeof snap === 'object' && 'slug' in snap && typeof (snap as { slug?: unknown }).slug === 'string'
        ? (snap as { slug: string }).slug
        : null
    const bundleRow =
      slug && androidBundleQ.data?.modulos
        ? androidBundleQ.data.modulos.find((m) => m.slug === slug)
        : undefined
    console.info('[Concluídos] Command — resolução cursos_desafio_id', {
      cursosDesafioIdParaConclusoes: cursosDesafioIdParaConclusoes ?? null,
      snapshotSlug: slug,
      snapshotCursosDesafioId:
        snap && typeof snap === 'object' && 'cursos_desafio_id' in snap
          ? (snap as { cursos_desafio_id?: string | null }).cursos_desafio_id ?? null
          : null,
      visualCursosDesafioId: commandDesafioVisual?.cursosDesafioId ?? null,
      bundleRowId: bundleRow?.id ?? null,
      bundlePending: androidBundleQ.isPending,
      carregandoIdModulo,
      entregasSemModuloId,
      temPlanoAtivo: Boolean(personalPlan),
    })
  }, [
    cursosDesafioIdParaConclusoes,
    personalPlan?.modulo_snapshot,
    androidBundleQ.data?.modulos,
    androidBundleQ.isPending,
    commandDesafioVisual?.cursosDesafioId,
    carregandoIdModulo,
    entregasSemModuloId,
    personalPlan,
  ])

  const desafioAppHref = personalPlan
    ? formacaoModuloDetailHrefFromSnapshot(
        personalPlan.modulo_snapshot as { slug?: string; curso_slug?: string }
      )
    : ''

  const planosHistorico = historicoRes?.plans ?? []

  const planoProgressStats = useMemo(() => {
    if (!personalPlan || studyPlanDayPlans.length === 0) {
      return { percent: 0, completedItems: 0, totalItems: 0 }
    }

    const completedDaysSet = new Set(planProgress.completedDays)
    let totalItems = 0
    let completedItems = 0

    for (const dayPlan of studyPlanDayPlans) {
      const lessonsCount = dayPlan.lessons.length
      const dayItems = lessonsCount > 0 ? lessonsCount : 1
      totalItems += dayItems

      if (completedDaysSet.has(dayPlan.day)) {
        completedItems += dayItems
        continue
      }

      if (lessonsCount > 0) {
        const dayChecked = dayPlan.lessons.reduce((acc, lesson, idx) => {
          const checked =
            lessonLocalChecks[lessonCheckRowKey(dayPlan.day, idx, lesson.href, lesson.title)] === true
          return acc + (checked ? 1 : 0)
        }, 0)
        completedItems += dayChecked
      }
    }

    const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    return { percent, completedItems, totalItems }
  }, [personalPlan, studyPlanDayPlans, planProgress.completedDays, lessonLocalChecks])

  const desafiosSugeridos = useMemo(() => {
    const modulos = androidBundleQ.data?.modulos ?? []
    if (modulos.length === 0) return [] as { slug: string; titulo: string; xp: number; href: string }[]

    const activeCursoSlug = (() => {
      const snap = personalPlan?.modulo_snapshot as { curso_slug?: string } | null | undefined
      if (typeof snap?.curso_slug === 'string' && snap.curso_slug.trim() !== '') {
        return snap.curso_slug.trim()
      }
      return 'android'
    })()

    const ordem = modulos.map((m) => ({ slug: m.slug, titulo: m.titulo, xp: m.xp, ordem: m.ordem }))
    const concluidos = new Set(
      planosHistorico
        .filter((p) => p.status === 'completed')
        .map((p) => {
          const snap = p.modulo_snapshot as { slug?: string; curso_slug?: string } | null
          const cursoSlug =
            typeof snap?.curso_slug === 'string' && snap.curso_slug.trim() !== ''
              ? snap.curso_slug.trim()
              : 'android'
          if (cursoSlug !== activeCursoSlug) return ''
          return typeof snap?.slug === 'string' ? snap.slug : ''
        })
        .filter(Boolean)
    )

    const activeSlug = (() => {
      const snap = personalPlan?.modulo_snapshot as { slug?: string } | null | undefined
      if (typeof snap?.slug === 'string' && snap.slug.trim() !== '') return snap.slug.trim()
      return null
    })()

    const baseIndex = activeSlug ? ordem.findIndex((m) => m.slug === activeSlug) : -1
    const orderedFromNext = baseIndex >= 0 ? ordem.slice(baseIndex + 1) : ordem
    const next = orderedFromNext.filter((m) => !concluidos.has(m.slug)).slice(0, 3)

    return next.map((m) => {
      const href =
        m.slug === MODULO_SLUG_ANDROID_10D_CHALLENGE
          ? `/aluno/formacoes/${activeCursoSlug}#10d-challenge`
          : `/aluno/formacoes/${activeCursoSlug}/apps/${m.slug}`
      return { slug: m.slug, titulo: m.titulo, xp: m.xp, href }
    })
  }, [androidBundleQ.data?.modulos, planosHistorico, personalPlan?.modulo_snapshot])

  function historicoItemMeta(row: DatabaseAlunoPlanoEstudo) {
    const snap = row.modulo_snapshot as { title?: string; slug?: string; curso_slug?: string } | null
    const title = typeof snap?.title === 'string' && snap.title.trim() !== '' ? snap.title : 'Desafio'
    const href = formacaoModuloDetailHrefFromSnapshot(snap)
    const ended = new Date(row.updated_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    return { title, href, ended }
  }

  const commitPlanoDayToggle = async (day: number, wantComplete: boolean, advanceAfterComplete: boolean) => {
    if (!personalPlan || togglingDay) return false
    const isDone = planProgress.completedDays.includes(day)
    if (wantComplete === isDone) return true

    setTogglingDay(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) return false
      const res = await fetch('/api/aluno/plano-estudo-ativo', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toggle_day: day }),
      })
      if (!res.ok) return false
      invalidatePlano()
      await refetchPlanoAtivo()
      if (wantComplete && !isDone && advanceAfterComplete) {
        const completed = new Set(planProgress.completedDays)
        completed.add(day)
        let nextD = day + 1
        while (nextD <= maxDay && completed.has(nextD)) nextD++
        const targetDay = nextD <= maxDay ? nextD : maxDay
        if (advanceDayTimeoutRef.current) clearTimeout(advanceDayTimeoutRef.current)
        advanceDayTimeoutRef.current = setTimeout(() => {
          advanceDayTimeoutRef.current = null
          setSelectedDay(targetDay)
        }, ADVANCE_DAY_DELAY_MS)
      }
      return true
    } finally {
      setTogglingDay(false)
    }
  }

  const handleEmptyPlanoDayToggle = () => {
    const isDone = planProgress.completedDays.includes(clampedDay)
    void commitPlanoDayToggle(clampedDay, !isDone, true)
  }

  const isPlanoLessonChecked = (
    day: number,
    index: number,
    href: string,
    title: string,
    serverDayDone: boolean
  ) => {
    if (serverDayDone) return true
    return lessonLocalChecks[lessonCheckRowKey(day, index, href, title)] === true
  }

  const togglePlanoLesson = async (lessonIndex: number, lesson: { href: string; title: string }) => {
    if (!personalPlan || togglingDay) return
    const day = clampedDay
    const lessons = currentPlan.lessons
    if (lessons.length === 0) return

    const key = lessonCheckRowKey(day, lessonIndex, lesson.href, lesson.title)
    const serverDone = planProgress.completedDays.includes(day)

    if (serverDone) {
      const ok = await commitPlanoDayToggle(day, false, false)
      if (!ok) return
      const next: Record<string, boolean> = { ...lessonLocalChecks }
      lessons.forEach((l, j) => {
        next[lessonCheckRowKey(day, j, l.href, l.title)] = j !== lessonIndex
      })
      setLessonLocalChecks(next)
      persistLessonChecks(next)
      return
    }

    const nextChecked = !(lessonLocalChecks[key] === true)
    const nextMap = { ...lessonLocalChecks, [key]: nextChecked }
    const allChecked = lessons.every((l, j) => {
      const k = lessonCheckRowKey(day, j, l.href, l.title)
      if (j === lessonIndex) return nextChecked
      return nextMap[k] === true
    })

    if (allChecked) {
      const ok = await commitPlanoDayToggle(day, true, true)
      if (ok) {
        const cleaned = { ...nextMap }
        lessons.forEach((l, j) => {
          delete cleaned[lessonCheckRowKey(day, j, l.href, l.title)]
        })
        setLessonLocalChecks(cleaned)
        persistLessonChecks(cleaned)
      }
      return
    }

    setLessonLocalChecks(nextMap)
    persistLessonChecks(nextMap)
  }

  // Mesma regra do hero na página de detalhe do módulo na formação.
  const commandDesafioHero = commandDesafioVisual
    ? {
        src: commandDesafioVisual.detailCoverSrc ?? commandDesafioVisual.coverSrc,
        isWide: Boolean(commandDesafioVisual.detailCoverSrc),
      }
    : null

  const handleSubmitPlanoGithub = async () => {
    setPlanoGithubError('')
    const url = planoGithubUrl.trim()
    if (!url) {
      setPlanoGithubError('Cole a URL do repositório no GitHub.')
      return
    }
    setPlanoGithubSubmitting(true)
    const controller = new AbortController()
    const requestTimeout = window.setTimeout(() => controller.abort(), 60_000)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setPlanoGithubError('Faça login novamente.')
        return
      }
      let res: Response
      try {
        res = await fetch('/api/aluno/plano-estudo-ativo/finalizar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...getFormacaoGateAdminTestFetchHeaders(user?.role === 'admin'),
          },
          body: JSON.stringify({ github_url: url }),
          signal: controller.signal,
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setPlanoGithubError(
            'A requisição demorou demais (timeout). Verifique sua conexão ou tente de novo em instantes.'
          )
        } else {
          setPlanoGithubError('Não foi possível conectar ao servidor. Tente novamente.')
        }
        return
      }

      let json: {
        error?: string
        xp_awarded?: number
        success?: boolean
        xp_already_claimed?: boolean
      } = {}
      try {
        const text = await res.text()
        json = text ? (JSON.parse(text) as typeof json) : {}
      } catch {
        setPlanoGithubError('Resposta inválida do servidor. Tente novamente.')
        return
      }

      if (!res.ok) {
        if (res.status === 403 && (json as { code?: string }).code === 'FORMACAO_NAO_VALIDADA') {
          setPlanoGithubError(
            typeof json.error === 'string'
              ? json.error
              : 'Valide sua matrícula na formação na página do desafio antes de enviar.'
          )
          return
        }
        setPlanoGithubError(json.error ?? 'Não foi possível finalizar o plano.')
        return
      }
      setPlanoGithubXpGanho(typeof json.xp_awarded === 'number' ? json.xp_awarded : 0)
      setPlanoGithubXpAlreadyClaimed(Boolean(json.xp_already_claimed))
      setPlanoGithubModalPhase('success')
      invalidatePlano()
      void refetchPlanoAtivo()
      void queryClient.invalidateQueries({ queryKey: ['conclusoes-modulo-lista'] })
    } finally {
      clearTimeout(requestTimeout)
      setPlanoGithubSubmitting(false)
    }
  }

  return (
    <div className={cn('min-h-screen pb-24 lg:pb-10', pageBg)}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-8 md:mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F2C94C]">
            Plano de estudos
          </p>
          <h1 className={cn('mt-1 text-3xl font-black tracking-tight md:text-4xl', heading)}>
            Plano, desafio atual e histórico
          </h1>
          <p className={cn('mt-2 max-w-2xl text-sm leading-relaxed md:text-base', muted)}>
            Acompanhe o cronograma do plano de estudos ativo, o desafio em que está trabalhando agora e o histórico de
            planos que você já concluiu ou encerrou na conta.
          </p>
        </div>

        <div className="space-y-6">
            {/* Plano de estudos atual — só dados do banco; vazio se não houver plano ativo */}
            <div
              className={cn(
                'rounded-2xl border border-l-4 border-l-[#F2C94C] p-5 md:p-6',
                cardBg,
                isDark ? 'border-white/[0.08]' : ''
              )}
            >
              <div className="mb-1 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className={cn('text-sm font-black uppercase tracking-[0.12em]', heading)}>
                    Plano de estudos atual
                  </h3>
                  {user && personalPlan ? (
                    <>
                      <p className={cn('mt-2 text-xs', muted)}>
                        Personalizado para{' '}
                        <span className="font-semibold text-inherit">{commandDesafioVisual?.title}</span>
                        {' · '}
                        {planProgress.completedDays.length}/{personalPlan.dias} dias
                      </p>
                      <div className="mt-1 min-w-0">
                        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
                          {studyPlanDayPlans.map(({ day }) => {
                            const dayDone = planProgress.completedDays.includes(day)
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                  'my-2 shrink-0 rounded-xl px-4 py-3.5 text-xs font-extrabold uppercase tracking-wide transition-all inline-flex items-center justify-center gap-2 min-h-[2.75rem]',
                                  clampedDay === day
                                    ? 'bg-[#F2C94C] text-black shadow-[0_0_24px_rgba(242,201,76,0.35)]'
                                    : isDark
                                      ? 'bg-[#1a1a1a] text-gray-300 hover:bg-white/10'
                                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300',
                                  dayDone && clampedDay !== day && 'ring-1 ring-[#F2C94C]/50'
                                )}
                              >
                                {dayDone ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                                Dia {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                {user && personalPlan ? (
                  <div
                    className="mb-4 flex shrink-0 items-center gap-5"
                    aria-label={`Progresso do plano: ${planoProgressStats.percent}%`}
                  >
                    {(() => {
                      const size = 132
                      const stroke = 12
                      const radius = (size - stroke) / 2
                      const circumference = 2 * Math.PI * radius
                      const progressOffset =
                        circumference - (planoProgressStats.percent / 100) * circumference
                      return (
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(17,24,39,0.18)'}
                            strokeWidth={stroke}
                          />
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#F2C94C"
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={progressOffset}
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                          />
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={cn('text-[20px] font-black', isDark ? 'fill-white' : 'fill-gray-900')}
                          >
                            {planoProgressStats.percent}%
                          </text>
                        </svg>
                      )
                    })()}
                    <div className="min-w-0">
                      <p className={cn('text-xs font-extrabold uppercase tracking-[0.18em] text-[#F2C94C]')}>
                        Progresso
                      </p>
                      <p className={cn('text-base font-semibold', muted)}>
                        {planoProgressStats.completedItems}/{planoProgressStats.totalItems} etapas
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {entregaGithubPendente && !planoGithubModalOpen ? (
                <div
                  className={cn(
                    'mb-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
                    isDark ? 'border-[#F2C94C]/40 bg-[#F2C94C]/10' : 'border-amber-200 bg-amber-50'
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn('text-sm font-bold', heading)}>Última etapa: envie seu repositório</p>
                    <p className={cn('mt-1 text-xs leading-relaxed', muted)}>
                      Você concluiu todos os dias. Informe a URL pública do GitHub para registrar a entrega, receber XP e
                      concluir o desafio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPlanoGithubModalOpen(true)
                      setPlanoGithubModalPhase('form')
                      setPlanoGithubError('')
                      setPlanoGithubXpAlreadyClaimed(false)
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F2C94C] px-4 py-2.5 text-sm font-extrabold text-black transition-colors hover:bg-[#f5d35c]"
                  >
                    <Github className="h-4 w-4" aria-hidden />
                    Enviar link do GitHub
                  </button>
                </div>
              ) : null}

              {user && planoAtivoLoading ? (
                <div className="py-10 text-center">
                  <div
                    className={cn(
                      'mx-auto h-10 w-10 animate-pulse rounded-full border-2 border-[#F2C94C]/40',
                      isDark ? 'bg-white/5' : 'bg-gray-100'
                    )}
                    aria-hidden
                  />
                  <p className={cn('mt-4 text-sm', muted)}>Carregando seu plano de estudos…</p>
                </div>
              ) : !user ? (
                <div
                  className={cn(
                    'mt-4 rounded-xl border border-dashed p-8 text-center',
                    isDark ? 'border-white/15 bg-black/20' : 'border-gray-300 bg-gray-50/80'
                  )}
                >
                  <BookOpen className="mx-auto h-11 w-11 text-[#F2C94C]/70" aria-hidden />
                  <p className={cn('mt-4 text-base font-bold', heading)}>Entre para ver seu plano</p>
                  <p className={cn('mx-auto mt-2 max-w-md text-sm leading-relaxed', muted)}>
                    Faça login para carregar um plano de estudos ativo da sua conta. Você pode iniciar um plano a partir
                    dos desafios disponíveis na área do aluno.
                  </p>
                  <Link
                    href="/aluno/login"
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#F2C94C] px-5 py-2.5 text-sm font-extrabold text-black transition-colors hover:bg-[#f5d35c]"
                  >
                    Entrar
                  </Link>
                </div>
              ) : !personalPlan ? (
                <div
                  className={cn(
                    'mt-4 rounded-xl border border-dashed p-8 text-center',
                    isDark ? 'border-white/15 bg-black/20' : 'border-gray-300 bg-gray-50/80'
                  )}
                >
                  <BookOpen className="mx-auto h-11 w-11 text-[#F2C94C]/70" aria-hidden />
                  <p className={cn('mt-4 text-base font-bold', heading)}>Nenhum plano de estudos ativo</p>
                  <p className={cn('mx-auto mt-2 max-w-md text-sm leading-relaxed', muted)}>
                    Você ainda não iniciou um plano personalizado. Abra um desafio, use &quot;Fazer desafio&quot; e
                    escolha em quantos dias quer estudar — seu cronograma aparecerá aqui automaticamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    <div
                      className={cn(
                        'rounded-xl border p-5 md:p-6',
                        isDark ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50/70'
                      )}
                    >
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#F2C94C]">
                        Conteúdo do dia
                      </p>
                      <h4 className={cn('mt-2 text-lg font-bold md:text-xl', heading)}>{focusTitle}</h4>
                      {currentPlan.lessons.length > 0 ? (
                        <p className={cn('mt-2 text-xs leading-relaxed', muted)}>
                          Marque cada aula ao concluir. O dia só é registrado como concluído quando todas estiverem
                          marcadas.
                        </p>
                      ) : null}
                      <ul
                        className={cn(
                          'mt-5 space-y-0 divide-y overflow-hidden rounded-xl border',
                          isDark
                            ? 'divide-white/10 border-white/10'
                            : 'divide-gray-200 border-gray-200'
                        )}
                      >
                        {currentPlan.lessons.length === 0 ? (
                          <li
                            className={cn(
                              'flex items-center gap-4 px-4 py-3.5',
                              isDark ? 'bg-black/25' : 'bg-gray-50/80'
                            )}
                          >
                            <button
                              type="button"
                              disabled={togglingDay}
                              onClick={() => handleEmptyPlanoDayToggle()}
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded border transition-colors disabled:opacity-50',
                                planProgress.completedDays.includes(clampedDay)
                                  ? 'border-[#F2C94C] bg-[#F2C94C] text-black'
                                  : isDark
                                    ? 'border-white/25 bg-transparent hover:border-white/40'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                              )}
                              aria-pressed={planProgress.completedDays.includes(clampedDay)}
                              aria-label={
                                planProgress.completedDays.includes(clampedDay)
                                  ? 'Dia concluído. Clique para desmarcar'
                                  : 'Marcar dia como concluído'
                              }
                            >
                              {planProgress.completedDays.includes(clampedDay) ? (
                                <Check className="h-4 w-4 stroke-[2.5]" aria-hidden />
                              ) : null}
                            </button>
                            <p className={cn('min-w-0 flex-1 text-sm', muted)}>
                              Nenhuma aula listada para este dia — use o check quando concluir o que combinou estudar.
                            </p>
                          </li>
                        ) : (
                          currentPlan.lessons.map((lesson, i) => {
                            const serverDayDone = planProgress.completedDays.includes(clampedDay)
                            const rowChecked = isPlanoLessonChecked(
                              clampedDay,
                              i,
                              lesson.href,
                              lesson.title,
                              serverDayDone
                            )
                            return (
                              <li
                                key={`${clampedDay}-${i}-${lesson.href}`}
                                className={cn(
                                  'flex items-center gap-4 px-4 py-3.5',
                                  isDark ? 'bg-black/25' : 'bg-gray-50/80'
                                )}
                              >
                                <button
                                  type="button"
                                  disabled={togglingDay}
                                  onClick={() => void togglePlanoLesson(i, lesson)}
                                  className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded border transition-colors disabled:opacity-50',
                                    rowChecked
                                      ? 'border-[#F2C94C] bg-[#F2C94C] text-black'
                                      : isDark
                                        ? 'border-white/25 bg-transparent hover:border-white/40'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                  )}
                                  aria-pressed={rowChecked}
                                  aria-label={
                                    rowChecked
                                      ? `Aula concluída: ${lesson.title}. Clique para desmarcar`
                                      : `Marcar aula como concluída: ${lesson.title}`
                                  }
                                >
                                  {rowChecked ? <Check className="h-4 w-4 stroke-[2.5]" aria-hidden /> : null}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <a
                                    href={lesson.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-[#F2C94C] underline-offset-2 hover:underline"
                                  >
                                    {lesson.title}
                                  </a>
                                </div>
                              </li>
                            )
                          })
                        )}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                      {nextPlan && (
                        <div
                          className={cn(
                            'rounded-xl border p-4',
                            isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'
                          )}
                        >
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#F2C94C]">
                            Em seguida · Dia {nextPlan.day}
                          </p>
                          <p className={cn('mt-2 text-sm font-bold', heading)}>
                            {nextPlan.lessons[0]?.title ?? `Dia ${nextPlan.day}`}
                          </p>
                        </div>
                      )}
                      {afterNextPlan && (
                        <div
                          className={cn(
                            'rounded-xl border p-4 opacity-95',
                            isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'
                          )}
                        >
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">
                            Dia {afterNextPlan.day}
                          </p>
                          <p className={cn('mt-2 text-sm font-bold', heading)}>
                            {afterNextPlan.lessons[0]?.title ?? `Dia ${afterNextPlan.day}`}
                          </p>
                        </div>
                      )}
                      {!nextPlan && (
                        <div
                          className={cn(
                            'rounded-xl border p-4',
                            isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'
                          )}
                        >
                          <p className={cn('text-sm', muted)}>Últimos dias do plano — conclua o desafio.</p>
                          <Link
                            href={desafioAppHref}
                            className="mt-3 inline-flex text-sm font-bold text-[#F2C94C] hover:underline"
                          >
                            Ir para o desafio
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {user && !planoAtivoLoading && personalPlan && (
              <div
                className={cn(
                  'rounded-2xl border border-l-4 border-l-[#F2C94C] p-5 md:p-6',
                  cardBg,
                  isDark ? 'border-white/[0.08]' : ''
                )}
              >
                <h3 className={cn('mb-1 text-sm font-black uppercase tracking-[0.12em]', heading)}>
                  Próximos desafios sugeridos
                </h3>
                <p className={cn('mb-4 text-xs leading-relaxed', muted)}>
                  Sugestões na ordem recomendada da formação para você pegar os próximos desafios.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {desafiosSugeridos.length > 0 ? (
                    desafiosSugeridos.map((d, idx) => (
                      <Link
                        key={d.slug}
                        href={d.href}
                        className={cn(
                          'rounded-xl border p-4 transition-colors',
                          isDark
                            ? 'border-white/10 bg-black/20 hover:border-[#F2C94C]/60'
                            : 'border-gray-200 bg-white hover:border-yellow-300'
                        )}
                      >
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#F2C94C]">
                          Sugestão #{idx + 1}
                        </p>
                        <p className={cn('mt-2 line-clamp-2 text-sm font-bold leading-snug', heading)}>
                          {d.titulo}
                        </p>
                        <p className={cn('mt-1 text-xs', muted)}>+{d.xp} XP</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#F2C94C]">
                          Ver desafio
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div
                      className={cn(
                        'rounded-xl border border-dashed p-4 text-sm sm:col-span-2 lg:col-span-3',
                        isDark
                          ? 'border-white/15 bg-black/20 text-gray-300'
                          : 'border-gray-300 bg-gray-50 text-gray-700'
                      )}
                    >
                      Você já concluiu os próximos desafios recomendados. Abra a formação para escolher um novo módulo.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desafio atual — vinculado ao plano ativo */}
            <div
              className={cn(
                'rounded-2xl border border-l-4 border-l-[#F2C94C] p-5 md:p-6',
                cardBg,
                isDark ? 'border-white/[0.08]' : ''
              )}
            >
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 shrink-0 text-[#F2C94C]" aria-hidden />
                <h3 className={cn('text-sm font-black uppercase tracking-[0.12em]', heading)}>
                  Desafio atual
                </h3>
              </div>

              <div className="mt-5">
                <div className="min-w-0 space-y-6">
                  {user && planoAtivoLoading ? (
                    <div className="py-10 text-center">
                      <div
                        className={cn(
                          'mx-auto h-10 w-10 animate-pulse rounded-full border-2 border-[#F2C94C]/40',
                          isDark ? 'bg-white/5' : 'bg-gray-100'
                        )}
                        aria-hidden
                      />
                      <p className={cn('mt-4 text-sm', muted)}>Carregando desafio em foco…</p>
                    </div>
                  ) : null}
                  {!user ? (
                    <div
                      className={cn(
                        'rounded-xl border border-dashed p-8 text-center',
                        isDark ? 'border-white/15 bg-black/20' : 'border-gray-300 bg-gray-50/80'
                      )}
                    >
                      <Target className="mx-auto h-11 w-11 text-[#F2C94C]/70" aria-hidden />
                      <p className={cn('mt-4 text-base font-bold', heading)}>Nenhum desafio em foco</p>
                      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-relaxed', muted)}>
                        Entre na sua conta para ver o desafio vinculado ao seu plano de estudos ativo.
                      </p>
                      <Link
                        href="/aluno/login"
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#F2C94C] px-5 py-2.5 text-sm font-extrabold text-black transition-colors hover:bg-[#f5d35c]"
                      >
                        Entrar
                      </Link>
                    </div>
                  ) : null}
                  {user && !planoAtivoLoading && !personalPlan ? (
                    <div
                      className={cn(
                        'rounded-xl border border-dashed p-8 text-center',
                        isDark ? 'border-white/15 bg-black/20' : 'border-gray-300 bg-gray-50/80'
                      )}
                    >
                      <Target className="mx-auto h-11 w-11 text-[#F2C94C]/70" aria-hidden />
                      <p className={cn('mt-4 text-base font-bold', heading)}>Nenhum desafio atual</p>
                      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-relaxed', muted)}>
                        Você não tem um plano de estudos ativo. Inicie um desafio com &quot;Fazer desafio&quot; para ver
                        o módulo em foco aqui.
                      </p>
                    </div>
                  ) : null}
                  {user && personalPlan && !commandDesafioVisual ? (
                    <div
                      className={cn(
                        'rounded-xl border border-dashed p-8 text-center',
                        isDark ? 'border-white/15 bg-black/20' : 'border-gray-300 bg-gray-50/80'
                      )}
                    >
                      <p className={cn('text-sm font-semibold', heading)}>Detalhes indisponíveis</p>
                      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-relaxed', muted)}>
                        Não foi possível carregar a ficha deste desafio. Abra a página do módulo para ver requisitos e
                        materiais completos.
                      </p>
                      <Link
                        href={desafioAppHref}
                        className="mt-6 inline-flex text-sm font-bold text-[#F2C94C] hover:underline"
                      >
                        Abrir página do desafio
                      </Link>
                    </div>
                  ) : null}
                  {commandDesafioVisual ? (
                    <article
                      className={cn(
                        'w-full overflow-hidden rounded-2xl border shadow-xl sm:rounded-3xl',
                        isDark ? 'border-white/10' : 'border-gray-200 shadow-sm'
                      )}
                    >
                    {commandDesafioHero?.src ? (
                      <div className="bg-[#e8eee8] p-4 sm:p-5 md:p-6">
                        <div
                          className={cn(
                            'relative mx-auto w-full overflow-hidden rounded-2xl sm:rounded-[1.25rem] border bg-[#e8eee8]',
                            isDark ? 'border-white/15' : 'border-gray-200',
                            commandDesafioHero.isWide
                              ? 'min-h-[200px] max-h-[420px] aspect-[2.35/1]'
                              : 'max-h-[340px] min-h-[200px] aspect-[16/10]'
                          )}
                        >
                          <Image
                            src={commandDesafioHero.src}
                            alt={commandDesafioVisual.title}
                            fill
                            className={
                              commandDesafioHero.isWide
                                ? 'object-contain object-center'
                                : 'object-cover object-top'
                            }
                            sizes="(max-width: 1024px) 100vw, 65vw"
                          />
                        </div>
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        'space-y-4 px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8',
                        isDark ? 'bg-black' : 'bg-gray-950 text-white'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide',
                          isDark
                            ? 'border-[#F2C94C]/60 bg-black text-[#F2C94C]'
                            : 'border-[#F2C94C]/70 bg-black text-[#F2C94C]'
                        )}
                      >
                        <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {commandDesafioVisual.difficulty.toUpperCase()}
                      </span>

                      <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl md:text-3xl md:leading-[1.1]">
                        {commandDesafioVisual.heroTitle}
                      </h2>

                      <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
                        {commandDesafioVisual.summary}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {commandDesafioVisual.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex rounded-full border border-white/25 bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="border-t border-white/10 pt-6">
                        <nav
                          className="-mx-1 flex flex-wrap gap-2 border-b border-[#F2C94C]/50 sm:gap-8"
                          aria-label="Seções do desafio"
                        >
                          {COMMAND_DESAFIO_TABS.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setCommandDesafioTab(tab.id)}
                              className={cn(
                                'px-1 pb-3 text-xs font-extrabold uppercase tracking-wide transition-colors sm:text-sm',
                                commandDesafioTab === tab.id
                                  ? 'border-b-2 border-[#F2C94C] text-[#F2C94C] -mb-px'
                                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-300'
                              )}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </nav>

                        <div className="mt-6">
                          {commandDesafioTab === 'overview' && (
                            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                              <div
                                className={cn(
                                  'rounded-2xl border p-5 md:p-6',
                                  isDark ? 'border-white/10 bg-[#121212]' : 'border-white/10 bg-black/50'
                                )}
                              >
                                <h3 className="mb-3 text-base font-extrabold text-white">Objetivo do app</h3>
                                <p className="text-sm leading-relaxed text-gray-400">
                                  {commandDesafioVisual.objective}
                                </p>
                              </div>
                              <div
                                className={cn(
                                  'rounded-2xl border p-5 md:p-6',
                                  isDark ? 'border-white/10 bg-[#121212]' : 'border-white/10 bg-black/50'
                                )}
                              >
                                <h3 className="mb-3 text-base font-extrabold text-white">
                                  O que você vai praticar
                                </h3>
                                <ul className="space-y-3">
                                  {commandDesafioVisual.practiceItems.map((item) => (
                                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-400">
                                      <CheckCircle2
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[#F2C94C]"
                                        aria-hidden
                                      />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {commandDesafioTab === 'requisitos' && (
                            <div
                              className={cn(
                                'rounded-2xl border p-5 md:p-6',
                                isDark ? 'border-white/10 bg-[#121212]' : 'border-white/10 bg-black/50'
                              )}
                            >
                              <h3 className="mb-4 text-base font-extrabold text-white">Requisitos para entrega</h3>
                              <ul className="space-y-3">
                                {commandDesafioVisual.requirements.map((req) => (
                                  <li key={req} className="flex gap-2 text-sm leading-relaxed text-gray-400">
                                    <span className="font-bold text-[#F2C94C]">—</span>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {commandDesafioTab === 'concluidos' && (
                            <DesafioEntregasHistorico
                              isDark
                              containerClassName={cn(
                                'rounded-2xl border',
                                isDark ? 'border-white/10 bg-[#121212]' : 'border-white/10 bg-black/50'
                              )}
                              carregandoIdModulo={carregandoIdModulo}
                              cursosDesafioId={cursosDesafioIdParaConclusoes}
                              userId={user?.id}
                              semModuloId={entregasSemModuloId}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    </article>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#F2C94C]">
                  Desafios feitos
                </p>
                <p className={cn('text-xs leading-snug', muted)}>
                  Desafios que você concluiu ou encerrou ao trocar de plano.
                </p>
                {!user ? (
                  <div
                    className={cn(
                      'rounded-xl border p-4 text-center',
                      isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'
                    )}
                  >
                    <History className="mx-auto h-8 w-8 text-[#F2C94C]/60" aria-hidden />
                    <p className={cn('mt-3 text-sm font-semibold', heading)}>Histórico na conta</p>
                    <p className={cn('mt-1 text-xs leading-relaxed', muted)}>
                      Entre para ver os desafios que você já finalizou.
                    </p>
                    <Link
                      href="/aluno/login"
                      className="mt-3 inline-flex text-xs font-bold text-[#F2C94C] hover:underline"
                    >
                      Entrar
                    </Link>
                  </div>
                ) : historicoLoading ? (
                  <div
                    className={cn(
                      'rounded-xl border p-4',
                      isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'
                    )}
                  >
                    <div
                      className={cn('h-16 animate-pulse rounded-lg', isDark ? 'bg-white/5' : 'bg-gray-100')}
                      aria-hidden
                    />
                    <p className={cn('mt-3 text-center text-xs', muted)}>Carregando histórico…</p>
                  </div>
                ) : planosHistorico.length === 0 ? (
                  <div
                    className={cn(
                      'rounded-xl border border-dashed p-4 text-center',
                      isDark ? 'border-white/15 bg-black/20' : 'border-gray-300 bg-gray-50/80'
                    )}
                  >
                    <History className="mx-auto h-8 w-8 text-[#F2C94C]/50" aria-hidden />
                    <p className={cn('mt-3 text-sm font-semibold', heading)}>Nada por aqui ainda</p>
                    <p className={cn('mt-1 text-xs leading-relaxed', muted)}>
                      Quando você concluir um plano ou começar outro desafio, a lista aparece aqui.
                    </p>
                  </div>
                ) : (
                  <ul className="flex gap-3 overflow-x-auto pb-2">
                    {planosHistorico.map((row) => {
                      const { title, href, ended } = historicoItemMeta(row)
                      const concluido = row.status === 'completed'
                      return (
                        <li key={row.id} className="min-w-[260px] shrink-0">
                          <Link
                            href={href}
                            className={cn(
                              'block rounded-xl border p-4 transition-colors outline-none',
                              isDark
                                ? 'border-white/10 bg-black/20 hover:border-[#F2C94C]/40 hover:bg-white/[0.06] focus-visible:ring-offset-[#070707]'
                                : 'border-gray-200 bg-white/90 hover:border-[#F2C94C]/50 hover:bg-amber-50/40 focus-visible:ring-offset-white',
                              'focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2'
                            )}
                          >
                            <p className={cn('text-sm font-bold leading-snug', heading)}>{title}</p>
                            <p className={cn('mt-1 text-[11px]', muted)}>
                              {row.dias} dias · {ended}
                            </p>
                            <span
                              className={cn(
                                'mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide',
                                concluido
                                  ? isDark
                                    ? 'border-emerald-500/40 text-emerald-400'
                                    : 'border-emerald-200 text-emerald-800'
                                  : isDark
                                    ? 'border-white/20 text-gray-400'
                                    : 'border-gray-300 text-gray-600'
                              )}
                            >
                              {concluido ? 'Concluído' : 'Encerrado'}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

        </div>
      </div>

      {planoGithubModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plano-github-dialog-title"
        >
          <div
            className={cn(
              'relative w-full max-w-md rounded-2xl border p-6 shadow-2xl',
              isDark ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white'
            )}
          >
            <button
              type="button"
              onClick={() => {
                if (planoGithubSubmitting) return
                setPlanoGithubModalOpen(false)
              }}
              className={cn(
                'absolute right-3 top-3 rounded-lg p-2 transition-colors',
                isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
              )}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {planoGithubModalPhase === 'form' ? (
              <>
                <div className="flex items-center gap-2 pr-10">
                  <Github className={cn('h-6 w-6', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} aria-hidden />
                  <h2
                    id="plano-github-dialog-title"
                    className={cn('text-lg font-black tracking-tight', heading)}
                  >
                    Repositório do desafio
                  </h2>
                </div>
                <p className={cn('mt-3 text-sm leading-relaxed', muted)}>
                  Cole a URL pública do seu projeto no GitHub (o repositório precisa existir e ser acessível). Depois do
                  envio, o plano será concluído. Se for a primeira vez que você finaliza este desafio no curso, os pontos
                  serão creditados; se você já tinha recebido os pontos deste módulo, o envio é só registrado — sem XP
                  novo.
                </p>
                <label className="mt-4 block">
                  <span className={cn('text-xs font-bold uppercase tracking-wide', muted)}>URL do GitHub</span>
                  <input
                    type="url"
                    value={planoGithubUrl}
                    onChange={(e) => setPlanoGithubUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSubmitPlanoGithub()}
                    placeholder="https://github.com/usuario/repositorio"
                    disabled={planoGithubSubmitting}
                    className={cn(
                      'mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none ring-[#F2C94C] focus:ring-2',
                      isDark
                        ? 'border-white/10 bg-black/40 text-white placeholder:text-gray-600'
                        : 'border-gray-200 bg-white text-gray-900'
                    )}
                  />
                </label>
                {planoGithubError ? (
                  <p className="mt-2 text-sm font-medium text-red-500">{planoGithubError}</p>
                ) : null}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={planoGithubSubmitting}
                    onClick={() => setPlanoGithubModalOpen(false)}
                    className={cn(
                      'rounded-xl px-4 py-3 text-sm font-bold transition-colors',
                      isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    Continuar depois
                  </button>
                  <button
                    type="button"
                    disabled={planoGithubSubmitting}
                    onClick={() => void handleSubmitPlanoGithub()}
                    className="inline-flex items-center justify-center rounded-xl bg-[#F2C94C] px-5 py-3 text-sm font-extrabold text-black transition-colors hover:bg-[#f5d35c] disabled:opacity-60"
                  >
                    {planoGithubSubmitting ? 'Enviando…' : 'Enviar e concluir'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#F2C94C]',
                      isDark ? 'bg-[#F2C94C]/15' : 'bg-amber-50'
                    )}
                  >
                    <Check className="h-8 w-8 text-[#F2C94C]" aria-hidden />
                  </div>
                </div>
                <h2 className={cn('mt-4 text-center text-xl font-black', heading)}>Plano concluído!</h2>
                <p className={cn('mt-2 text-center text-sm leading-relaxed', muted)}>
                  {planoGithubXpAlreadyClaimed ? (
                    <>
                      Envio registrado com sucesso. Você já havia recebido os pontos deste desafio —{' '}
                      <span className="font-semibold text-inherit">nenhum XP novo foi adicionado.</span>
                    </>
                  ) : planoGithubXpGanho > 0 ? (
                    <>
                      Você ganhou <span className="font-bold text-[#F2C94C]">{planoGithubXpGanho} XP</span> por concluir
                      o desafio.
                    </>
                  ) : (
                    <>Seu progresso foi registrado. Obrigado por enviar o repositório!</>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setPlanoGithubModalOpen(false)}
                  className="mt-6 w-full rounded-xl bg-[#F2C94C] py-3 text-sm font-extrabold text-black transition-colors hover:bg-[#f5d35c]"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
