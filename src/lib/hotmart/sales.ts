/**
 * API de Vendas da Hotmart
 * 
 * Documentação: https://developers.hotmart.com/docs/pt-BR/api/1.0.0/reference/sales-api/
 */

import { getHotmartAccessToken, clearTokenCache } from './auth'
import { getApiBase, getApiBaseSandbox } from './config'

export interface SalesHistoryParams {
  pageToken?: string // Token de paginação (cursor)
  maxResults?: number // Máximo de resultados por página (padrão: 100)
  startDate?: string // YYYY-MM-DD (será convertido para timestamp)
  endDate?: string // YYYY-MM-DD (será convertido para timestamp)
  productId?: string
  buyerEmail?: string
  buyerName?: string
  transactionStatus?: string[] // Array de status (APPROVED, COMPLETE, etc.)
  transaction?: string // Código único da transação
  salesSource?: string // Código SRC
  paymentType?: string
  offerCode?: string
  commissionAs?: string
}

export interface SalesHistoryResponse {
  items: any[]
  nextPageToken?: string // Token para próxima página
  prevPageToken?: string // Token para página anterior
  pageInfo?: {
    nextPageToken?: string
    prevPageToken?: string
  }
  hostUsed?: string // Host que funcionou (para debug)
  needsRetry?: boolean // Se precisa retry com novo token
  newToken?: string // Novo token se needsRetry
}

/**
 * Converte data YYYY-MM-DD para timestamp em milissegundos
 */
function dateToTimestamp(date: string): number {
  return new Date(date + 'T00:00:00Z').getTime()
}

/**
 * Lista histórico de vendas da Hotmart
 * 
 * Documentação oficial: https://developers.hotmart.com/docs/pt-BR/api/1.0.0/reference/sales-api/history
 * 
 * Endpoint oficial confirmado: GET /payments/api/v1/sales/history
 * Host: https://api.hotmart.com (produção) ou https://sandbox.hotmart.com (sandbox)
 * 
 * IMPORTANTE - Comportamento Padrão (conforme documentação oficial):
 * - Se NÃO informar `transaction` OU `transaction_status`, a API retorna APENAS vendas com status APPROVED e COMPLETE
 * - Para buscar TODOS os status, é OBRIGATÓRIO informar `transaction_status` com os valores desejados
 * - Usa paginação por cursor (page_token) ao invés de numérica
 * - Datas devem estar em timestamp (milissegundos)
 * 
 * Valores possíveis para transaction_status:
 * APPROVED, BLOCKED, CANCELLED, CHARGEBACK, COMPLETE, EXPIRED, NO_FUNDS, OVERDUE,
 * PARTIALLY_REFUNDED, PRE_ORDER, PRINTED_BILLET, PROCESSING_TRANSACTION, PROTESTED,
 * REFUNDED, STARTED, UNDER_ANALISYS, WAITING_PAYMENT
 * 
 * @param params - Parâmetros de busca
 * @returns Lista de vendas ou array vazio se falhar
 */
