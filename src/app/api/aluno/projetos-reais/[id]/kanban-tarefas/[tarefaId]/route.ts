import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type { DatabaseProjetoRealKanbanTarefa, ProjetoRealKanbanColuna } from '@/types/database'

const KANBAN_COLUNAS = new Set<ProjetoRealKanbanColuna>(['todo', 'doing', 'done'])
const KANBAN_LABELS = new Set(['iniciante', 'intermediário', 'avançado'])
const KANBAN_PLATAFORMAS = new Set(['Android', 'iOS', 'Web', 'Backend', 'Análise de dados'])

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

type Params = { params: Promise<{ id: string; tarefaId: string }> }

export async function PATCH(request: Request, { params }: Params) {
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

    const body = (await request.json().catch(() => ({}))) as {
      titulo?: string
      descricao?: string | null
      coluna?: ProjetoRealKanbanColuna
      ordem?: number
      labels?: string[]
      plataformas?: string[]
      imagem_url?: string | null
      assignee_user_ids?: string[]
    }
    const updates: Record<string, unknown> = {}
    if (body.titulo !== undefined) {
      const titulo = String(body.titulo).trim()
      if (!titulo) return NextResponse.json({ error: 'Título inválido' }, { status: 400 })
      updates.titulo = titulo
    }
    if (body.descricao !== undefined) {
      const desc = body.descricao == null ? '' : String(body.descricao)
      updates.descricao = desc.trim() || null
    }
    if (body.coluna !== undefined) {
      if (!KANBAN_COLUNAS.has(body.coluna)) {
        return NextResponse.json({ error: 'Coluna inválida' }, { status: 400 })
      }
      updates.coluna = body.coluna
    }
    if (body.ordem !== undefined) {
      const ordem = Math.floor(Number(body.ordem))
      if (!Number.isFinite(ordem) || ordem < 0) {
        return NextResponse.json({ error: 'Ordem inválida' }, { status: 400 })
      }
      updates.ordem = ordem
    }
    if (body.labels !== undefined) {
      if (!Array.isArray(body.labels)) {
        return NextResponse.json({ error: 'labels inválido' }, { status: 400 })
      }
      updates.labels = body.labels
        .map((v) => String(v).trim().toLowerCase())
        .filter((v) => KANBAN_LABELS.has(v))
    }
    if (body.plataformas !== undefined) {
      if (!Array.isArray(body.plataformas)) {
        return NextResponse.json({ error: 'plataformas inválido' }, { status: 400 })
      }
      updates.plataformas = body.plataformas
        .map((v) => String(v).trim())
        .filter((v) => KANBAN_PLATAFORMAS.has(v))
    }
    if (body.imagem_url !== undefined) {
      const url = body.imagem_url == null ? '' : String(body.imagem_url).trim()
      updates.imagem_url = url || null
    }
    if (Object.keys(updates).length === 0 && body.assignee_user_ids === undefined) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
    }
    let data: unknown = null
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      const updated = await supabase
        .from('projetos_reais_kanban_tarefas')
        .update(updates)
        .eq('id', tarefaId)
        .eq('projeto_id', projetoId)
        .select('*')
        .single()
      if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 })
      data = updated.data
    }

    if (body.assignee_user_ids !== undefined) {
      if (!Array.isArray(body.assignee_user_ids)) {
        return NextResponse.json({ error: 'assignee_user_ids inválido' }, { status: 400 })
      }
      const wanted = [...new Set(body.assignee_user_ids.map((v) => String(v).trim()).filter(Boolean))]
      const { data: participants } = await supabase
        .from('projetos_reais_participantes')
        .select('user_id')
        .eq('projeto_id', projetoId)
        .in('user_id', wanted)
      const validUserIds = (participants || [])
        .map((p) => String((p as { user_id?: string }).user_id ?? ''))
        .filter(Boolean)

      await supabase
        .from('projetos_reais_kanban_tarefa_assignees')
        .delete()
        .eq('tarefa_id', tarefaId)

      if (validUserIds.length) {
        await supabase.from('projetos_reais_kanban_tarefa_assignees').insert(
          validUserIds.map((uid) => ({ tarefa_id: tarefaId, user_id: uid }))
        )
      }
    }
    if (!data) {
      const fresh = await supabase
        .from('projetos_reais_kanban_tarefas')
        .select('*')
        .eq('id', tarefaId)
        .eq('projeto_id', projetoId)
        .single()
      if (fresh.error) return NextResponse.json({ error: fresh.error.message }, { status: 500 })
      data = fresh.data
    }
    return NextResponse.json({ tarefa: data as DatabaseProjetoRealKanbanTarefa })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}

export async function DELETE(request: Request, { params }: Params) {
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
      .from('projetos_reais_kanban_tarefas')
      .delete()
      .eq('id', tarefaId)
      .eq('projeto_id', projetoId)
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
