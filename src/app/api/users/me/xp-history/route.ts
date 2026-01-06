import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import type { DatabaseUserXpHistory } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    // Obter userId autenticado via Bearer token
    const userId = await requireUserIdFromBearer(request)

    // Extrair token para usar no cliente
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null

    // Usar helper com fallback para anon key se necessário (sem service role key)
    const supabase = await getSupabaseClient(accessToken || undefined)

    // Buscar histórico de XP do usuário
    const { data: xpHistory, error } = await supabase
      .from('user_xp_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100) // Limitar a 100 registros mais recentes

    if (error) {
      console.error('Erro ao buscar histórico de XP:', error)
      return NextResponse.json({ error: 'Erro ao buscar histórico de XP' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      history: (xpHistory || []) as DatabaseUserXpHistory[]
    })
  } catch (error: any) {
    console.error('Erro na API de histórico de XP:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao buscar histórico de XP' }, { status: 500 })
  }
}

