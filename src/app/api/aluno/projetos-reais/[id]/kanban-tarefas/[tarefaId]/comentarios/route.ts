import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type { DatabaseProjetoRealKanbanTarefaComentario } from '@/types/database'

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
      .from('projetos_reais_kanban_tarefa_comentarios')
      .select('*')
      .eq('tarefa_id', tarefaId)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data || []) as DatabaseProjetoRealKanbanTarefaComentario[]
    const ids = [...new Set(rows.map((r) => r.user_id))]
    let map = new Map<string, { name: string; avatar_url: string | null }>()
    if (ids.length) {
      const { data: users } = await supabase.from('users').select('id,name,avatar_url').in('id', ids)
      map = new Map(
        (users || []).map((u) => [
          String((u as { id?: string }).id ?? ''),
          {
            name: String((u as { name?: string }).name ?? 'Aluno'),
            avatar_url: ((u as { avatar_url?: string | null }).avatar_url ?? null),
          },
        ])
      )
    }

    return NextResponse.json({
      comentarios: rows.map((r) => ({
        ...r,
        author_name: map.get(r.user_id)?.name ?? 'Aluno',
        author_avatar_url: map.get(r.user_id)?.avatar_url ?? null,
      })),
    })
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

    const body = (await request.json().catch(() => ({}))) as { comentario?: string }
    const comentario = String(body.comentario ?? '').trim()
    if (!comentario) return NextResponse.json({ error: 'Comentário obrigatório' }, { status: 400 })

    const { data, error } = await supabase
      .from('projetos_reais_kanban_tarefa_comentarios')
      .insert({ tarefa_id: tarefaId, user_id: userId, comentario })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ comentario: data as DatabaseProjetoRealKanbanTarefaComentario })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
