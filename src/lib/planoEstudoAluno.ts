import type { DatabaseAlunoPlanoEstudo, DatabaseCursoDesafio } from '@/types/database'
import {
  splitLessonsIntoDays,
  type FormacaoAndroid10dDayPlan,
  type FormacaoAndroid10dLesson,
} from '@/data/formacao-android-10d-challenge'
import type {
  ChallengeVisual,
  DesafioDifficulty,
  FormacaoAndroidApp,
} from '@/data/formacao-android-desafios'

/** Módulo `cursos_desafios` da jornada 10D na formação Android (não confundir com o slug do 1º app, ex. `c1`). */
export const MODULO_SLUG_ANDROID_10D_CHALLENGE = '10d-challenge' as const

export type AlunoPlanoProgressShape = {
  completedDays: number[]
}

export type ModuloSnapshotPlanoEstudo = {
  slug: string
  /** `cursos.slug` do curso ao iniciar o plano — deep links no Command */
  curso_slug?: string
  /** PK do módulo (`cursos_desafios.id`) — conclusões em `curso_desafio_conclusoes` */
  cursos_desafio_id?: string | null
  title: string
  heroTitle: string
  summary: string
  objective: string
  xp: number
  tags: string[]
  practiceItems: string[]
  requirements: string[]
  relatedLessons: { title: string; description: string; href?: string }[]
  difficulty: string
  visual?: ChallengeVisual
  coverSrc?: string
  detailCoverSrc?: string
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function asRelatedLessonsForPlano(
  v: unknown
): { title: string; description: string; href?: string }[] {
  if (!Array.isArray(v)) return []
  return v.map((item) => {
    if (!item || typeof item !== 'object') return { title: '', description: '' }
    const o = item as Record<string, unknown>
    const title = typeof o.title === 'string' ? o.title : ''
    const description = typeof o.description === 'string' ? o.description : ''
    const href = typeof o.href === 'string' ? o.href : undefined
    const out: { title: string; description: string; href?: string } = { title, description }
    if (href) out.href = href
    return out
  })
}

function parseDifficulty(meta: Record<string, unknown>): string {
  const d = meta.difficulty
  if (d === 'Iniciante' || d === 'Intermediário' || d === 'Avançado') return d
  return 'Iniciante'
}

const VISUALS: ChallengeVisual[] = [
  'phone',
  'wireframe',
  'chart',
  'map',
  'crypto',
  'media',
]

function parsePlanoEstudosLessons(raw: unknown): FormacaoAndroid10dLesson[] {
  if (!raw || typeof raw !== 'object') return []
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.lessons)) return []
  const lessons: FormacaoAndroid10dLesson[] = []
  for (const L of o.lessons) {
    if (!L || typeof L !== 'object') continue
    const l = L as Record<string, unknown>
    const title = typeof l.title === 'string' ? l.title : ''
    const href = typeof l.href === 'string' ? l.href : ''
    const description = typeof l.description === 'string' ? l.description : ''
    if (!title) continue
    lessons.push({
      title,
      href: href || '#',
      description: description || '',
    })
  }
  return lessons
}

/** Aulas para dividir em dias: prioriza aulas_sugeridas; se vazio, usa lessons de plano_estudos (ex.: 10D). */
export function lessonsForPlanoFromCursoDesafio(row: DatabaseCursoDesafio): FormacaoAndroid10dLesson[] {
  const fromAulas = asRelatedLessonsForPlano(row.aulas_sugeridas)
    .filter((l) => l.title.trim() !== '')
    .map((l) => ({
      title: l.title,
      href: l.href && l.href.trim() !== '' ? l.href : '#',
      description: l.description || '',
    }))

  if (fromAulas.length > 0) return fromAulas

  return parsePlanoEstudosLessons(row.plano_estudos)
}

