import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type {
  DatabaseProjetoRealKanbanTarefa,
  DatabaseProjetoRealKanbanTarefaAssignee,
  ProjetoRealKanbanColuna,
} from '@/types/database'

const KANBAN_COLUNAS = new Set<ProjetoRealKanbanColuna>(['todo', 'doing', 'done'])
const KANBAN_LABELS = new Set(['iniciante', 'intermediário', 'avançado'])
const KANBAN_PLATAFORMAS = new Set(['Android', 'iOS', 'Web', 'Backend', 'Análise de dados'])

type KanbanTarefaComExtras = DatabaseProjetoRealKanbanTarefa & {
  assignees: Array<{ user_id: string; name: string; avatar_url: string | null }>
  commentsCount: number
}

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)
    const { id } = await params
    const projetoId = id?.trim()
    if (!projetoId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    if (!(await canAccessProjeto(supabase, projetoId, userId))) {
      return NextResponse.json({ error: 'Acesso negado ao board deste projeto.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('projetos_reais_kanban_tarefas')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const tarefas = (data || []) as DatabaseProjetoRealKanbanTarefa[]
    const tarefaIds = tarefas.map((t) => t.id)

    let assigneesByTask = new Map<string, Array<{ user_id: string; name: string; avatar_url: string | null }>>()
    let commentsCountByTask = new Map<string, number>()

    if (tarefaIds.length) {
      const { data: assRows } = await supabase
        .from('projetos_reais_kanban_tarefa_assignees')
        .select('id, tarefa_id, user_id')
        .in('tarefa_id', tarefaIds)
      const assignees = (assRows || []) as DatabaseProjetoRealKanbanTarefaAssignee[]
      const ids = [...new Set(assignees.map((a) => a.user_id))]
      let userMap = new Map<string, { name: string; avatar_url: string | null }>()
      if (ids.length) {
        const { data: users } = await supabase.from('users').select('id,name,avatar_url').in('id', ids)
        userMap = new Map(
          (users || []).map((u) => [u.id as string, { name: String((u as { name?: string }).name ?? 'Aluno'), avatar_url: ((u as { avatar_url?: string | null }).avatar_url ?? null) }])
        )
      }
      assigneesByTask = assignees.reduce((acc, a) => {
        const existing = acc.get(a.tarefa_id) || []
        const u = userMap.get(a.user_id)
        existing.push({
          user_id: a.user_id,
          name: u?.name || 'Aluno',
          avatar_url: u?.avatar_url ?? null,
        })
        acc.set(a.tarefa_id, existing)
        return acc
      }, new Map<string, Array<{ user_id: string; name: string; avatar_url: string | null }>>())

      const { data: commentsCountRows } = await supabase
        .from('projetos_reais_kanban_tarefa_comentarios')
        .select('tarefa_id')
        .in('tarefa_id', tarefaIds)
      commentsCountByTask = (commentsCountRows || []).reduce((acc, row) => {
        const taskId = String((row as { tarefa_id?: string }).tarefa_id ?? '')
        if (!taskId) return acc
        acc.set(taskId, (acc.get(taskId) || 0) + 1)
        return acc
      }, new Map<string, number>())
    }

    const withExtras: KanbanTarefaComExtras[] = tarefas.map((t) => ({
      ...t,
      labels: Array.isArray(t.labels) ? t.labels : [],
      plataformas: Array.isArray(t.plataformas) ? t.plataformas : [],
      imagem_url: t.imagem_url ?? null,
      assignees: assigneesByTask.get(t.id) || [],
      commentsCount: commentsCountByTask.get(t.id) || 0,
    }))

    return NextResponse.json({ tarefas: withExtras })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)
    const { id } = await params
    const projetoId = id?.trim()
    if (!projetoId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    if (!(await canAccessProjeto(supabase, projetoId, userId))) {
      return NextResponse.json({ error: 'Acesso negado ao board deste projeto.' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      titulo?: string
      descricao?: string
      coluna?: ProjetoRealKanbanColuna
      labels?: string[]
      plataformas?: string[]
      imagem_url?: string
      assignee_user_ids?: string[]
    }
    const titulo = String(body.titulo ?? '').trim()
    const descricao = String(body.descricao ?? '').trim()
    const labels = Array.isArray(body.labels)
      ? body.labels
          .map((v) => String(v).trim().toLowerCase())
          .filter((v) => KANBAN_LABELS.has(v))
      : []
    const plataformas = Array.isArray(body.plataformas)
      ? body.plataformas
          .map((v) => String(v).trim())
          .filter((v) => KANBAN_PLATAFORMAS.has(v))
      : []
    const imagem_url = String(body.imagem_url ?? '').trim()
    const assigneeIds = Array.isArray(body.assignee_user_ids)
      ? [...new Set(body.assignee_user_ids.map((v) => String(v).trim()).filter(Boolean))]
      : []
    const coluna = (body.coluna ?? 'todo') as ProjetoRealKanbanColuna

    if (!titulo) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    if (!KANBAN_COLUNAS.has(coluna)) {
      return NextResponse.json({ error: 'Coluna inválida' }, { status: 400 })
    }

    const { data: maxRow } = await supabase
      .from('projetos_reais_kanban_tarefas')
      .select('ordem')
      .eq('projeto_id', projetoId)
      .eq('coluna', coluna)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()
    const ordem = (maxRow?.ordem ?? -1) + 1

    const { data, error } = await supabase
      .from('projetos_reais_kanban_tarefas')
      .insert({
        projeto_id: projetoId,
        titulo,
        descricao: descricao || null,
        labels,
        plataformas,
        imagem_url: imagem_url || null,
        coluna,
        ordem,
        created_by: userId,
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (assigneeIds.length) {
      const { data: participants } = await supabase
        .from('projetos_reais_participantes')
        .select('user_id')
        .eq('projeto_id', projetoId)
        .in('user_id', assigneeIds)
      const validUserIds = (participants || []).map((p) => String((p as { user_id?: string }).user_id ?? '')).filter(Boolean)
      if (validUserIds.length) {
        await supabase.from('projetos_reais_kanban_tarefa_assignees').insert(
          validUserIds.map((uid) => ({ tarefa_id: (data as { id: string }).id, user_id: uid }))
        )
      }
    }
    return NextResponse.json({ tarefa: data as DatabaseProjetoRealKanbanTarefa })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
