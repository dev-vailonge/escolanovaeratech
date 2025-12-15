import { NextRequest, NextResponse } from 'next/server'
import { getRanking, type RankingType } from '@/lib/server/gamification'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

// Cache simples em memória (válido por 30 segundos)
let rankingCache: {
  mensal: { data: any[]; timestamp: number } | null
  geral: { data: any[]; timestamp: number } | null
} = { mensal: null, geral: null }

const CACHE_TTL_MS = 30 * 1000 // 30 segundos

function getCachedRanking(type: RankingType): any[] | null {
  const cached = rankingCache[type]
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    rankingCache[type] = null
    return null
  }
  return cached.data
}

function setCachedRanking(type: RankingType, data: any[]) {
  rankingCache[type] = { data, timestamp: Date.now() }
}

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


