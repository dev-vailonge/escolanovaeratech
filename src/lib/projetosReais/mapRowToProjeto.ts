import type { DatabaseProjetosReal } from '@/types/database'
import type {
  FormacaoAndroidProjetoCerimonia,
  FormacaoAndroidProjetoReal,
  FormacaoAndroidTechAreaId,
} from '@/data/formacao-android-projetos'
import type { FacepilePerson } from '@/components/ui/SubmittersFacepile'

function isPreview(x: string): x is FormacaoAndroidProjetoReal['preview'] {
  return x === 'lake' || x === 'ai-shopping'
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.every((x) => typeof x === 'string') ? (raw as string[]) : []
}

function parseTechAreas(raw: unknown): FormacaoAndroidTechAreaId[] {
  const allowed: FormacaoAndroidTechAreaId[] = ['android', 'ios', 'web', 'backend', 'data']
  if (!Array.isArray(raw)) return []
  return (raw as unknown[]).filter((x): x is FormacaoAndroidTechAreaId =>
    typeof x === 'string' && (allowed as string[]).includes(x)
  )
}

function parseTeam(raw: unknown): FacepilePerson[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return { id: '', name: '', avatarUrl: null }
    const o = item as Record<string, unknown>
    const avatar = o.avatar_url ?? o.avatarUrl
    return {
      id: String(o.id ?? ''),
      name: o.name != null ? String(o.name) : '',
      avatarUrl: typeof avatar === 'string' || avatar === null ? (avatar as string | null) : null,
    }
  })
}

function parseCeremonias(raw: unknown): FormacaoAndroidProjetoCerimonia[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const titulo = o.titulo != null ? String(o.titulo) : ''
      const descricao = o.descricao != null ? String(o.descricao) : ''
      if (!titulo && !descricao) return null
      return { titulo, descricao }
    })
    .filter((x): x is FormacaoAndroidProjetoCerimonia => x !== null)
}

export function mapRowToFormacaoAndroidProjetoReal(
  row: DatabaseProjetosReal
): FormacaoAndroidProjetoReal {
  const preview = row.preview
  if (!isPreview(preview)) {
    throw new Error(`preview inválido: ${String(preview)}`)
  }

  const bullets = parseStringArray(row.bullets)

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bullets,
    detailBadge: row.detail_badge ?? undefined,
    detailLead: row.detail_lead ?? undefined,
    preview,
    team: parseTeam(row.team),
    techAreas: parseTechAreas(row.tech_areas),
    ceremonias: parseCeremonias(row.ceremonias),
  }
}
