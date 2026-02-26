import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * GET /api/admin/mentorias
 * Lista todas as mentorias (apenas admin)
 */
export async function GET(request: Request) {
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

    const { data: mentorias, error } = await supabase
      .from('mentorias')
      .select(`
        id,
        mentor_id,
        mentorado_id,
        objetivo_principal,
        status,
        created_at,
        updated_at,
        mentor:users!mentorias_mentor_id_fkey(id, name, email),
        mentorado:users!mentorias_mentorado_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ mentorias: mentorias || [] })
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}

/**
 * POST /api/admin/mentorias
 * Cria nova mentoria (apenas admin). Body: { mentor_id, mentorado_id, objetivo_principal }
 */
export async function POST(request: Request) {
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

    const body = await request.json()
    const { mentor_id, mentorado_id, objetivo_principal } = body

    if (!mentor_id || !mentorado_id || !objetivo_principal) {
      return NextResponse.json(
        { error: 'mentor_id, mentorado_id e objetivo_principal são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: mentoria, error } = await supabase
      .from('mentorias')
      .insert({
        mentor_id,
        mentorado_id,
        objetivo_principal: String(objetivo_principal).trim(),
        status: 'ativa',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(mentoria)
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
