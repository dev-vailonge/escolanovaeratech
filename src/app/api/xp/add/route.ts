import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { insertXpEntry } from '@/lib/server/gamification'

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
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

    // Usar insertXpEntry que já gerencia tudo (histórico, sincronização de nível, etc)
    await insertXpEntry({
      userId,
      source: source as 'aula' | 'quiz' | 'desafio' | 'comunidade',
      sourceId: sourceId || '',
      amount,
      description: description || undefined,
      accessToken,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na API de adicionar XP:', error)
    if (error.message?.includes('Não autenticado')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Erro ao adicionar XP' },
      { status: 500 }
    )
  }
}





