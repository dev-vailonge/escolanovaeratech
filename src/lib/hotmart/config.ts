/**
 * Configuração de hosts da Hotmart
 * 
 * Separação clara entre:
 * - OAuth (token): api-sec-vlc.hotmart.com
 * - API de dados: api.hotmart.com (produção) ou sandbox.hotmart.com (sandbox)
 */

/**
 * Host base para autenticação OAuth (apenas token)
 * NUNCA usar para endpoints de dados
 */
export function getOAuthBase(): string {
  return process.env.HOTMART_OAUTH_BASE || 'https://api-sec-vlc.hotmart.com'
}

/**
 * Host base para API de dados (produção)
 * Usar para buscar vendas, alunos, etc.
 */
export function getApiBase(): string {
  return process.env.HOTMART_API_BASE || 'https://api.hotmart.com'
}

/**
 * Host base para API de dados (sandbox)
 * Usar como fallback se produção retornar 404
 */
export function getApiBaseSandbox(): string {
  return process.env.HOTMART_API_BASE_SANDBOX || 'https://sandbox.hotmart.com'
}

/**
 * Obtém o subdomínio da Área de Membros da Hotmart
 * 
 * @returns Subdomínio configurado ou null se não estiver configurado
 */
export function getHotmartSubdomain(): string | null {
  const subdomain = process.env.HOTMART_SUBDOMAIN?.trim()
  return subdomain && subdomain !== '' ? subdomain : null
}

/**
 * Host base para Club API (Área de Membros)
 * Por padrão usa developers.hotmart.com conforme documentação
 * Pode ser sobrescrito via HOTMART_CLUB_API_BASE
 */
export function getClubApiBase(): string {
  return process.env.HOTMART_CLUB_API_BASE || 'https://developers.hotmart.com'
}

/**
 * Host base para Club API (Sandbox)
 * Por padrão usa sandbox.hotmart.com
 * Pode ser sobrescrito via HOTMART_CLUB_API_BASE_SANDBOX
 */
export function getClubApiBaseSandbox(): string {
  return process.env.HOTMART_CLUB_API_BASE_SANDBOX || 'https://sandbox.hotmart.com'
}

