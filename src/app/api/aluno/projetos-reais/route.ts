import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type { DatabaseProjetosReal } from '@/types/database'
import { mapRowToFormacaoAndroidProjetoReal } from '@/lib/projetosReais/mapRowToProjeto'

/**
 * GET /api/aluno/projetos-reais
 * Lista projetos reais ativos (hub). Requer usuário autenticado.
 */
export async function GET(request: Request) {
  try {
    await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const { data, error } = await supabase
      .from('projetos_reais')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data || []) as DatabaseProjetosReal[]
    const projetos = rows.map((row) => {
      try {
        return mapRowToFormacaoAndroidProjetoReal(row)
      } catch {
        return null
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null)

    return NextResponse.json({ projetos })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
