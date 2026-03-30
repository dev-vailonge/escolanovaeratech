import { useQuery } from '@tanstack/react-query'
import { getAuthToken } from '@/lib/getAuthToken'

export type ConclusaoModuloListaItem = {
  id: string
  user_id: string
  github_url: string
  status: string
  created_at: string
  reviewed_at: string | null
  admin_notes: string | null
  userName: string | null
  userAvatarUrl: string | null
}

/**
 * Lista unificada de conclusões do módulo (todos os alunos), com nome e avatar.
 */
export function useConclusoesModuloLista(
  cursosDesafioId: string | null | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['conclusoes-modulo-lista', cursosDesafioId],
    enabled: Boolean(enabled && cursosDesafioId),
    queryFn: async (): Promise<ConclusaoModuloListaItem[]> => {
      if (!cursosDesafioId) return []
      const token = await getAuthToken()
      if (!token) throw new Error('Não autenticado')
      const q = encodeURIComponent(cursosDesafioId)
      const res = await fetch(`/api/curso-modulos/conclusoes-lista?moduloId=${q}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let msg = `Erro ${res.status}`
        try {
          const j = JSON.parse(text) as { error?: string }
          if (j.error) msg = j.error
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }
      const json = (await res.json()) as { conclusoes?: ConclusaoModuloListaItem[] }
      return json.conclusoes ?? []
    },
  })
}
