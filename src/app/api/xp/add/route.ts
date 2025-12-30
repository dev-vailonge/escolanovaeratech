import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const body = await request.json()
    const { amount, source, sourceId, description } = body

    if (!amount || !source) {
      return NextResponse.json(
        { error: 'amount e source são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar que o userId da requisição é o mesmo do token
    if (body.userId && body.userId !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('user_xp_history')
      .insert({
        user_id: userId,
        amount,
        source,
        source_id: sourceId || null,
        description: description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao adicionar XP:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao adicionar XP' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erro na API de adicionar XP:', error)
    if (error.message?.includes('Não autenticado')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao adicionar XP' },
      { status: 500 }
    )
  }
}




