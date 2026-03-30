import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DatabaseCurso, DatabaseCursoDesafio } from '@/types/database'
import {
  BONUS_COMPLETAR_TODOS_XP,
  FORMACAO_ANDROID_APPS,
  type ChallengeVisual,
  type DesafioDifficulty,
  type FormacaoAndroidApp,
  type FormacaoAndroidRelatedLesson,
} from '@/data/formacao-android-desafios'
import {
  FORMACAO_ANDROID_10D_CHALLENGE,
  FORMACAO_ANDROID_10D_PLAN_BY_DAY,
  splitLessonsIntoDays,
  type FormacaoAndroid10dDayPlan,
  type FormacaoAndroid10dLesson,
} from '@/data/formacao-android-10d-challenge'

const CURSO_SLUG_ANDROID = 'android'

/** Chave única: uma query, cache compartilhado entre formação Android, Command e detalhe do app. */
export const FORMACAO_ANDROID_CURSO_BUNDLE_QUERY_KEY = ['formacao-android', 'curso-bundle'] as const

export function useAndroidCursoBundleQuery() {
  return useQuery({
    queryKey: FORMACAO_ANDROID_CURSO_BUNDLE_QUERY_KEY,
    queryFn: fetchAndroidCursoBundle,
  })
}

const VISUALS: ChallengeVisual[] = [
  'phone',
  'wireframe',
  'chart',
  'map',
  'crypto',
  'media',
]

