import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type { DatabaseProjetoRealKanbanTarefaAnexo } from '@/types/database'

type Params = { params: Promise<{ id: string; tarefaId: string }> }

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

export async function GET(request: Request, { params }: Params) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)
    const { id, tarefaId } = await params
    const projetoId = id?.trim()
    if (!projetoId || !tarefaId?.trim()) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }
    if (!(await canAccessProjeto(supabase, projetoId, userId))) {
      return NextResponse.json({ error: 'Acesso negado ao board deste projeto.' }, { status: 403 })
    }
    const { data, error } = await supabase
      .from('projetos_reais_kanban_tarefa_anexos')
      .select('*')
      .eq('tarefa_id', tarefaId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ anexos: (data || []) as DatabaseProjetoRealKanbanTarefaAnexo[] })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)
    const { id, tarefaId } = await params
    const projetoId = id?.trim()
    if (!projetoId || !tarefaId?.trim()) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }
    if (!(await canAccessProjeto(supabase, projetoId, userId))) {
      return NextResponse.json({ error: 'Acesso negado ao board deste projeto.' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as { nome?: string; arquivo_url?: string }
    const nome = String(body.nome ?? '').trim()
    const arquivo_url = String(body.arquivo_url ?? '').trim()
    if (!nome || !arquivo_url) {
      return NextResponse.json({ error: 'Nome e arquivo_url são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projetos_reais_kanban_tarefa_anexos')
      .insert({ tarefa_id: tarefaId, user_id: userId, nome, arquivo_url })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ anexo: data as DatabaseProjetoRealKanbanTarefaAnexo })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
