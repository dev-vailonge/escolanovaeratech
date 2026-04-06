'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AlunoEvento } from '@/data/aluno-eventos'

export function useAlunoEventosList() {
  const [eventos, setEventos] = useState<AlunoEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setEventos([])
        return
      }
      const res = await fetch('/api/aluno/eventos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar eventos')
      setEventos(json.eventos ?? [])
    } catch (e: unknown) {
      setError((e as Error).message || 'Erro ao carregar eventos')
      setEventos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { eventos, loading, error, refetch }
}
