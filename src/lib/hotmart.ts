/**
 * Integração com Hotmart
 * 
 * Funções para verificar acesso à formação e gerenciar assinaturas.
 */

import { supabase } from './supabase'
import { createUser, getUserByEmail } from './database'
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

/**
 * Obtém token de acesso OAuth da Hotmart
 * Requer CLIENT_ID e CLIENT_SECRET configurados
 */
async function getHotmartAccessToken(): Promise<string | null> {
  const CLIENT_ID = process.env.HOTMART_CLIENT_ID
  const CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ HOTMART_CLIENT_ID ou HOTMART_CLIENT_SECRET não configurados')
    return null
  }

  try {
    const response = await fetch('https://api-sec-vlc.hotmart.com/security/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      console.error(`❌ Erro ao obter token Hotmart: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('❌ Erro ao obter token Hotmart:', error)
    return null
  }
}

/**
 * Busca compras/vendas históricas da Hotmart via API
 * Requer credenciais configuradas
 * 
 * @param startDate - Data de início (formato: YYYY-MM-DD)
 * @param endDate - Data de fim (formato: YYYY-MM-DD)
 * @param page - Página (padrão: 0)
 * @param pageSize - Itens por página (padrão: 20, máximo: 100)
 */
export async function fetchHotmartPurchases(
  startDate?: string,
  endDate?: string,
  page: number = 0,
  pageSize: number = 20
): Promise<any[]> {
  const token = await getHotmartAccessToken()
  
  if (!token) {
    console.error('❌ Não foi possível obter token de acesso da Hotmart')
    return []
  }

  try {
    // Construir query params
    const params = new URLSearchParams({
      page: page.toString(),
      rows: Math.min(pageSize, 100).toString(),
    })

    if (startDate) {
      params.append('start_date', startDate)
    }
    if (endDate) {
      params.append('end_date', endDate)
    }

    const response = await fetch(
      `https://developers.hotmart.com/payments/api/v1/sales?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(`❌ Erro ao buscar compras Hotmart: ${response.status}`)
      const errorText = await response.text()
      console.error('Detalhes do erro:', errorText)
      return []
    }

    const data = await response.json()
    
    // A estrutura da resposta pode variar, ajustar conforme necessário
    return data.items || data.data || data || []
  } catch (error) {
    console.error('❌ Erro ao buscar compras Hotmart:', error)
    return []
  }
}

/**
 * Sincroniza dados históricos da Hotmart
 * Busca todas as compras e cria/atualiza usuários e assinaturas
 * 
 * @param startDate - Data de início (formato: YYYY-MM-DD)
 * @param endDate - Data de fim (formato: YYYY-MM-DD)
 */
export async function syncHotmartHistoricalData(
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  let processed = 0
  let errors = 0
  let page = 0
  const pageSize = 100
  let hasMore = true

  console.log('🔄 Iniciando sincronização de dados históricos da Hotmart...')

  while (hasMore) {
    try {
      const purchases = await fetchHotmartPurchases(startDate, endDate, page, pageSize)
      
      if (purchases.length === 0) {
        hasMore = false
        break
      }

      console.log(`📦 Processando página ${page + 1} com ${purchases.length} compras...`)

      for (const purchase of purchases) {
        try {
          // Extrair dados do comprador
          const buyer = purchase.buyer || purchase.purchaser || {}
          const email = buyer.email
          const name = buyer.name || buyer.first_name || email?.split('@')[0] || 'Aluno'

          if (!email) {
            console.warn('⚠️ Compra sem email do comprador, pulando...')
            errors++
            continue
          }

          // Criar ou buscar usuário
          let user = await getUserByEmail(email)
          
          if (!user) {
            // Determinar status e access_level baseado no status da compra
            const status = purchase.status?.toLowerCase() || 'approved'
            const accessLevel = status === 'approved' ? 'full' : 'limited'
            
            user = await createUser({
              email,
              name,
              role: 'aluno',
              access_level: accessLevel,
            })

            if (!user) {
              console.error(`❌ Erro ao criar usuário: ${email}`)
              errors++
              continue
            }
          }

          // Criar ou atualizar assinatura
          const product = purchase.product || {}
          const transactionId = purchase.transaction || purchase.id || purchase.transaction_id
          
          if (!transactionId) {
            console.warn(`⚠️ Compra sem transaction_id, pulando...`)
            errors++
            continue
          }

          const status = purchase.status?.toLowerCase() === 'approved' ? 'active' : 
                        purchase.status?.toLowerCase() === 'cancelled' ? 'cancelled' : 
                        purchase.status?.toLowerCase() === 'expired' ? 'expired' : 'active'

          const success = await upsertHotmartSubscription(user.id, {
            hotmart_transaction_id: transactionId.toString(),
            product_id: product.id?.toString() || product.product_id?.toString() || 'unknown',
            status: status as 'active' | 'cancelled' | 'expired',
            expires_at: purchase.expires_date || purchase.expiration_date || null,
          })

          if (success) {
            processed++
          } else {
            errors++
          }
        } catch (error) {
          console.error('❌ Erro ao processar compra:', error)
          errors++
        }
      }

      // Se retornou menos que pageSize, não há mais páginas
      if (purchases.length < pageSize) {
        hasMore = false
      } else {
        page++
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar página ${page}:`, error)
      errors++
      hasMore = false
    }
  }

  const message = `Sincronização concluída: ${processed} processadas, ${errors} erros`
  console.log(`✅ ${message}`)

  return {
    success: errors === 0,
    processed,
    errors,
    message,
  }
}

