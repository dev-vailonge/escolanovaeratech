
import { getHotmartAccessToken, clearTokenCache } from './auth'
import { getClubApiBase, getClubApiBaseSandbox } from './config'

export interface ClubUsersParams {
  subdomain: string // Obrigatório - nome do subdomínio da Área de Membros
  email?: string // Opcional - buscar aluno específico por email
  pageToken?: string // Token de paginação
}

export interface ClubUser {
  user_id: string
  name: string
  email: string
  role:
    | 'STUDENT'
    | 'FREE_STUDENT'
    | 'OWNER'
    | 'ADMIN'
    | 'CONTENT_EDITOR'
    | 'MODERATOR'
  status: 'ACTIVE' | 'BLOCKED' | 'BLOCKED_BY_OWNER' | 'OVERDUE'
  type: 'BUYER' | 'IMPORTED' | 'FREE' | 'OWNER' | 'GUEST'
  purchase_date?: number // Timestamp
  first_access_date?: number // Timestamp
  last_access_date?: number // Timestamp
  locale?: string
  plus_access?: string
  progress?: {
    completed_percentage: number
    total: number
    completed: number
  }
  access_count?: number
  is_deletable?: boolean
  class_id?: string
  engagement?: string
}

export interface ClubUsersResponse {
  items: ClubUser[]
  page_info?: {
    total_results: number
    next_page_token?: string
    prev_page_token?: string
    results_per_page: number
  }
  hostUsed?: string
  needsRetry?: boolean
  newToken?: string
}

/**
 * Normaliza base URL removendo trailing slash.
 */
function normalizeBaseUrl(base: string): string {
  return (base || '').trim().replace(/\/+$/, '')
}

/**
 * Lista usuários/alunos da Área de Membros da Hotmart
 *
 * @param params - Parâmetros de busca (subdomain obrigatório)
 * @returns Lista de usuários ou array vazio se falhar
 */
