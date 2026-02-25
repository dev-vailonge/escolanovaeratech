import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * POST /api/admin/mentorias/steps/[stepId]/tarefas
 * Adiciona tarefa ao step. Body: { titulo, descricao?, links? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { stepId } = await params
    const body = await request.json()
    const titulo = body.titulo?.trim()
    const descricao = body.descricao?.trim() ?? ''
    const links = Array.isArray(body.links) ? body.links : []

    if (!titulo) {
      return NextResponse.json({ error: 'titulo é obrigatório' }, { status: 400 })
    }

    const { data: tarefa, error } = await supabase
      .from('mentoria_tarefas')
      .insert({
        step_id: stepId,
        titulo,
        descricao,
        links: links,
        concluida: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(tarefa)
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