export async function listSalesHistory(
  params: SalesHistoryParams = {}
): Promise<SalesHistoryResponse> {
  const token = await getHotmartAccessToken()
  
  if (!token) {
    console.error('❌ Não foi possível obter token de acesso')
    return { items: [] }
  }

  // Verificar se o token parece válido (não vazio e tem formato básico)
  if (token.length < 50) {
    console.error('⚠️ Token parece inválido (muito curto)')
    return { items: [] }
  }

  const {
    pageToken,
    maxResults = 100,
    startDate,
    endDate,
    productId,
    buyerEmail,
    buyerName,
    transactionStatus = ['APPROVED', 'COMPLETE'], // Padrão: apenas aprovadas/completas
    transaction,
    salesSource,
    paymentType,
    offerCode,
    commissionAs,
  } = params

  try {
    // Construir query params conforme documentação oficial
    const queryParams = new URLSearchParams()
    
    // Paginação por cursor (obrigatório conforme docs)
    if (pageToken) {
      queryParams.append('page_token', pageToken)
    }
    
    // Máximo de resultados por página
    queryParams.append('max_results', Math.min(maxResults, 100).toString())

    // Datas em timestamp (milissegundos)
    if (startDate) {
      queryParams.append('start_date', dateToTimestamp(startDate).toString())
    }
    if (endDate) {
      // Adicionar 23:59:59 ao final do dia
      const endDateTime = new Date(endDate + 'T23:59:59Z').getTime()
      queryParams.append('end_date', endDateTime.toString())
    }
    
    // Filtros opcionais
    if (productId) {
      queryParams.append('product_id', productId)
    }
    if (buyerEmail) {
      queryParams.append('buyer_email', buyerEmail)
    }
    if (buyerName) {
      queryParams.append('buyer_name', buyerName)
    }
    if (transaction) {
      queryParams.append('transaction', transaction)
    }
    if (salesSource) {
      queryParams.append('sales_source', salesSource)
    }
    if (paymentType) {
      queryParams.append('payment_type', paymentType)
    }
    if (offerCode) {
      queryParams.append('offer_code', offerCode)
    }
    if (commissionAs) {
      queryParams.append('commission_as', commissionAs)
    }
    
    // IMPORTANTE: transaction OU transaction_status é OBRIGATÓRIO para buscar todos os status
    // Conforme documentação oficial: se não informar esses filtros, retorna apenas APPROVED e COMPLETE
    // Múltiplos valores separados por vírgula
    if (transactionStatus && transactionStatus.length > 0) {
      queryParams.append('transaction_status', transactionStatus.join(','))
    }
    // Se transaction foi informado, não precisa de transaction_status (mas pode usar ambos)
    // O código atual sempre envia transaction_status por padrão (APPROVED, COMPLETE)

    // IMPORTANTE: Tentar múltiplos endpoints possíveis
    // A Hotmart pode ter diferentes versões ou caminhos
    const apiBase = getApiBase()
    const apiBaseSandbox = getApiBaseSandbox()
    
    // Endpoints possíveis (tentativa de fallback se o oficial não funcionar)
    // ENDPOINT OFICIAL CONFIRMADO: /payments/api/v1/sales/history
    // Documentação: https://developers.hotmart.com/docs/pt-BR/api/1.0.0/reference/sales-api/history
    const possibleEndpoints = [
      // Endpoint oficial confirmado pela documentação
      '/payments/api/v1/sales/history',
      // Endpoints alternativos (caso o oficial não esteja disponível)
      '/payments/api/v1/sales',
      '/sales/api/v1/history',
      '/sales/api/v1/sales/history',
      // Variações alternativas possíveis (fallback)
      '/api/v1/sales/history',
      '/api/v1/sales',
      '/v1/sales/history',
      '/v1/sales',
      '/sales/history',
      '/sales',
      // Endpoints com versão diferente (fallback)
      '/payments/api/v2/sales/history',
      '/sales/api/v2/history',
    ]
    
    const hostsToTry = [
      { base: apiBase, name: 'produção' },
      { base: apiBaseSandbox, name: 'sandbox' },
    ]

    let lastError: Error | null = null

    // Tentar cada combinação de host + endpoint
    for (const { base, name } of hostsToTry) {
      for (const endpointPath of possibleEndpoints) {
        const url = `${base}${endpointPath}?${queryParams.toString()}`
        
        console.log(`🔍 Tentando: ${name} - ${endpointPath}`)
        console.log(`📋 URL: ${url}`)
        console.log(`📋 Parâmetros: max_results=${maxResults}${pageToken ? `, page_token=${pageToken.substring(0, 20)}...` : ''}${startDate ? `, start_date=${startDate} (${dateToTimestamp(startDate)})` : ''}${endDate ? `, end_date=${endDate}` : ''}${transactionStatus ? `, transaction_status=${transactionStatus.join(',')}` : ''}`)

        try {
          // Headers conforme documentação da Hotmart
          // Algumas APIs exigem User-Agent e outros headers específicos
          const requestHeaders: HeadersInit = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'MVP-Nova-Era/1.0',
          }
          
          const response = await fetch(url, {
            method: 'GET',
            headers: requestHeaders,
            // Adicionar cache control para evitar problemas de cache
            cache: 'no-store',
          })

          console.log(`📊 Status: ${response.status} ${response.statusText}`)
          
          // Verificar Content-Type antes de tentar parsear JSON
          const contentType = response.headers.get('content-type') || ''
          const isJson = contentType.includes('application/json')
          
          if (response.status === 404) {
            console.warn(`⚠️ Endpoint não encontrado em ${name}: ${endpointPath}`)
            continue // Tentar próximo endpoint
          }

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`❌ Erro ${response.status} em ${name} - ${endpointPath}: ${errorText.substring(0, 200)}`)
            
            if (response.status === 401) {
              // Token inválido, limpar cache e tentar refresh uma vez
              console.warn('⚠️ Token inválido (401), forçando refresh...')
              clearTokenCache()
              const newToken = await getHotmartAccessToken()
              if (newToken && newToken !== token) {
                // Retry com novo token (implementado na função chamadora)
                return { items: [], needsRetry: true, newToken, hostUsed: base }
              }
              continue // Tentar próximo endpoint
            }

            if (response.status === 429) {
              // Rate limit - implementar backoff simples
              console.warn('⚠️ Rate limit atingido, aguardando 2 segundos...')
              await new Promise(resolve => setTimeout(resolve, 2000))
              continue // Tentar próximo endpoint
            }

            continue // Tentar próximo endpoint
          }

          // Ler resposta como texto primeiro para verificar se é HTML
          const responseText = await response.text()
          
          // Verificar se é HTML (mesmo com status 200, pode retornar HTML)
          const isHtmlResponse = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html') || responseText.trim().startsWith('<!')
          if (isHtmlResponse) {
            console.warn(`⚠️ Resposta HTML recebida em ${name} - ${endpointPath} (status ${response.status} mas retornou HTML)`)
            console.warn(`📋 Content-Type: ${contentType}`)
            
            // Extrair informações úteis do HTML
            const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i)
            const errorKeywords = ['error', 'erro', '403', '404', '401', 'forbidden', 'unauthorized', 'permission', 'permissão', 'access', 'acesso']
            const foundKeywords = errorKeywords.filter(kw => responseText.toLowerCase().includes(kw))
            
            if (titleMatch) {
              console.warn(`📋 Título da página: ${titleMatch[1]}`)
            }
            if (foundKeywords.length > 0) {
              console.warn(`📋 Palavras-chave encontradas: ${foundKeywords.join(', ')}`)
            }
            
            continue // Tentar próximo endpoint
          }
          
          // Tentar parsear como JSON
          let data: any
          try {
            data = JSON.parse(responseText)
          } catch (error) {
            console.warn(`⚠️ Erro ao parsear JSON em ${name} - ${endpointPath}:`, error)
            continue // Tentar próximo endpoint
          }
          
          console.log(`✅ Resposta JSON recebida de ${name} - ${endpointPath}. Estrutura:`, Object.keys(data))

          // Parser conforme documentação oficial: items e page_info
          let items: any[] = []
          let nextPageToken: string | undefined
          let prevPageToken: string | undefined

          // Estrutura esperada conforme docs: { items: [...], page_info: { next_page_token, prev_page_token } }
          if (data.items && Array.isArray(data.items)) {
            items = data.items
          } else if (Array.isArray(data)) {
            items = data
          } else if (data.data && Array.isArray(data.data)) {
            items = data.data
          } else {
            console.warn('⚠️ Estrutura de resposta inesperada:', Object.keys(data))
            console.log('📋 Body resumido:', JSON.stringify(data).substring(0, 500))
            continue // Tentar próximo endpoint
          }

          // Extrair tokens de paginação
          if (data.page_info) {
            nextPageToken = data.page_info.next_page_token
            prevPageToken = data.page_info.prev_page_token
          }

          console.log(`✅ ✅ SUCESSO! Retornadas ${items.length} vendas de ${name} - ${endpointPath} | Próxima página: ${nextPageToken ? 'Sim' : 'Não'}`)
          
          return {
            items,
            nextPageToken,
            prevPageToken,
            pageInfo: {
              nextPageToken,
              prevPageToken,
            },
            hostUsed: base,
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao chamar ${name} - ${endpointPath}:`, error instanceof Error ? error.message : String(error))
          continue // Tentar próximo endpoint
        }
      }
    }

    // Se chegou aqui, nenhum endpoint funcionou
    console.error('❌ Nenhum endpoint funcionou após tentar todas as combinações')
    console.error('')
    console.error('🔍 DIAGNÓSTICO:')
    console.error('   • Produção (api.hotmart.com): Retorna HTML "Página não encontrada" (404)')
    console.error('     → Isso indica que o endpoint pode estar incorreto ou a API não está disponível')
    console.error('   • Sandbox (sandbox.hotmart.com): Retorna 403 "unauthorized_client"')
    console.error('     → Isso indica falta de permissão na aplicação')
    console.error('')
    console.error('💡 SOLUÇÕES POSSÍVEIS:')
    console.error('')
    console.error('   1. VERIFICAR PERMISSÕES (MAIS PROVÁVEL):')
    console.error('      • Acesse: https://developers.hotmart.com/')
    console.error('      • Vá em "Credenciais" ou "Aplicações"')
    console.error('      • Verifique se sua aplicação tem permissão para "Sales API" ou "API de Vendas"')
    console.error('      • Se não tiver, solicite acesso à API de vendas no painel da Hotmart')
    console.error('      • Aguarde aprovação (pode levar alguns dias)')
    console.error('')
    console.error('   2. VERIFICAR ENDPOINT CORRETO:')
    console.error('      • Consulte a documentação oficial: https://developers.hotmart.com/docs/pt-BR/')
    console.error('      • Verifique se o endpoint mudou ou se há uma versão diferente da API')
    console.error('      • Teste manualmente com Postman/Insomnia usando o mesmo token')
    console.error('')
    console.error('   3. VERIFICAR RESTRIÇÕES:')
    console.error('      • Verifique se há restrições de IP configuradas no painel da Hotmart')
    console.error('      • Verifique se o ambiente de desenvolvimento está permitido')
    console.error('')
    console.error('📚 Documentação: https://developers.hotmart.com/docs/pt-BR/')
    return { items: [] }
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de vendas:', error)
    if (error instanceof Error) {
      console.error('Mensagem:', error.message)
    }
    return { items: [] }
  }
}

/**
 * Busca todas as vendas paginadas usando paginação por cursor
 * 
 * @param params - Parâmetros de busca
 * @param onPage - Callback chamado para cada página processada (recebe items e pageToken)
 * @returns Total de vendas processadas e host usado
 */
export async function fetchAllSalesHistory(
  params: SalesHistoryParams = {},
  onPage?: (items: any[], pageToken?: string) => Promise<void>
): Promise<{ totalProcessed: number; hostUsed: string | undefined }> {
  let totalProcessed = 0
  let currentPageToken: string | undefined = undefined
  let pageCount = 0
  let hostUsed: string | undefined

  console.log('🔄 Buscando todas as vendas (paginado por cursor)...')

  while (true) {
    let result = await listSalesHistory({
      ...params,
      pageToken: currentPageToken,
    })

    // Se precisa retry com novo token
    if (result.needsRetry && result.newToken) {
      console.log('🔄 Retentando com novo token...')
      result = await listSalesHistory({
        ...params,
        pageToken: currentPageToken,
      })
    }

    if (result.items.length === 0) {
      break
    }

    totalProcessed += result.items.length
    pageCount++
    hostUsed = result.hostUsed || hostUsed

    if (onPage) {
      await onPage(result.items, currentPageToken)
    }

    // Verificar se há próxima página
    if (result.nextPageToken) {
      currentPageToken = result.nextPageToken
      // Pequeno delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
    } else {
      // Não há mais páginas
      break
    }
  }

  console.log(`✅ Total de ${totalProcessed} vendas processadas em ${pageCount} página(s)`)
  return { totalProcessed, hostUsed }
}