export async function listClubUsers(
  params: ClubUsersParams
): Promise<ClubUsersResponse> {
  const token = await getHotmartAccessToken()

  if (!token) {
    console.error('❌ Não foi possível obter token de acesso')
    return { items: [] }
  }

  // Verificar se o token parece válido
  if (token.length < 50) {
    console.error('⚠️ Token parece inválido (muito curto)')
    return { items: [] }
  }

  // Validar subdomain obrigatório
  if (!params.subdomain || params.subdomain.trim() === '') {
    console.error('❌ Parâmetro subdomain é obrigatório')
    return { items: [] }
  }

  const { subdomain, email, pageToken } = params

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'users.ts:82',
      message: 'listClubUsers entry',
      data: {
        subdomain: subdomain,
        email: email || null,
        pageToken: pageToken || null,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10),
        tokenSuffix: token.substring(token.length - 10),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B',
    }),
  }).catch(() => {})
  // #endregion

  try {
    // Construir query params
    const queryParams = new URLSearchParams()
    queryParams.append('subdomain', subdomain.trim())

    if (email) {
      queryParams.append('email', email.trim())
    }

    if (pageToken) {
      queryParams.append('page_token', pageToken)
    }

    /**
     * ✅ Hosts corretos:
     * - Produção: api.hotmart.com
     * - Sandbox:  sandbox.hotmart.com
     *
     * `getClubApiBase()` / `getClubApiBaseSandbox()` continuam sendo usados,
     * mas vamos garantir fallback correto e remover `developers.hotmart.com`.
     */
    const clubApiBase = normalizeBaseUrl(getClubApiBase())
    const clubApiBaseSandbox = normalizeBaseUrl(getClubApiBaseSandbox())

    const PROD_DEFAULT = 'https://api.hotmart.com'
    const SANDBOX_DEFAULT = 'https://sandbox.hotmart.com'

    // Hosts para tentar (produção primeiro, depois sandbox)
    const hostsToTry = [
      { base: clubApiBase || PROD_DEFAULT, name: 'produção (configurado)' },
      { base: PROD_DEFAULT, name: 'produção (padrão)' },
      { base: clubApiBaseSandbox || SANDBOX_DEFAULT, name: 'sandbox (configurado)' },
      { base: SANDBOX_DEFAULT, name: 'sandbox (padrão)' },
    ]
      // Remove duplicados (ex.: quando configurado = padrão)
      .filter(
        (h, idx, arr) => arr.findIndex(x => x.base === h.base) === idx
      )

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'users.ts:107',
        message: 'Hosts configuration',
        data: {
          clubApiBase,
          clubApiBaseSandbox,
          hostsToTry: hostsToTry.map(h => ({ base: h.base, name: h.name })),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      }),
    }).catch(() => {})
    // #endregion

    const endpointPath = '/club/api/v1/users'
    let lastError: Error | null = null

    // Tentar cada host
    for (const { base, name } of hostsToTry) {
      const url = `${base}${endpointPath}?${queryParams.toString()}`

      console.log(`🔍 Tentando buscar alunos: ${name} - ${endpointPath}`)
      console.log(`📋 URL: ${url}`)
      console.log(
        `📋 Parâmetros: subdomain=${subdomain}${
          email ? `, email=${email}` : ''
        }${
          pageToken ? `, page_token=${pageToken.substring(0, 20)}...` : ''
        }`
      )

      try {
        const requestHeaders: HeadersInit = {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'MVP-Nova-Era/1.0',
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'users.ts:115',
            message: 'Request headers before fetch',
            data: {
              url,
              host: base,
              authorizationHeader: `Bearer ${token.substring(0, 20)}...`,
              hasAccept: !!(requestHeaders as any).Accept,
              hasContentType: !!(requestHeaders as any)['Content-Type'],
              hasUserAgent: !!(requestHeaders as any)['User-Agent'],
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C',
          }),
        }).catch(() => {})
        // #endregion

        const response = await fetch(url, {
          method: 'GET',
          headers: requestHeaders,
          cache: 'no-store',
        })

        console.log(`📊 Status: ${response.status} ${response.statusText}`)

        const contentType = response.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'users.ts:128',
            message: 'Response received',
            data: {
              status: response.status,
              statusText: response.statusText,
              contentType,
              isJson,
              host: base,
              url,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          }),
        }).catch(() => {})
        // #endregion

        if (response.status === 404) {
          console.warn(`⚠️ Endpoint não encontrado em ${name}: ${endpointPath}`)
          continue // Tentar próximo host
        }

        if (!response.ok) {
          const errorText = await response.text()
          console.error(
            `❌ Erro ${response.status} em ${name} - ${endpointPath}: ${errorText.substring(
              0,
              200
            )}`
          )

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'users.ts:139',
              message: 'Error response details',
              data: {
                status: response.status,
                host: base,
                errorText,
                errorTextLength: errorText.length,
                allResponseHeaders: Object.fromEntries(response.headers.entries()),
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'A',
            }),
          }).catch(() => {})
          // #endregion

          if (response.status === 401) {
            // Token inválido, limpar cache e tentar refresh uma vez
            console.warn('⚠️ Token inválido (401), forçando refresh...')
            clearTokenCache()
            const newToken = await getHotmartAccessToken()
            if (newToken && newToken !== token) {
              return { items: [], needsRetry: true, newToken, hostUsed: base }
            }
            continue // Tentar próximo host
          }

          if (response.status === 403) {
            console.error(`❌ Erro 403: Sem permissão para acessar este endpoint`)
            console.error(
              `💡 Verifique se a aplicação tem permissão para "Club API" no painel da Hotmart`
            )

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'users.ts:153',
                message: '403 Forbidden error analysis',
                data: {
                  host: base,
                  url,
                  subdomain,
                  errorText,
                  parsedError: (() => {
                    try {
                      return errorText ? JSON.parse(errorText) : null
                    } catch {
                      return null
                    }
                  })(),
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'A',
              }),
            }).catch(() => {})
            // #endregion

            continue
          }

          if (response.status === 422) {
            console.error(
              `❌ Erro 422: Parâmetro subdomain é obrigatório ou inválido`
            )
            continue
          }

          if (response.status === 429) {
            // Rate limit - implementar backoff simples
            console.warn('⚠️ Rate limit atingido, aguardando 2 segundos...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }

          continue // Tentar próximo host
        }

        // Ler resposta como texto primeiro para verificar se é HTML
        const responseText = await response.text()

        // Verificar se é HTML (mesmo com status 200, pode retornar HTML)
        const isHtmlResponse =
          responseText.trim().startsWith('<!DOCTYPE') ||
          responseText.trim().startsWith('<html') ||
          responseText.trim().startsWith('<!') ||
          contentType.includes('text/html')

        if (isHtmlResponse) {
          console.warn(
            `⚠️ Resposta HTML recebida em ${name} - ${endpointPath} (status ${response.status} mas retornou HTML)`
          )
          console.warn(`📋 Content-Type: ${contentType}`)

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'users.ts:178',
              message: 'HTML response received',
              data: {
                host: base,
                status: response.status,
                contentType,
                responseTextPreview: responseText.substring(0, 200),
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'D',
            }),
          }).catch(() => {})
          // #endregion

          continue // Tentar próximo host
        }

        // Tentar parsear como JSON
        let data: any
        try {
          data = JSON.parse(responseText)
        } catch (error) {
          console.warn(
            `⚠️ Erro ao parsear JSON em ${name} - ${endpointPath}:`,
            error
          )
          continue // Tentar próximo host
        }

        console.log(
          `✅ Resposta JSON recebida de ${name} - ${endpointPath}. Estrutura:`,
          Object.keys(data)
        )

        // Parser conforme documentação oficial: items e page_info
        let items: ClubUser[] = []
        let pageInfo: ClubUsersResponse['page_info']

        if (data.items && Array.isArray(data.items)) {
          items = data.items
        } else if (Array.isArray(data)) {
          items = data
        } else {
          console.warn('⚠️ Estrutura de resposta inesperada:', Object.keys(data))
          console.log('📋 Body resumido:', JSON.stringify(data).substring(0, 500))
          continue // Tentar próximo host
        }

        // Extrair informações de paginação
        if (data.page_info) {
          pageInfo = data.page_info
        }

        console.log(
          `✅ ✅ SUCESSO! Retornados ${items.length} alunos de ${name} - ${endpointPath} | Próxima página: ${
            pageInfo?.next_page_token ? 'Sim' : 'Não'
          }`
        )

        return {
          items,
          page_info: pageInfo,
          hostUsed: base,
        }
      } catch (error) {
        console.warn(
          `⚠️ Erro ao chamar ${name} - ${endpointPath}:`,
          error instanceof Error ? error.message : String(error)
        )
        lastError = error instanceof Error ? error : new Error(String(error))
        continue // Tentar próximo host
      }
    }

    // Se chegou aqui, nenhum host funcionou
    console.error('❌ Nenhum host funcionou após tentar todas as combinações')
    if (lastError) {
      console.error('❌ Último erro:', lastError.message)
    }
    return { items: [] }
  } catch (error) {
    console.error('❌ Erro ao buscar alunos da Área de Membros:', error)
    if (error instanceof Error) {
      console.error('Mensagem:', error.message)
    }
    return { items: [] }
  }
}

