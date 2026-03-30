import { NextResponse } from 'next/server'
import { getAccessTokenFromBearer, requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { userAlreadyHasBonificacaoXpForCursoDesafioModule } from '@/lib/server/gamification'

/**
 * GET /api/aluno/curso-modulo-xp-claimed?cursos_desafio_id=uuid
 * Indica se o aluno já recebeu XP de bonificação por este módulo (não ganhará de novo ao refazer).
 */
export async function GET(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const url = new URL(request.url)
    const moduloId = (url.searchParams.get('cursos_desafio_id') || '').trim()
    if (!moduloId) {
      return NextResponse.json({ error: 'Informe cursos_desafio_id' }, { status: 400 })
    }

    const supabase = await getSupabaseClient(accessToken)
    const xp_already_claimed = await userAlreadyHasBonificacaoXpForCursoDesafioModule({
      supabase,
      userId,
      cursosDesafioId: moduloId,
    })

    return NextResponse.json({ xp_already_claimed })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('[curso-modulo-xp-claimed]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
