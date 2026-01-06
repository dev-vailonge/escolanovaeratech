/**
 * Serviço de Sincronização de XP da Hotmart Club
 * 
 * Este módulo é responsável por sincronizar os pontos ganhos na Hotmart Club
 * com o sistema de XP do portal de alunos.
 */

import { insertHotmartXpEntry } from '@/lib/server/gamification'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { HOTMART_XP_CONSTANTS } from '@/lib/gamification/constants'
import type { ClubUser } from './users'

/**
 * Resultado da sincronização de XP
 */
export interface SyncHotmartXpResult {
  success: boolean
  xpAwarded: number
  entriesCreated: number
  errors: string[]
  syncedAt: string
}

/**
 * Dados necessários para calcular pontos da Hotmart
 * (quando a API estiver funcionando, esses dados virão da Club API)
 */
export interface HotmartXpData {
  userId: string
  email: string
  // Aulas
  aulasCompletas?: number
  aulasAvaliadas?: number
  // Interações na comunidade
  comentariosRealizados?: number
  comentariosRecebidos?: number
  reacoesRecebidas?: number
  // Timestamp da última sincronização
  lastSyncAt?: string
}

/**
 * Sincroniza pontos da Hotmart Club para um usuário
 * 
 * Esta função calcula e registra os pontos baseado nos dados fornecidos.
 * Evita duplicação verificando se já existe XP para cada ação.
 * 
 * @param data - Dados do usuário da Hotmart Club
 * @returns Resultado da sincronização
 */
