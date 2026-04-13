import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

type Params = { params: Promise<{ id: string; tarefaId: string; anexoId: string }> }

async function canAccessProjeto(
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
  projetoId: string,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
  if (profile?.role === 'admin') return true
  const { data: part } = await supabase
    .from('projetos_reais_participantes')
    .select('user_id')
    .eq('projeto_id', projetoId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(part)
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)
    const { id, tarefaId, anexoId } = await params
    const projetoId = id?.trim()
    if (!projetoId || !tarefaId?.trim() || !anexoId?.trim()) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }
    if (!(await canAccessProjeto(supabase, projetoId, userId))) {
      return NextResponse.json({ error: 'Acesso negado ao board deste projeto.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('projetos_reais_kanban_tarefa_anexos')
      .delete()
      .eq('id', anexoId)
      .eq('tarefa_id', tarefaId)
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
