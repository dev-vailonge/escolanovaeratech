/**
 * Lógica de cálculo dinâmico de badges
 * Badges são calculados dinamicamente, não armazenados (preferível para MVP)
 */

export interface Badge {
  type: 'top_member'
  earnedAt?: string
  metadata?: {
    totalCurtidas?: number
  }
}

/**
 * Calcula qual usuário tem o badge "Top Member"
 * Baseado em quem tem mais curtidas em perguntas criadas
 */
export async function calculateTopMemberBadge(): Promise<string | null> {
  try {
    const response = await fetch('/api/comunidade/badges/top-member')
    
    if (!response.ok) {
      console.warn('Erro ao calcular top member:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.userId || null
  } catch (error) {
    console.error('Erro ao calcular top member:', error)
    return null
  }
}

/**
 * Busca badges de um usuário
 * @param userId ID do usuário
 * @returns Array de badges do usuário
 */
export async function getUserBadges(userId: string): Promise<Badge[]> {
  try {
    const response = await fetch(`/api/comunidade/badges?userId=${userId}`)
    
    if (!response.ok) {
      console.warn('Erro ao buscar badges:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.badges || []
  } catch (error) {
    console.error('Erro ao buscar badges:', error)
    return []
  }
}

/**
 * Verifica se um usuário tem um badge específico
 */
export async function hasBadge(userId: string, badgeType: Badge['type']): Promise<boolean> {
  const badges = await getUserBadges(userId)
  return badges.some((b) => b.type === badgeType)
}

