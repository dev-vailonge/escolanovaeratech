/**
 * Integração com Hotmart - Módulo Principal
 * 
 * Exporta todas as funções públicas da integração Hotmart
 */

// Autenticação
export { getHotmartAccessToken, clearTokenCache } from './auth'

// Vendas
export { listSalesHistory, fetchAllSalesHistory } from './sales'
export type { SalesHistoryParams, SalesHistoryResponse } from './sales'

// Assinaturas e acesso (mantido do arquivo original)
export { checkHotmartAccess, upsertHotmartSubscription, syncUserAccessLevel } from './subscriptions'






