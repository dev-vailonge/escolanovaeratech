import { useQuery } from '@tanstack/react-query'
import { getAuthToken } from '@/lib/getAuthToken'

export type CursoModuloSubmitter = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

export type CursoModulosSubmittersByModulo = Record<
  string,
  { count: number; submitters: CursoModuloSubmitter[] }
>

async function fetchCursoModulosSubmittersSummary(
  moduloIds: string[],
  somenteAprovados: boolean
): Promise<CursoModulosSubmittersByModulo> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sem token')

  const ids = [...new Set(moduloIds.filter(Boolean))]
  const qs = new URLSearchParams({ ids: ids.join(',') })
  if (somenteAprovados) qs.set('somenteAprovados', '1')

  const res = await fetch(`/api/curso-modulos/submitters-summary?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err?.error === 'string' ? err.error : 'Falha ao carregar concluintes')
  }
  const json = (await res.json()) as { byModulo?: CursoModulosSubmittersByModulo }
  return json.byModulo ?? {}
}

/**
 * Resumo de quem concluiu/enviou por `cursos_desafios.id` (uma linha por aluno por módulo).
 * Com `somenteAprovados`, só entram linhas aprovadas — ordem: mais recentes primeiro (`created_at` desc).
 */
export function useCursoModulosSubmittersSummary(
  moduloIds: string[],
  options?: { somenteAprovados?: boolean; enabled?: boolean }
) {
  const somenteAprovados = options?.somenteAprovados ?? false
  const sortedKey = [...new Set(moduloIds.filter(Boolean))].sort().join(',')

  return useQuery({
    queryKey: ['curso-modulos-submitters-summary', sortedKey, somenteAprovados] as const,
    enabled: (options?.enabled ?? true) && sortedKey.length > 0,
    queryFn: () => fetchCursoModulosSubmittersSummary(moduloIds.filter(Boolean), somenteAprovados),
  })
}
