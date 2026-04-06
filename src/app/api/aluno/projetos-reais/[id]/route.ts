import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type { DatabaseProjetosReal } from '@/types/database'
import { mapRowToFormacaoAndroidProjetoReal } from '@/lib/projetosReais/mapRowToProjeto'

export type ProjetosReaisParticipanteResumo = {
  user_id: string
  name: string
  avatar_url: string | null
  tech_area: string
}

/**
 * GET /api/aluno/projetos-reais/[id]
 * Detalhe de um projeto (slug id). Requer usuário autenticado.
 * Inclui alunos inscritos (facepile) e a inscrição do usuário atual, se houver.
 */
export async function GET(
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

    const { data, error } = await supabase
      .from('projetos_reais')
      .select('*')
      .eq('id', trimmed)
      .eq('ativo', true)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    let participantesAlunos: ProjetosReaisParticipanteResumo[] = []
    let minhaParticipacao: { tech_area: string } | null = null

    const { data: partRows, error: partErr } = await supabase
      .from('projetos_reais_participantes')
      .select('user_id, tech_area')
      .eq('projeto_id', trimmed)

    if (!partErr && partRows?.length) {
      const ids = [...new Set(partRows.map((p) => p.user_id))]
      const { data: userRows } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', ids)

      const userMap = new Map((userRows || []).map((u) => [u.id, u]))
      participantesAlunos = partRows.map((p) => {
        const u = userMap.get(p.user_id)
        return {
          user_id: p.user_id,
          tech_area: p.tech_area,
          name: u?.name?.trim() || 'Aluno',
          avatar_url: u?.avatar_url ?? null,
        }
      })
      const mine = partRows.find((p) => p.user_id === userId)
      if (mine) {
        minhaParticipacao = { tech_area: mine.tech_area }
      }
    }

    try {
      const projeto = mapRowToFormacaoAndroidProjetoReal(data as DatabaseProjetosReal)
      return NextResponse.json({ projeto, participantesAlunos, minhaParticipacao })
    } catch {
      return NextResponse.json({ error: 'Dados do projeto inválidos' }, { status: 500 })
    }
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
