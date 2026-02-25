import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * PATCH /api/admin/mentorias/steps/[stepId]
 * Atualiza step: titulo, descricao, ordem, status, habilitado
 */
export async function PATCH(
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
    const updates: Record<string, unknown> = {}
    if (body.titulo !== undefined) updates.titulo = body.titulo
    if (body.descricao !== undefined) updates.descricao = body.descricao
    if (typeof body.ordem === 'number') updates.ordem = body.ordem
    if (body.status !== undefined) updates.status = body.status
    if (typeof body.habilitado === 'boolean') updates.habilitado = body.habilitado

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('mentoria_steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}

/**
 * DELETE /api/admin/mentorias/steps/[stepId]
 */
export async function DELETE(
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
    const { error } = await supabase.from('mentoria_steps').delete().eq('id', stepId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
