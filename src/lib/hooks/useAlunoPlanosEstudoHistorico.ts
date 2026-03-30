'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DatabaseAlunoPlanoEstudo } from '@/types/database'

export const ALUNO_PLANOS_HISTORICO_QUERY_KEY = ['aluno', 'planos-estudo-historico'] as const

export type PlanosEstudoHistoricoResponse = { plans: DatabaseAlunoPlanoEstudo[] }

async function fetchHistorico(): Promise<PlanosEstudoHistoricoResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { plans: [] }
  }

  const res = await fetch('/api/aluno/planos-estudo-historico', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  const json = (await res.json()) as PlanosEstudoHistoricoResponse & { error?: string }
  if (!res.ok) {
    console.error(
      '[useAlunoPlanosEstudoHistorico] GET falhou',
      res.status,
      json.error ?? json
    )
    return { plans: [] }
  }
  return { plans: json.plans ?? [] }
}

export function useAlunoPlanosEstudoHistorico(enabled = true, userId?: string | null) {
  return useQuery({
    queryKey: [...ALUNO_PLANOS_HISTORICO_QUERY_KEY, userId ?? 'anon'] as const,
    queryFn: fetchHistorico,
    staleTime: 30 * 1000,
    enabled,
  })
}

export function useInvalidateAlunoPlanosHistorico() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ALUNO_PLANOS_HISTORICO_QUERY_KEY })
  }
}