export async function syncHotmartXp(data: HotmartXpData): Promise<SyncHotmartXpResult> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let xpAwarded = 0
  let entriesCreated = 0
  const syncedAt = new Date().toISOString()

  try {
    // 1. Aulas Concluídas (10 pontos cada)
    if (data.aulasCompletas && data.aulasCompletas > 0) {
      // Nota: Como não temos IDs específicos das aulas da Hotmart ainda,
      // vamos usar um source_id baseado no timestamp e quantidade
      // Quando a API estiver funcionando, devemos usar IDs reais
      const sourceId = `hotmart_aulas_completas_${data.userId}_${syncedAt}`
      
      // Verificar se já existe XP para esta ação (evitar duplicação)
      const { count: existingCount } = await supabase
        .from('user_xp_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.userId)
        .eq('source', 'hotmart')
        .eq('source_id', sourceId)

      if (!existingCount || existingCount === 0) {
        const totalXp = data.aulasCompletas * HOTMART_XP_CONSTANTS.aulaConcluida
        try {
          await insertHotmartXpEntry({
            userId: data.userId,
            sourceId,
            amount: totalXp,
            description: `${data.aulasCompletas} aula(s) concluída(s) na Hotmart Club`,
          })
          xpAwarded += totalXp
          entriesCreated++
        } catch (error: any) {
          errors.push(`Erro ao registrar aulas completas: ${error.message}`)
        }
      }
    }

    // 2. Aulas Avaliadas (2 pontos cada)
    if (data.aulasAvaliadas && data.aulasAvaliadas > 0) {
      const sourceId = `hotmart_aulas_avaliadas_${data.userId}_${syncedAt}`
      
      const { count: existingCount } = await supabase
        .from('user_xp_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.userId)
        .eq('source', 'hotmart')
        .eq('source_id', sourceId)

      if (!existingCount || existingCount === 0) {
        const totalXp = data.aulasAvaliadas * HOTMART_XP_CONSTANTS.aulaAvaliada
        try {
          await insertHotmartXpEntry({
            userId: data.userId,
            sourceId,
            amount: totalXp,
            description: `${data.aulasAvaliadas} aula(s) avaliada(s) na Hotmart Club`,
          })
          xpAwarded += totalXp
          entriesCreated++
        } catch (error: any) {
          errors.push(`Erro ao registrar aulas avaliadas: ${error.message}`)
        }
      }
    }

    // 3. Comentários Realizados (1 ponto cada)
    if (data.comentariosRealizados && data.comentariosRealizados > 0) {
      const sourceId = `hotmart_comentarios_realizados_${data.userId}_${syncedAt}`
      
      const { count: existingCount } = await supabase
        .from('user_xp_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.userId)
        .eq('source', 'hotmart')
        .eq('source_id', sourceId)

      if (!existingCount || existingCount === 0) {
        const totalXp = data.comentariosRealizados * HOTMART_XP_CONSTANTS.comentario
        try {
          await insertHotmartXpEntry({
            userId: data.userId,
            sourceId,
            amount: totalXp,
            description: `${data.comentariosRealizados} comentário(s) realizado(s) na Hotmart Club`,
          })
          xpAwarded += totalXp
          entriesCreated++
        } catch (error: any) {
          errors.push(`Erro ao registrar comentários realizados: ${error.message}`)
        }
      }
    }

    // 4. Comentários Recebidos (1 ponto cada)
    if (data.comentariosRecebidos && data.comentariosRecebidos > 0) {
      const sourceId = `hotmart_comentarios_recebidos_${data.userId}_${syncedAt}`
      
      const { count: existingCount } = await supabase
        .from('user_xp_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.userId)
        .eq('source', 'hotmart')
        .eq('source_id', sourceId)

      if (!existingCount || existingCount === 0) {
        const totalXp = data.comentariosRecebidos * HOTMART_XP_CONSTANTS.comentarioRecebido
        try {
          await insertHotmartXpEntry({
            userId: data.userId,
            sourceId,
            amount: totalXp,
            description: `${data.comentariosRecebidos} comentário(s) recebido(s) na Hotmart Club`,
          })
          xpAwarded += totalXp
          entriesCreated++
        } catch (error: any) {
          errors.push(`Erro ao registrar comentários recebidos: ${error.message}`)
        }
      }
    }

    // 5. Reações Recebidas (1 ponto cada)
    if (data.reacoesRecebidas && data.reacoesRecebidas > 0) {
      const sourceId = `hotmart_reacoes_recebidas_${data.userId}_${syncedAt}`
      
      const { count: existingCount } = await supabase
        .from('user_xp_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.userId)
        .eq('source', 'hotmart')
        .eq('source_id', sourceId)

      if (!existingCount || existingCount === 0) {
        const totalXp = data.reacoesRecebidas * HOTMART_XP_CONSTANTS.reacaoRecebida
        try {
          await insertHotmartXpEntry({
            userId: data.userId,
            sourceId,
            amount: totalXp,
            description: `${data.reacoesRecebidas} reação(ões) recebida(s) na Hotmart Club`,
          })
          xpAwarded += totalXp
          entriesCreated++
        } catch (error: any) {
          errors.push(`Erro ao registrar reações recebidas: ${error.message}`)
        }
      }
    }

    return {
      success: errors.length === 0,
      xpAwarded,
      entriesCreated,
      errors,
      syncedAt,
    }
  } catch (error: any) {
    errors.push(`Erro geral na sincronização: ${error.message}`)
    return {
      success: false,
      xpAwarded,
      entriesCreated,
      errors,
      syncedAt,
    }
  }
}

/**
 * Calcula pontos da Hotmart baseado em dados do ClubUser
 * 
 * Esta função extrai dados do ClubUser e calcula os pontos.
 * Quando a API estiver funcionando completamente, esta função será
 * atualizada para usar dados reais da API.
 * 
 * @param clubUser - Dados do usuário da Club API
 * @returns Dados formatados para sincronização
 */
export function calculateHotmartXpFromClubUser(clubUser: ClubUser): HotmartXpData {
  // Calcular aulas completas baseado em progress.completed
  const aulasCompletas = clubUser.progress?.completed || 0
  
  // Por enquanto, não temos dados específicos sobre:
  // - Aulas avaliadas
  // - Comentários realizados/recebidos
  // - Reações recebidas
  // 
  // Quando a API estiver funcionando, esses dados devem vir da API
  // ou de endpoints específicos da Hotmart Club

  return {
    userId: clubUser.user_id,
    email: clubUser.email,
    aulasCompletas,
    aulasAvaliadas: 0, // TODO: Implementar quando API estiver disponível
    comentariosRealizados: 0, // TODO: Implementar quando API estiver disponível
    comentariosRecebidos: 0, // TODO: Implementar quando API estiver disponível
    reacoesRecebidas: 0, // TODO: Implementar quando API estiver disponível
  }
}





