import { NextRequest, NextResponse } from 'next/server'
import { getRanking, type RankingType } from '@/lib/server/gamification'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getCachedRanking, setCachedRanking } from '@/lib/server/rankingCache'

export async function GET(request: NextRequest) {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null
    
    const userId = await requireUserIdFromBearer(request)

    const typeParam = request.nextUrl.searchParams.get('type')
    const type: RankingType = typeParam === 'geral' ? 'geral' : 'mensal'

    // Tenta usar cache primeiro
    let ranking = getCachedRanking(type)
    
    if (!ranking) {
      try {
        // Passar accessToken para ajudar com RLS se necessário
        ranking = await getRanking({ type, limit: 50, accessToken: accessToken || undefined })
        if (ranking) {
          console.log(`[API /ranking] Ranking ${type} carregado: ${ranking.length} usuários`)
          setCachedRanking(type, ranking)
        }
      } catch (rankingError: any) {
        console.error('Erro ao buscar ranking do banco:', {
          message: rankingError?.message,
          details: rankingError?.details,
          hint: rankingError?.hint,
          code: rankingError?.code,
          stack: rankingError?.stack,
        })
        // Se falhar, retornar array vazio em vez de erro 500
        // Isso permite que a página carregue mesmo sem dados
        ranking = []
      }
    } else {
      console.log(`[API /ranking] Usando cache para ranking ${type}: ${ranking.length} usuários`)
    }

    const currentUser = ranking.find((r: any) => r.id === userId)

    const response = NextResponse.json({
      success: true,
      type,
      hotmart: {
        status: 'aguardando_permissao',
        message: 'Progresso de aulas assistidas na Hotmart ainda não está liberado.',
      },
      ranking: ranking || [],
      currentUserPosition: currentUser?.position || null,
      debug: {
        rankingCount: ranking?.length || 0,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    })

    // Headers de cache para o browser
    response.headers.set('Cache-Control', 'private, max-age=30')
    
    return response
  } catch (error: any) {
    console.error('Erro ao buscar ranking:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    // Retornar array vazio em vez de erro 500 para não quebrar a página
    return NextResponse.json({ 
      success: true,
      type: 'mensal',
      ranking: [],
      currentUserPosition: null,
      error: 'Erro ao carregar ranking. Tente novamente mais tarde.'
    }, { status: 200 })
  }
}
