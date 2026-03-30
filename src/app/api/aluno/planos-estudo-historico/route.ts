import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import {
  createUserScopedSupabaseClient,
  getSupabaseClient,
} from '@/lib/server/getSupabaseClient'
import type { DatabaseAlunoPlanoEstudo } from '@/types/database'

const MAX_ROWS = 40

/**
 * GET /api/aluno/planos-estudo-historico — planos concluídos ou abandonados (mais recentes primeiro)
 */
export async function GET(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const supabase =
      createUserScopedSupabaseClient(accessToken) ?? (await getSupabaseClient(accessToken))

    const { data, error } = await supabase
      .from('aluno_planos_estudo')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['completed', 'abandoned'])
      .order('updated_at', { ascending: false })
      .limit(MAX_ROWS)

    if (error) {
      console.error('[planos-estudo-historico GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      plans: (data ?? []) as DatabaseAlunoPlanoEstudo[],
    })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
