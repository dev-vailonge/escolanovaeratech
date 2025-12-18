import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mentions = Array.isArray(body?.mentions) ? body.mentions : []

    if (mentions.length === 0) {
      return NextResponse.json({ success: true, userIds: [] })
    }

    const supabase = getSupabaseAdmin()

    // Buscar usuários pelos nomes (case-insensitive)
    // Criar query com OR para buscar cada menção
    let query = supabase
      .from('users')
      .select('id, name')
    
    // Filtrar por cada menção (case-insensitive)
    const conditions = mentions.map((m: string) => `name.ilike.%${m}%`).join(',')
    if (conditions) {
      query = query.or(conditions)
    }
    
    const { data: users } = await query

    const userIds = users?.map((u) => u.id) || []

    return NextResponse.json({ success: true, userIds })
  } catch (error: any) {
    console.error('Erro ao validar menções:', error)
    return NextResponse.json({ error: 'Erro ao validar menções' }, { status: 500 })
  }
}

