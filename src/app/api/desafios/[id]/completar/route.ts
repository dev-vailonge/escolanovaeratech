import { NextResponse } from 'next/server'
import { completarDesafio } from '@/lib/server/gamification'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserIdFromBearer(_)

    const desafioId = params.id
    if (!desafioId) {
      return NextResponse.json({ error: 'desafioId inválido' }, { status: 400 })
    }

    const result = await completarDesafio({ userId, desafioId })
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Erro ao completar desafio:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao completar desafio' }, { status: 500 })
  }
}


