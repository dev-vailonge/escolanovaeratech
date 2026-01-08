import { NextResponse } from 'next/server'
import { completarQuiz } from '@/lib/server/gamification'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)

    const quizId = params.id
    if (!quizId) {
      return NextResponse.json({ error: 'quizId inválido' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const pontuacao = Number(body?.pontuacao)
    const respostas = body?.respostas // Array de { questionId, selectedOptionId, correct }

    if (!Number.isFinite(pontuacao) || pontuacao < 0 || pontuacao > 100) {
      return NextResponse.json({ error: 'pontuacao inválida (0-100)' }, { status: 400 })
    }

    const result = await completarQuiz({ userId, quizId, pontuacao, respostas, accessToken })
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Erro ao completar quiz:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao completar quiz' }, { status: 500 })
  }
}


