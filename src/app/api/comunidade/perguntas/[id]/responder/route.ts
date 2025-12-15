import { NextResponse } from 'next/server'
import { responderComunidade } from '@/lib/server/gamification'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserIdFromBearer(request)

    const perguntaId = params.id
    if (!perguntaId) {
      return NextResponse.json({ error: 'perguntaId inválido' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const conteudo = String(body?.conteudo || '').trim()

    if (conteudo.length < 3) {
      return NextResponse.json({ error: 'conteudo muito curto' }, { status: 400 })
    }

    const result = await responderComunidade({ userId, perguntaId, conteudo })
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Erro ao responder comunidade:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao responder' }, { status: 500 })
  }
}


