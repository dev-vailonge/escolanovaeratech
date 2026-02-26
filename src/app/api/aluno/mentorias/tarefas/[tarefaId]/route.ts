import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * PATCH /api/aluno/mentorias/tarefas/[tarefaId]
 * Aluno marca/desmarca tarefa como concluída (apenas se for o mentorado da mentoria).
 * Body: { concluida: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tarefaId: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const { tarefaId } = await params
    const body = await request.json()
    const concluida = body.concluida === true

    const { data: tarefa, error: tarefaError } = await supabase
      .from('mentoria_tarefas')
      .select('id, step_id, concluida')
      .eq('id', tarefaId)
      .single()

    if (tarefaError || !tarefa) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    const { data: step } = await supabase
      .from('mentoria_steps')
      .select('mentoria_id')
      .eq('id', tarefa.step_id)
      .single()

    if (!step) {
      return NextResponse.json({ error: 'Step não encontrado' }, { status: 404 })
    }

    const { data: mentoria } = await supabase
      .from('mentorias')
      .select('mentorado_id')
      .eq('id', step.mentoria_id)
      .single()

    if (!mentoria || mentoria.mentorado_id !== userId) {
      return NextResponse.json({ error: 'Sem permissão para alterar esta tarefa' }, { status: 403 })
    }

    const { data: updated, error } = await supabase
      .from('mentoria_tarefas')
      .update({ concluida })
      .eq('id', tarefaId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: allTarefas } = await supabase
      .from('mentoria_tarefas')
      .select('concluida')
      .eq('step_id', tarefa.step_id)

    const total = allTarefas?.length ?? 0
    const concluidas = allTarefas?.filter((t) => t.concluida).length ?? 0
    let novoStatus: 'nao_iniciado' | 'em_progresso' | 'concluido' =
      concluidas === 0 ? 'nao_iniciado' : concluidas < total ? 'em_progresso' : 'concluido'

    await supabase
      .from('mentoria_steps')
      .update({ status: novoStatus })
      .eq('id', tarefa.step_id)

    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
