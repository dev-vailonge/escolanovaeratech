import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ success: true, users: [] })
    }

    // Extrair token se disponível
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null

    const supabase = await getSupabaseClient(accessToken || undefined)

    // Buscar usuários que correspondem ao nome (case-insensitive)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .ilike('name', `%${query}%`)
      .limit(10)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ success: true, users: [] }) // Retornar vazio em caso de erro
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ success: true, users: [] }) // Retornar vazio em caso de erro
  }
}


