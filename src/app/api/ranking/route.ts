import { NextRequest, NextResponse } from 'next/server'
import { getRanking, type RankingType } from '@/lib/server/gamification'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getCachedRanking, setCachedRanking } from '@/lib/server/rankingCache'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserIdFromBearer(request)

    const typeParam = request.nextUrl.searchParams.get('type')
    const type: RankingType = typeParam === 'geral' ? 'geral' : 'mensal'

    // Tenta usar cache primeiro
    let ranking = getCachedRanking(type)
    
    if (!ranking) {
      ranking = await getRanking({ type, limit: 50 })
      setCachedRanking(type, ranking)
    }

    const currentUser = ranking.find((r: any) => r.id === userId)

    const response = NextResponse.json({
      success: true,
      type,
      hotmart: {
        status: 'aguardando_permissao',
        message: 'Progresso de aulas assistidas na Hotmart ainda não está liberado.',
      },
      ranking,
      currentUserPosition: currentUser?.position || null,
    })

    // Headers de cache para o browser
    response.headers.set('Cache-Control', 'private, max-age=30')
    
    return response
  } catch (error: any) {
    console.error('Erro ao buscar ranking:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao buscar ranking' }, { status: 500 })
  }
}
