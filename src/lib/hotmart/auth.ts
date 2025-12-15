/**
 * Autenticação OAuth da Hotmart
 * 
 * Documentação: https://developers.hotmart.com/docs/pt-BR/api/1.0.0/reference/authentication
 */

interface TokenCache {
  access_token: string
  expires_at: number
}

// Cache de token em memória
let tokenCache: TokenCache | null = null

import { getOAuthBase } from './config'

/**
 * Obtém token de acesso OAuth da Hotmart com cache
 * 
 * @returns Token de acesso ou null se falhar
 */
export async function getHotmartAccessToken(): Promise<string | null> {
  // Verificar cache válido
  if (tokenCache && tokenCache.expires_at > Date.now()) {
    console.log('✅ Usando token em cache')
    return tokenCache.access_token
  }

  let CLIENT_ID = process.env.HOTMART_CLIENT_ID
  let CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ HOTMART_CLIENT_ID ou HOTMART_CLIENT_SECRET não configurados')
    return null
  }

  // Remover espaços e quebras de linha
  CLIENT_ID = CLIENT_ID.trim().replace(/\n/g, '').replace(/\r/g, '')
  CLIENT_SECRET = CLIENT_SECRET.trim().replace(/\n/g, '').replace(/\r/g, '')

  // Verificar se as credenciais não estão vazias ou são placeholders
  if (CLIENT_ID.includes('seu_') || CLIENT_SECRET.includes('seu_') || 
      CLIENT_ID === '' || CLIENT_SECRET === '') {
    console.error('❌ Credenciais não foram substituídas ou estão vazias. Verifique o .env.local')
    return null
  }

  try {
    // Verificar se há Basic token fornecido diretamente pela Hotmart
    let credentials: string
    const BASIC_TOKEN = process.env.HOTMART_BASIC_TOKEN?.trim()

    if (BASIC_TOKEN) {
      // Verificar se o Basic token já inclui o prefixo "Basic "
      if (BASIC_TOKEN.startsWith('Basic ')) {
        // Já inclui "Basic ", remover para usar apenas o token
        credentials = BASIC_TOKEN.substring(6) // Remove "Basic "
        console.log('🔐 Usando Basic token fornecido (já tinha prefixo "Basic ")')
      } else {
        // Usar Basic token fornecido diretamente (sem prefixo)
        credentials = BASIC_TOKEN
        console.log('🔐 Usando Basic token fornecido (sem prefixo "Basic ")')
      }
    } else {
      // Gerar Basic token automaticamente a partir de CLIENT_ID:CLIENT_SECRET (comportamento padrão)
      credentials = Buffer.from(`${CLIENT_ID.trim()}:${CLIENT_SECRET.trim()}`).toString('base64')
      console.log('🔐 Gerando Basic token automaticamente')
    }
    
    const oauthBase = getOAuthBase()
    const url = `${oauthBase}/security/oauth/token`
    console.log(`🔐 Autenticando na Hotmart: ${url}`)

    // Hotmart usa escopos "read write" (conforme erro retornado)
    // Não enviar scope explícito - a Hotmart define permissões no painel da aplicação
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
    })
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: params,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro ao obter token: ${response.status} ${response.statusText}`)
      console.error(`📋 URL: ${url}`)
      console.error(`📋 Body resumido: ${errorText.substring(0, 200)}`)
      
      if (response.status === 401) {
        console.error('⚠️ Erro 401: Credenciais inválidas')
        
        // Se estiver usando Basic token fornecido e falhar, tentar gerar automaticamente como fallback
        if (BASIC_TOKEN) {
          console.warn('⚠️ Basic token fornecido falhou. Tentando gerar automaticamente como fallback...')
          const fallbackCredentials = Buffer.from(`${CLIENT_ID.trim()}:${CLIENT_SECRET.trim()}`).toString('base64')
          
          const fallbackResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${fallbackCredentials}`,
            },
            body: params,
          })
          
          if (fallbackResponse.ok) {
            console.log('✅ Fallback funcionou! Basic token gerado automaticamente funcionou.')
            const fallbackData = await fallbackResponse.json()
            if (fallbackData.access_token) {
              const expiresIn = fallbackData.expires_in || 3600
              const expiresAt = Date.now() + (expiresIn * 1000) - 60000
              tokenCache = {
                access_token: fallbackData.access_token,
                expires_at: expiresAt,
              }
              console.log(`✅ Token obtido via fallback e cacheado (expira em ${Math.round(expiresIn / 60)} minutos)`)
              return fallbackData.access_token
            }
          } else {
            const fallbackErrorText = await fallbackResponse.text()
            console.error(`❌ Fallback também falhou: ${fallbackResponse.status} - ${fallbackErrorText.substring(0, 200)}`)
          }
        }
      }
      
      return null
    }

    const data = await response.json()
    
    // Log se scope foi aceito ou não
    if (data.scope) {
      console.log(`✅ Escopo retornado pelo OAuth: ${data.scope}`)
    } else {
      console.warn('⚠️ OAuth não retornou escopo. A Hotmart define permissões no painel da aplicação, não via OAuth scope.')
    }
    
    if (!data.access_token) {
      console.error('❌ Token não retornado na resposta:', data)
      return null
    }

    // Calcular expiração (usar expires_in ou padrão de 1 hora)
    const expiresIn = data.expires_in || 3600 // padrão 1 hora
    const expiresAt = Date.now() + (expiresIn * 1000) - 60000 // 1 minuto de margem

    // Armazenar no cache
    tokenCache = {
      access_token: data.access_token,
      expires_at: expiresAt,
    }

    console.log(`✅ Token obtido e cacheado (expira em ${Math.round(expiresIn / 60)} minutos)`)
    return data.access_token
  } catch (error) {
    console.error('❌ Erro ao obter token Hotmart:', error)
    if (error instanceof Error) {
      console.error('Mensagem:', error.message)
    }
    return null
  }
}

/**
 * Limpa o cache de token (útil para testes)
 */
export function clearTokenCache(): void {
  tokenCache = null
  console.log('🗑️ Cache de token limpo')
}