/**
 * Busca todos os alunos paginados usando paginação por cursor
 *
 * @param params - Parâmetros de busca (subdomain obrigatório)
 * @param onPage - Callback chamado para cada página processada
 * @returns Total de alunos processados e host usado
 */
export async function fetchAllClubUsers(
  params: ClubUsersParams,
  onPage?: (items: ClubUser[], pageToken?: string) => Promise<void>
): Promise<{ totalProcessed: number; hostUsed: string | undefined }> {
  let totalProcessed = 0
  let currentPageToken: string | undefined = undefined
  let pageCount = 0
  let hostUsed: string | undefined

  console.log('🔄 Buscando todos os alunos da Área de Membros (paginado por cursor)...')

  while (true) {
    let result = await listClubUsers({
      ...params,
      pageToken: currentPageToken,
    })

    // Se precisa retry com novo token
    if (result.needsRetry && result.newToken) {
      console.log('🔄 Retentando com novo token...')
      result = await listClubUsers({
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
    if (result.page_info?.next_page_token) {
      currentPageToken = result.page_info.next_page_token
      // Pequeno delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
    } else {
      // Não há mais páginas
      break
    }
  }

  console.log(`✅ Total de ${totalProcessed} alunos processados em ${pageCount} página(s)`)
  return { totalProcessed, hostUsed }
}