export function buildModuloSnapshot(
  row: DatabaseCursoDesafio,
  cursoSlug?: string
): ModuloSnapshotPlanoEstudo {
  const meta =
    row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {}
  const visualRaw = typeof meta.visual === 'string' ? meta.visual : 'phone'
  const visual: ChallengeVisual = VISUALS.includes(visualRaw as ChallengeVisual)
    ? (visualRaw as ChallengeVisual)
    : 'phone'
  return {
    slug: row.slug,
    ...(cursoSlug && cursoSlug.trim() !== '' ? { curso_slug: cursoSlug.trim() } : {}),
    cursos_desafio_id: row.id,
    title: row.titulo,
    heroTitle: row.hero_titulo,
    summary: row.resumo,
    objective: row.objetivo,
    xp: row.xp,
    tags: asStringArray(row.tags),
    practiceItems: asStringArray(row.itens_pratica),
    requirements: asStringArray(row.requisitos),
    relatedLessons: asRelatedLessonsForPlano(row.aulas_sugeridas),
    difficulty: parseDifficulty(meta),
    visual,
    coverSrc: row.imagem_capa_url ?? undefined,
    detailCoverSrc: row.imagem_detalhe_url ?? row.imagem_capa_url ?? undefined,
  }
}

export function buildPlanoByDay(
  lessons: FormacaoAndroid10dLesson[],
  dias: number
): FormacaoAndroid10dDayPlan[] {
  if (dias < 1) return []
  if (lessons.length === 0) {
    return Array.from({ length: dias }, (_, i) => ({ day: i + 1, lessons: [] as FormacaoAndroid10dLesson[] }))
  }
  return splitLessonsIntoDays(lessons, dias)
}

export function normalizeProgress(raw: unknown): AlunoPlanoProgressShape {
  if (!raw || typeof raw !== 'object') return { completedDays: [] }
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.completedDays)) return { completedDays: [] }
  const completedDays = o.completedDays
    .map((d) => (typeof d === 'number' ? Math.floor(d) : NaN))
    .filter((d) => Number.isFinite(d) && d >= 1)
  return { completedDays: [...new Set(completedDays)].sort((a, b) => a - b) }
}

export function mergeToggleCompletedDay(
  progress: AlunoPlanoProgressShape,
  day: number
): AlunoPlanoProgressShape {
  const set = new Set(progress.completedDays)
  if (set.has(day)) set.delete(day)
  else set.add(day)
  return { completedDays: [...set].sort((a, b) => a - b) }
}

export function isPlanFullyCompleted(dias: number, progress: AlunoPlanoProgressShape): boolean {
  if (dias < 1) return false
  const needed = new Set(Array.from({ length: dias }, (_, i) => i + 1))
  for (const d of progress.completedDays) needed.delete(d)
  return needed.size === 0
}

function parseDifficultySnapshot(d: string): DesafioDifficulty {
  if (d === 'Iniciante' || d === 'Intermediário' || d === 'Avançado') return d
  return 'Iniciante'
}

