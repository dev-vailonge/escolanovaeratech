/**
 * Gerenciamento de Assinaturas Hotmart
 * 
 * Funções para verificar acesso e gerenciar assinaturas no banco de dados.
 */

import { supabase } from '../supabase'
import { createUser, getUserByEmail } from '../database'
import type { DatabaseHotmartSubscription } from '@/types/database'

/**
 * Verifica se um usuário tem acesso completo (formação ativa na Hotmart)
 * 
 * @param userId - ID do usuário
 * @returns 'full' se tiver assinatura ativa, 'limited' caso contrário
 */
export async function checkHotmartAccess(userId: string): Promise<'full' | 'limited'> {
  const { data, error } = await supabase
    .from('hotmart_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return 'limited'
  }

  return data.access_level
}

/**
 * Atualiza ou cria assinatura Hotmart
 * 
 * @param userId - ID do usuário
 * @param transactionData - Dados da transação Hotmart
 */
export async function upsertHotmartSubscription(
  userId: string,
  transactionData: {
    hotmart_transaction_id: string
    product_id: string
    status: 'active' | 'cancelled' | 'expired'
    expires_at?: string
  }
): Promise<boolean> {
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('hotmart_subscriptions')
    .select('*')
    .eq('hotmart_transaction_id', transactionData.hotmart_transaction_id)
    .single()

  const accessLevel: 'full' | 'limited' = transactionData.status === 'active' ? 'full' : 'limited'

  if (existing) {
    // Atualizar existente
    const { error } = await supabase
      .from('hotmart_subscriptions')
      .update({
        status: transactionData.status,
        access_level: accessLevel,
        expires_at: transactionData.expires_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating Hotmart subscription:', error)
      return false
    }
  } else {
    // Criar novo
    const { error } = await supabase
      .from('hotmart_subscriptions')
      .insert({
        user_id: userId,
        hotmart_transaction_id: transactionData.hotmart_transaction_id,
        product_id: transactionData.product_id,
        status: transactionData.status,
        access_level: accessLevel,
        expires_at: transactionData.expires_at || null,
      })

    if (error) {
      console.error('Error creating Hotmart subscription:', error)
      return false
    }
  }

  // Atualizar access_level do usuário
  await supabase
    .from('users')
    .update({ access_level: accessLevel })
    .eq('id', userId)

  return true
}

/**
 * Sincroniza access_level do usuário com assinaturas Hotmart ativas
 * 
 * @param userId - ID do usuário
 */
export async function syncUserAccessLevel(userId: string): Promise<void> {
  const accessLevel = await checkHotmartAccess(userId)
  
  await supabase
    .from('users')
    .update({ access_level: accessLevel })
    .eq('id', userId)
}