function isChallengeVisual(v: string): v is ChallengeVisual {
  return VISUALS.includes(v as ChallengeVisual)
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function asRelatedLessons(v: unknown): FormacaoAndroidRelatedLesson[] {
  if (!Array.isArray(v)) return []
  return v.map((item) => {
    if (!item || typeof item !== 'object') return { title: '', description: '' }
    const o = item as Record<string, unknown>
    const title = typeof o.title === 'string' ? o.title : ''
    const description = typeof o.description === 'string' ? o.description : ''
    const href = typeof o.href === 'string' ? o.href : undefined
    const out: FormacaoAndroidRelatedLesson = { title, description }
    if (href) out.href = href
    return out
  })
}

function parseDifficulty(v: unknown): DesafioDifficulty {
  if (v === 'Iniciante' || v === 'Intermediário' || v === 'Avançado') return v
  return 'Iniciante'
}

function parsePlanoEstudos(
  raw: unknown
): { journeyDayCount: number; lessons: FormacaoAndroid10dLesson[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const journeyDayCount = typeof o.journeyDayCount === 'number' ? o.journeyDayCount : 0
  if (!Array.isArray(o.lessons) || journeyDayCount < 1) return null
  const lessons: FormacaoAndroid10dLesson[] = []
  for (const L of o.lessons) {
    if (!L || typeof L !== 'object') continue
    const l = L as Record<string, unknown>
    if (
      typeof l.title !== 'string' ||
      typeof l.href !== 'string' ||
      typeof l.description !== 'string'
    )
      continue
    lessons.push({ title: l.title, href: l.href, description: l.description })
  }
  if (lessons.length === 0) return null
  return { journeyDayCount, lessons }
}

export function cursoDesafioRowToFormacaoAndroidApp(row: DatabaseCursoDesafio): FormacaoAndroidApp | null {
  if (row.slug === '10d-challenge') return null
  const meta = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {}
  const visualRaw = typeof meta.visual === 'string' ? meta.visual : 'phone'
  const visual: ChallengeVisual = isChallengeVisual(visualRaw) ? visualRaw : 'phone'
  return {
    id: row.slug,
    mission: Math.max(1, row.ordem - 1),
    title: row.titulo,
    heroTitle: row.hero_titulo,
    xp: row.xp,
    visual,
    coverSrc: row.imagem_capa_url ?? undefined,
    detailCoverSrc: row.imagem_detalhe_url ?? row.imagem_capa_url ?? undefined,
    difficulty: parseDifficulty(meta.difficulty),
    summary: row.resumo,
    objective: row.objetivo,
    tags: asStringArray(row.tags),
    practiceItems: asStringArray(row.itens_pratica),
    requirements: asStringArray(row.requisitos),
    relatedLessons: asRelatedLessons(row.aulas_sugeridas),
    githubRepoUrl: row.url_repositorio_referencia ?? undefined,
    cursosDesafioId: row.id,
  }
}

/** Objeto compatível com o uso no JSX da formação Android (card 10D + modal). */
export type FormacaoAndroid10dChallengeView = {
  id: string
  xpReward: number
  journeyDayCount: number
  desafioHref: string
  title: string
  heroLine1: string
  heroHighlight: string
  badgeLabel: string
  tags: readonly string[] | string[]
  previewSrc: string
  previewAlt: string
  subtitle: string
}

export type AndroidCursoBundle = {
  curso: DatabaseCurso
  modulos: DatabaseCursoDesafio[]
  apps: FormacaoAndroidApp[]
  tenDRow: DatabaseCursoDesafio | null
  challenge10d: FormacaoAndroid10dChallengeView
  planByDay: FormacaoAndroid10dDayPlan[]
  xpApps: number
  totalXpDesafios: number
}

export async function fetchAndroidCursoBundle(): Promise<AndroidCursoBundle | null> {
  const { data: curso, error: cursoErr } = await supabase
    .from('cursos')
    .select('*')
    .eq('slug', CURSO_SLUG_ANDROID)
    .eq('ativo', true)
    .maybeSingle()

  if (cursoErr || !curso) return null

  const c = curso as DatabaseCurso

  const { data: modulosRaw, error: modErr } = await supabase
    .from('cursos_desafios')
    .select('*')
    .eq('curso_id', c.id)
    .order('ordem', { ascending: true })

  if (modErr || !modulosRaw?.length) return null

  const modulos = modulosRaw as DatabaseCursoDesafio[]
  const tenDRow = modulos.find((m) => m.slug === '10d-challenge') ?? null
  const apps = modulos
    .map(cursoDesafioRowToFormacaoAndroidApp)
    .filter((a): a is FormacaoAndroidApp => a != null)

  const firstAppSlug =
    modulos.find((m) => m.slug !== '10d-challenge')?.slug ??
    FORMACAO_ANDROID_APPS[0]?.id ??
    'c1'

  const planParsed = tenDRow ? parsePlanoEstudos(tenDRow.plano_estudos) : null
  const lessons10d = planParsed?.lessons ?? []
  const journeyDays = planParsed?.journeyDayCount ?? 10

  const planByDay =
    lessons10d.length > 0
      ? splitLessonsIntoDays(lessons10d, journeyDays)
      : FORMACAO_ANDROID_10D_PLAN_BY_DAY

  const meta10d =
    tenDRow?.metadata && typeof tenDRow.metadata === 'object'
      ? (tenDRow.metadata as Record<string, unknown>)
      : {}

  const challenge10d: FormacaoAndroid10dChallengeView = {
    id: '10d-challenge',
    xpReward: tenDRow?.xp ?? FORMACAO_ANDROID_10D_CHALLENGE.xpReward,
    journeyDayCount: journeyDays,
    desafioHref: `/aluno/formacoes/android/apps/${firstAppSlug}`,
    title: tenDRow?.titulo ?? FORMACAO_ANDROID_10D_CHALLENGE.title,
    heroLine1: (typeof meta10d.heroLine1 === 'string' ? meta10d.heroLine1 : null) ??
      FORMACAO_ANDROID_10D_CHALLENGE.heroLine1,
    heroHighlight:
      (typeof meta10d.heroHighlight === 'string' ? meta10d.heroHighlight : null) ??
      FORMACAO_ANDROID_10D_CHALLENGE.heroHighlight,
    badgeLabel:
      (typeof meta10d.badgeLabel === 'string' ? meta10d.badgeLabel : null) ??
      FORMACAO_ANDROID_10D_CHALLENGE.badgeLabel,
    tags: asStringArray(tenDRow?.tags).length ? asStringArray(tenDRow?.tags) : [...FORMACAO_ANDROID_10D_CHALLENGE.tags],
    previewSrc:
      tenDRow?.imagem_capa_url ?? FORMACAO_ANDROID_10D_CHALLENGE.previewSrc,
    previewAlt:
      (typeof meta10d.previewAlt === 'string' ? meta10d.previewAlt : null) ??
      FORMACAO_ANDROID_10D_CHALLENGE.previewAlt,
    subtitle: tenDRow?.resumo ?? FORMACAO_ANDROID_10D_CHALLENGE.subtitle,
  }

  const xpApps = apps.reduce((t, a) => t + a.xp, 0)
  const totalXpDesafios = xpApps + BONUS_COMPLETAR_TODOS_XP

  return {
    curso: c,
    modulos,
    apps,
    tenDRow,
    challenge10d,
    planByDay,
    xpApps,
    totalXpDesafios,
  }
}

export type UseFormacaoAndroidDataResult = {
  loading: boolean
  fromDb: boolean
  apps: FormacaoAndroidApp[]
  challenge10d: FormacaoAndroid10dChallengeView
  planByDay: FormacaoAndroid10dDayPlan[]
  xpApps: number
  totalXpDesafios: number
  /** Primeiro app da trilha (para hero / links) */
  firstAppSlug: string
  /** `cursos_desafios.id` do módulo 10D, quando o curso veio do Supabase */
  cursosDesafioId10d: string | null
}

/** Dados da formação Android: Supabase quando disponível; senão arquivo estático. */
export function useFormacaoAndroidData(): UseFormacaoAndroidDataResult {
  const staticFallback = useMemo(
    () => ({
      fromDb: false as const,
      cursosDesafioId10d: null as string | null,
      apps: FORMACAO_ANDROID_APPS,
      challenge10d: {
        id: FORMACAO_ANDROID_10D_CHALLENGE.id,
        xpReward: FORMACAO_ANDROID_10D_CHALLENGE.xpReward,
        journeyDayCount: FORMACAO_ANDROID_10D_CHALLENGE.journeyDayCount,
        desafioHref: FORMACAO_ANDROID_10D_CHALLENGE.desafioHref,
        title: FORMACAO_ANDROID_10D_CHALLENGE.title,
        heroLine1: FORMACAO_ANDROID_10D_CHALLENGE.heroLine1,
        heroHighlight: FORMACAO_ANDROID_10D_CHALLENGE.heroHighlight,
        badgeLabel: FORMACAO_ANDROID_10D_CHALLENGE.badgeLabel,
        tags: [...FORMACAO_ANDROID_10D_CHALLENGE.tags],
        previewSrc: FORMACAO_ANDROID_10D_CHALLENGE.previewSrc,
        previewAlt: FORMACAO_ANDROID_10D_CHALLENGE.previewAlt,
        subtitle: FORMACAO_ANDROID_10D_CHALLENGE.subtitle,
      } satisfies FormacaoAndroid10dChallengeView,
      planByDay: FORMACAO_ANDROID_10D_PLAN_BY_DAY,
      xpApps: FORMACAO_ANDROID_APPS.reduce((t, a) => t + a.xp, 0),
      totalXpDesafios:
        FORMACAO_ANDROID_APPS.reduce((t, a) => t + a.xp, 0) + BONUS_COMPLETAR_TODOS_XP,
      firstAppSlug: FORMACAO_ANDROID_APPS[0]?.id ?? 'c1',
    }),
    []
  )

  const q = useAndroidCursoBundleQuery()

  if (q.isPending) {
    return { ...staticFallback, loading: true }
  }

  const bundle = q.data
  if (bundle && bundle.apps.length > 0) {
    const firstAppSlug =
      bundle.modulos.find((m) => m.slug !== '10d-challenge')?.slug ??
      bundle.apps[0]?.id ??
      'c1'
    return {
      loading: false,
      fromDb: true,
      apps: bundle.apps,
      challenge10d: bundle.challenge10d,
      planByDay: bundle.planByDay,
      xpApps: bundle.xpApps,
      totalXpDesafios: bundle.totalXpDesafios,
      firstAppSlug,
      cursosDesafioId10d: bundle.tenDRow?.id ?? null,
    }
  }

  return { ...staticFallback, loading: false }
}

export type UseFormacaoAndroidAppBySlugResult =
  | { app: undefined; isLoading: true; fromDb: boolean }
  | { app: FormacaoAndroidApp | null; isLoading: false; fromDb: boolean }

/** Mesmo cache que `useFormacaoAndroidData` — evita novo fetch ao abrir o detalhe de um app. */
export function useFormacaoAndroidAppBySlug(slug: string): UseFormacaoAndroidAppBySlugResult {
  const q = useAndroidCursoBundleQuery()

  return useMemo(() => {
    if (!slug) {
      return { app: null, isLoading: false as const, fromDb: false as const }
    }
    if (q.isPending) {
      return { app: undefined, isLoading: true as const, fromDb: false as const }
    }

    const bundle = q.data
    if (bundle) {
      const row = bundle.modulos.find((m) => m.slug === slug && m.slug !== '10d-challenge')
      if (row) {
        const mapped = cursoDesafioRowToFormacaoAndroidApp(row)
        if (mapped) {
          return { app: mapped, isLoading: false as const, fromDb: true as const }
        }
      }
    }

    const staticApp = FORMACAO_ANDROID_APPS.find((a) => a.id === slug) ?? null
    return { app: staticApp, isLoading: false as const, fromDb: false as const }
  }, [slug, q.isPending, q.data])
}