/** Snapshot salvo no plano → formato do cartão de desafio no Command. */
export function moduloSnapshotToFormacaoAndroidApp(raw: unknown): FormacaoAndroidApp | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (typeof s.slug !== 'string' || typeof s.title !== 'string') return null
  const tags = Array.isArray(s.tags) ? s.tags.filter((t): t is string => typeof t === 'string') : []
  const practiceItems = Array.isArray(s.practiceItems)
    ? s.practiceItems.filter((t): t is string => typeof t === 'string')
    : []
  const requirements = Array.isArray(s.requirements)
    ? s.requirements.filter((t): t is string => typeof t === 'string')
    : []
  const relatedLessons: FormacaoAndroidApp['relatedLessons'] = []
  if (Array.isArray(s.relatedLessons)) {
    for (const item of s.relatedLessons) {
      if (!item || typeof item !== 'object') continue
      const o = item as Record<string, unknown>
      const title = typeof o.title === 'string' ? o.title : ''
      const description = typeof o.description === 'string' ? o.description : ''
      const href = typeof o.href === 'string' ? o.href : undefined
      const row: { title: string; description: string; href?: string } = { title, description }
      if (href) row.href = href
      relatedLessons.push(row)
    }
  }
  const diffRaw = typeof s.difficulty === 'string' ? s.difficulty : 'Iniciante'
  const v = typeof s.visual === 'string' ? s.visual : 'phone'
  const visual: ChallengeVisual = VISUALS.includes(v as ChallengeVisual) ? (v as ChallengeVisual) : 'phone'

  const moduloIdRaw = s.cursos_desafio_id
  const cursosDesafioId =
    typeof moduloIdRaw === 'string' && moduloIdRaw.trim() !== '' ? moduloIdRaw.trim() : null

  return {
    id: s.slug,
    mission: 0,
    title: s.title,
    heroTitle: typeof s.heroTitle === 'string' ? s.heroTitle : s.title,
    xp: typeof s.xp === 'number' ? s.xp : 0,
    visual,
    coverSrc: typeof s.coverSrc === 'string' ? s.coverSrc : undefined,
    detailCoverSrc: typeof s.detailCoverSrc === 'string' ? s.detailCoverSrc : undefined,
    difficulty: parseDifficultySnapshot(diffRaw),
    summary: typeof s.summary === 'string' ? s.summary : '',
    tags,
    objective: typeof s.objective === 'string' ? s.objective : '',
    practiceItems,
    requirements,
    relatedLessons,
    cursosDesafioId,
  }
}

function unwrapJsonArray(raw: unknown): unknown[] | null {
  let v: unknown = raw
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v) as unknown
    } catch {
      return null
    }
  }
  return Array.isArray(v) ? v : null
}

export function parsePlanoDiasStored(raw: unknown): FormacaoAndroid10dDayPlan[] {
  const arr = unwrapJsonArray(raw)
  if (!arr) return []
  const out: FormacaoAndroid10dDayPlan[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const day = typeof o.day === 'number' ? o.day : Number(o.day)
    if (!Number.isFinite(day)) continue
    const lessons: FormacaoAndroid10dLesson[] = []
    if (Array.isArray(o.lessons)) {
      for (const L of o.lessons) {
        if (!L || typeof L !== 'object') continue
        const l = L as Record<string, unknown>
        const title = typeof l.title === 'string' ? l.title : ''
        const href = typeof l.href === 'string' ? l.href : '#'
        const description = typeof l.description === 'string' ? l.description : ''
        if (!title) continue
        lessons.push({ title, href, description })
      }
    }
    out.push({ day, lessons })
  }
  return out.sort((a, b) => a.day - b.day)
}

/** Aulas do snapshot salvo no plano (mesma origem que buildModuloSnapshot.relatedLessons). */
export function lessonsFromModuloSnapshotForPlano(raw: unknown): FormacaoAndroid10dLesson[] {
  if (!raw || typeof raw !== 'object') return []
  const s = raw as Record<string, unknown>
  return asRelatedLessonsForPlano(s.relatedLessons)
    .filter((l) => l.title.trim() !== '')
    .map((l) => ({
      title: l.title,
      href: l.href && l.href.trim() !== '' ? l.href : '#',
      description: l.description || '',
    }))
}

/**
 * Dias/aulas exibidos no Command: usa JSON `plano`; se vier vazio ou inválido, redivide a partir de `modulo_snapshot`.
 */
export function dayPlansFromAlunoPlano(row: DatabaseAlunoPlanoEstudo): FormacaoAndroid10dDayPlan[] {
  const parsed = parsePlanoDiasStored(row.plano)
  if (parsed.length > 0) return parsed
  const lessons = lessonsFromModuloSnapshotForPlano(row.modulo_snapshot)
  if (lessons.length === 0) return []
  return buildPlanoByDay(lessons, row.dias)
}
