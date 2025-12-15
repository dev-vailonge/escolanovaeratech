/**
 * Integração com Hotmart (LEGADO - usar src/lib/hotmart/*)
 * 
 * Este arquivo mantém compatibilidade com código antigo.
 * Novas implementações devem usar os módulos em src/lib/hotmart/
 * 
 * @deprecated Use imports de '@/lib/hotmart' (que aponta para src/lib/hotmart/index.ts)
 */

// Re-exportar do módulo novo para manter compatibilidade
export { checkHotmartAccess, upsertHotmartSubscription, syncUserAccessLevel } from './hotmart/subscriptions'
export { getHotmartAccessToken, clearTokenCache } from './hotmart/auth'
export { listSalesHistory, fetchAllSalesHistory } from './hotmart/sales'
export type { SalesHistoryParams, SalesHistoryResponse } from './hotmart/sales'

// Função deprecated mantida para compatibilidade
// Use fetchAllSalesHistory de './hotmart/sales' ao invés
export async function fetchHotmartPurchases(
  startDate?: string,
  endDate?: string,
  page: number = 0,
  pageSize: number = 20
): Promise<any[]> {
  const { listSalesHistory } = await import('./hotmart/sales')
  const result = await listSalesHistory({ startDate, endDate, maxResults: pageSize, transactionStatus: ['APPROVED', 'COMPLETE'] })
  return result.items
}

// Função deprecated mantida para compatibilidade
// Use fetchAllSalesHistory de './hotmart/sales' ao invés
export async function syncHotmartHistoricalData(
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  const { fetchAllSalesHistory } = await import('./hotmart/sales')
  const { createUser, getUserByEmail } = await import('./database')
  const { upsertHotmartSubscription } = await import('./hotmart/subscriptions')
  
  let processed = 0
  let errors = 0

  await fetchAllSalesHistory(
    {
      maxResults: 100,
      startDate,
      endDate,
      transactionStatus: ['APPROVED', 'COMPLETE'],
    },
    async (items) => {
      for (const sale of items) {
        try {
          const status = sale.status || sale.purchase?.status || ''
          if (!['APPROVED', 'COMPLETE', 'COMPLETED', 'CONFIRMED'].includes(status.toUpperCase())) {
            continue
          }

          const buyer = sale.buyer || sale.purchase?.buyer || {}
          const purchase = sale.purchase || sale
          const product = sale.product || purchase.product || {}
          const email = buyer.email || buyer.mail

          if (!email) {
            errors++
            continue
          }

          let user = await getUserByEmail(email)
          if (!user) {
            const buyerName = buyer.name || buyer.first_name || email.split('@')[0] || 'Aluno'
            user = await createUser({
              email,
              name: buyerName,
              role: 'aluno',
              access_level: 'full',
            })
            if (!user) {
              errors++
              continue
            }
          }

          const transactionId = purchase.transaction || purchase.transaction_id || sale.transaction || sale.id
          const productId = product.id || product.product_id || 'unknown'
          const expiresDate = purchase.expires_date || purchase.expiration_date || null

          if (!transactionId) {
            errors++
            continue
          }

          const success = await upsertHotmartSubscription(user.id, {
            hotmart_transaction_id: transactionId.toString(),
            product_id: productId.toString(),
            status: 'active',
            expires_at: expiresDate || null,
          })

          if (success) {
            processed++
          } else {
            errors++
          }
        } catch (error) {
          console.error('❌ Erro ao processar venda:', error)
          errors++
        }
      }
    }
  )

  const message = `Sincronização concluída: ${processed} processadas, ${errors} erros`
  return {
    success: errors === 0,
    processed,
    errors,
    message,
  }
}
