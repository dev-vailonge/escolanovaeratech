'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DatabaseAlunoPlanoEstudo } from '@/types/database'
import { ALUNO_PLANOS_HISTORICO_QUERY_KEY } from '@/lib/hooks/useAlunoPlanosEstudoHistorico'

export const ALUNO_PLANO_ATIVO_QUERY_KEY = ['aluno', 'plano-estudo-ativo'] as const

export type PlanoEstudoAtivoResponse = { plan: DatabaseAlunoPlanoEstudo | null }

async function fetchPlanoAtivo(): Promise<PlanoEstudoAtivoResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { plan: null }
  }

  const res = await fetch('/api/aluno/plano-estudo-ativo', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  const json = (await res.json()) as PlanoEstudoAtivoResponse & { error?: string }
  if (!res.ok) {
    console.error(
      '[useAlunoPlanoEstudoAtivo] GET plano-estudo-ativo falhou',
      res.status,
      json.error ?? json
    )
    return { plan: null }
  }
  return { plan: json.plan ?? null }
}

export function useAlunoPlanoEstudoAtivo(enabled = true, userId?: string | null) {
  return useQuery({
    queryKey: [...ALUNO_PLANO_ATIVO_QUERY_KEY, userId ?? 'anon'] as const,
    queryFn: fetchPlanoAtivo,
    staleTime: 20 * 1000,
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

export function useInvalidateAlunoPlanoAtivo() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ALUNO_PLANO_ATIVO_QUERY_KEY })
    void qc.invalidateQueries({ queryKey: ALUNO_PLANOS_HISTORICO_QUERY_KEY })
  }
}
