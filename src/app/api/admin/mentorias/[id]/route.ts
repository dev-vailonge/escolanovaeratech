import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * GET /api/admin/mentorias/[id]
 * Retorna uma mentoria com steps e tarefas (apenas admin)
 */
export async function GET(
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

    const { id } = await params

    const { data: mentoria, error } = await supabase
      .from('mentorias')
      .select(`
        *,
        mentor:users!mentorias_mentor_id_fkey(id, name, email),
        mentorado:users!mentorias_mentorado_id_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error || !mentoria) {
      return NextResponse.json({ error: 'Mentoria não encontrada' }, { status: 404 })
    }

    const { data: steps } = await supabase
      .from('mentoria_steps')
      .select(`
        *,
        tarefas:mentoria_tarefas(*)
      `)
      .eq('mentoria_id', id)
      .order('ordem', { ascending: true })

    const stepsWithTarefas = (steps || []).map((s: any) => ({
      ...s,
      tarefas: s.tarefas || [],
    }))

    return NextResponse.json({
      ...mentoria,
      steps: stepsWithTarefas,
    })
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}

/**
 * PATCH /api/admin/mentorias/[id]
 * Atualiza objetivo_principal e/ou status (apenas admin)
 */
export async function PATCH(
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

    const { id } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.objetivo_principal !== undefined) updates.objetivo_principal = body.objetivo_principal
    if (body.status !== undefined) updates.status = body.status

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('mentorias')
      .update(updates)
      .eq('id', id)
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
