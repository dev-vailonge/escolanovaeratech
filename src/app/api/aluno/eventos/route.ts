import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type { DatabaseAlunoEvento } from '@/types/database'
import { mapRowToAlunoEvento } from '@/lib/alunoEventos/mapRowToAlunoEvento'

/**
 * GET /api/aluno/eventos
 * Lista eventos publicados, ordenados por data de início. Requer usuário autenticado.
 */
export async function GET(request: Request) {
  try {
    await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const { data, error } = await supabase
      .from('aluno_eventos')
      .select('*')
      .eq('publicado', true)
      .order('start_at', { ascending: true })

    if (error) {
      const msg = error.message || ''
      if (msg.includes('relation') && msg.includes('does not exist')) {
        return NextResponse.json(
          {
            error:
              'Tabela aluno_eventos não encontrada. Aplique a migration (npm run db:apply-aluno-eventos ou SQL em supabase/migrations).',
            eventos: [],
          },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: error.message, eventos: [] }, { status: 500 })
    }

    const rows = (data || []) as DatabaseAlunoEvento[]
    const eventos = rows
      .map((row) => {
        try {
          return mapRowToAlunoEvento(row)
        } catch {
          return null
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)

    return NextResponse.json({ eventos })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
