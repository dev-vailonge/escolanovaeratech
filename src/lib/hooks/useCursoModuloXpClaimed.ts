import { useQuery } from '@tanstack/react-query'
import { getAuthToken } from '@/lib/getAuthToken'

async function fetchCursoModuloXpClaimed(moduloId: string): Promise<{ xp_already_claimed: boolean }> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sem token')
  const url = `/api/aluno/curso-modulo-xp-claimed?cursos_desafio_id=${encodeURIComponent(moduloId)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(typeof j?.error === 'string' ? j.error : 'Falha ao verificar pontos do módulo')
  }
  return res.json() as Promise<{ xp_already_claimed: boolean }>
}

export function useCursoModuloXpClaimed(
  moduloId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const id = typeof moduloId === 'string' && moduloId.trim() !== '' ? moduloId.trim() : null
  return useQuery({
    queryKey: ['curso-modulo-xp-claimed', id] as const,
    enabled: (options?.enabled ?? true) && Boolean(id),
    queryFn: () => fetchCursoModuloXpClaimed(id!),
  })
}
