'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { FormacaoAndroidProjetoReal } from '@/data/formacao-android-projetos'

export function useProjetosReaisList() {
  const [projetos, setProjetos] = useState<FormacaoAndroidProjetoReal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setProjetos([])
        return
      }
      const res = await fetch('/api/aluno/projetos-reais', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar projetos')
      setProjetos(json.projetos ?? [])
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao carregar projetos')
      setProjetos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { projetos, loading, error, refetch }
}
