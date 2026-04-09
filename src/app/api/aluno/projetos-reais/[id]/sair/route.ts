import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

/**
 * POST /api/aluno/projetos-reais/[id]/sair
 * Remove a participação do aluno no projeto.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)
    const { id } = await params
    const trimmed = id?.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const { data: deletedRows, error } = await supabase
      .from('projetos_reais_participantes')
      .delete()
      .eq('projeto_id', trimmed)
      .eq('user_id', userId)
      .select('user_id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let removed = Array.isArray(deletedRows) ? deletedRows.length : 0

    // Se RLS bloqueou silenciosamente no cliente do usuário, tenta fallback com admin.
    if (removed === 0) {
      try {
        const admin = getSupabaseAdmin()
        const { data: deletedByAdmin, error: adminDeleteErr } = await admin
          .from('projetos_reais_participantes')
          .delete()
          .eq('projeto_id', trimmed)
          .eq('user_id', userId)
          .select('user_id')

        if (!adminDeleteErr) {
          removed = Array.isArray(deletedByAdmin) ? deletedByAdmin.length : 0
        }
      } catch {
        // Sem service role configurada; segue para checagem final.
      }
    }

    const { data: checkRows, error: checkErr } = await supabase
      .from('projetos_reais_participantes')
      .select('user_id')
      .eq('projeto_id', trimmed)
      .eq('user_id', userId)

    if (Array.isArray(checkRows) && checkRows.length > 0) {
      return NextResponse.json(
        {
          error:
            'Não foi possível sair do projeto. Verifique as políticas RLS da tabela projetos_reais_participantes para permitir DELETE do próprio usuário.',
          code: 'SAIR_PROJETO_RLS_BLOCKED',
        },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
