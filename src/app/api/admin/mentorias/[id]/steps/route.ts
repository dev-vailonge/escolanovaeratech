import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * POST /api/admin/mentorias/[id]/steps
 * Cria um step na mentoria. Body: { titulo, descricao, ordem?, habilitado? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: mentoria_id } = await params
    const body = await request.json()
    const titulo = body.titulo?.trim()
    const descricao = body.descricao?.trim() ?? ''
    const ordem = typeof body.ordem === 'number' ? body.ordem : 0
    const habilitado = body.habilitado ?? false

    if (!titulo) {
      return NextResponse.json({ error: 'titulo é obrigatório' }, { status: 400 })
    }

    const { data: step, error } = await supabase
      .from('mentoria_steps')
      .insert({
        mentoria_id,
        titulo,
        descricao,
        ordem,
        habilitado,
        status: 'nao_iniciado',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(step)
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
