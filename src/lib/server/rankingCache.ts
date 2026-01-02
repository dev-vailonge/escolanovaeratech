import type { RankingType } from '@/lib/server/gamification'

// Cache simples em memória (válido por 30 segundos)
let rankingCache: {
  mensal: { data: any[]; timestamp: number } | null
  geral: { data: any[]; timestamp: number } | null
} = { mensal: null, geral: null }

const CACHE_TTL_MS = 30 * 1000 // 30 segundos

export function getCachedRanking(type: RankingType): any[] | null {
  const cached = rankingCache[type]
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    rankingCache[type] = null
    return null
  }
  return cached.data
}

export function setCachedRanking(type: RankingType, data: any[]) {
  rankingCache[type] = { data, timestamp: Date.now() }
}

// Função para invalidar o cache (pode ser usada por outras rotas)
export function invalidateRankingCache() {
  rankingCache = { mensal: null, geral: null }
  console.log('🔄 Cache de ranking invalidado')
}




