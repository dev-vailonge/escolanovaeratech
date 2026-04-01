/**
 * Cliente para API Hotmart Club (módulos e páginas/aulas).
 * Usar apenas no servidor (API routes).
 * Token: HOTMART_BEARER_TOKEN. Em 401 ou 403, faz POST de autenticação OAuth e repete o GET.
 */

const HOTMART_BASE = 'https://developers.hotmart.com/club/api'

let cachedToken: string | null = null

function getToken(): string {
  const token = cachedToken ?? process.env.HOTMART_BEARER_TOKEN
  if (!token) {
    throw new Error('HOTMART_BEARER_TOKEN não configurado')
  }
  return token
}

/**
 * POST de autenticação OAuth (client_credentials).
 * Requer: HOTMART_OAUTH_BASE, HOTMART_CLIENT_ID, HOTMART_CLIENT_SECRET, HOTMART_BASIC_TOKEN.
 */
async function refreshToken(): Promise<string> {
  const base = process.env.HOTMART_OAUTH_BASE
  const clientId = process.env.HOTMART_CLIENT_ID
  const clientSecret = process.env.HOTMART_CLIENT_SECRET
  const basicToken = process.env.HOTMART_BASIC_TOKEN
  if (!base || !clientId || !clientSecret || !basicToken) {
    throw new Error('HOTMART_OAUTH_BASE, HOTMART_CLIENT_ID, HOTMART_CLIENT_SECRET e HOTMART_BASIC_TOKEN são obrigatórios para autenticação')
  }
  const url = `${base.replace(/\/$/, '')}/security/oauth/token?grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('[Hotmart] refreshToken error:', res.status, text)
    throw new Error(`Hotmart OAuth: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { access_token?: string }
  const accessToken = data?.access_token
  if (!accessToken) {
    throw new Error('Resposta OAuth sem access_token')
  }
  cachedToken = accessToken
  return accessToken
}

/**
 * GET na API Hotmart com Bearer. Em 401 ou 403, faz POST de autenticação e repete o GET uma vez.
 */
async function fetchHotmartGet(url: string): Promise<Response> {
  let token = getToken()
  let res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (res.status === 401 || res.status === 403) {
    token = await refreshToken()
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }
  return res
}

/** Módulo Hotmart: apenas name e module_id. */
export interface HotmartModule {
  module_id: string | number
  name: string
}

/** Página/aula Hotmart: name para exibição e id (page_id) para link do vídeo. */
export interface HotmartPage {
  id: string | number
  name: string
}

/**
 * Lista módulos do curso na Hotmart (Club).
 * GET v1/modules?subdomain={subdomain}
 */
export async function getModules(subdomain: string): Promise<HotmartModule[]> {
  const url = `${HOTMART_BASE}/v1/modules?subdomain=${encodeURIComponent(subdomain)}`
  const res = await fetchHotmartGet(url)

  if (!res.ok) {
    const text = await res.text()
    console.error('[Hotmart] getModules error:', res.status, text)
    throw new Error(`Hotmart modules: ${res.status} ${text}`)
  }

  const data = await res.json()
  const raw = Array.isArray(data) ? data : data?.items ?? data?.modules ?? []
  return (Array.isArray(raw) ? raw : []).map((m: { module_id?: string | number; id?: string | number; name?: string }) => ({
    module_id: m.module_id ?? m.id ?? '',
    name: (m.name ?? '').trim() || 'Módulo',
  })) as HotmartModule[]
}

/**
 * Lista páginas (aulas) de um módulo.
 * GET v2/modules/{module_id}/pages?product_id={product_id}
 */
export async function getPages(
  moduleId: string | number,
  productId: string
): Promise<HotmartPage[]> {
  const url = `${HOTMART_BASE}/v2/modules/${encodeURIComponent(String(moduleId))}/pages?product_id=${encodeURIComponent(productId)}`
  const res = await fetchHotmartGet(url)

  if (!res.ok) {
    const text = await res.text()
    console.error('[Hotmart] getPages error:', res.status, text)
    throw new Error(`Hotmart pages: ${res.status} ${text}`)
  }

  const data = await res.json()
  const raw = Array.isArray(data) ? data : data?.items ?? data?.pages ?? []
  return (Array.isArray(raw) ? raw : []).map((p: { id?: string | number; page_id?: string | number; name?: string }) => ({
    id: p.id ?? p.page_id ?? '',
    name: (p.name ?? '').trim() || 'Aula',
  })) as HotmartPage[]
}

/**
 * Aula normalizada para uso no app (id + título).
 */
export interface AulaHotmart {
  id: string
  titulo: string
  moduloId?: string
  moduloNome?: string
  url?: string
}

export interface HotmartClubUser {
  email: string
  status: string
}

/**
 * Busca todos os módulos e todas as páginas (aulas) de um curso Hotmart.
 */
export async function getAulasDoCurso(subdomain: string, productId: string): Promise<AulaHotmart[]> {
  const modulos = await getModules(subdomain)
  const aulas: AulaHotmart[] = []

  for (let i = 0; i < modulos.length; i++) {
    const mod = modulos[i]
    const modId = String(mod.module_id)
    const modNome = mod.name
    const paginas = await getPages(modId, productId)

    for (let j = 0; j < paginas.length; j++) {
      const p = paginas[j]
      const titulo = p.name
      const pageId = p.id != null && p.id !== '' ? String(p.id) : `${modId}-${j}`
      aulas.push({
        id: pageId,
        titulo: titulo || 'Aula',
        moduloId: modId,
        moduloNome: modNome || undefined,
      })
    }
  }

  return aulas
}

/**
 * Lista usuários matriculados em uma formação (Hotmart Club).
 * GET v1/users?subdomain={subdomain}
 */
export async function getUsersBySubdomain(subdomain: string): Promise<HotmartClubUser[]> {
  const users: HotmartClubUser[] = []
  let pageToken: string | null = null

  while (true) {
    const url =
      `${HOTMART_BASE}/v1/users?subdomain=${encodeURIComponent(subdomain)}` +
      `&max_results=100` +
      (pageToken ? `&page_token=${encodeURIComponent(pageToken)}` : '')

    const res = await fetchHotmartGet(url)

    if (!res.ok) {
      const text = await res.text()
      console.error('[Hotmart] getUsersBySubdomain error:', res.status, text)
      throw new Error(`Hotmart users: ${res.status} ${text}`)
    }

    const data = (await res.json()) as {
      items?: Array<{ email?: string; status?: string }>
      page_info?: { next_page_token?: string | null }
    }

    const items = Array.isArray(data?.items) ? data.items : []
    users.push(
      ...items
        .map((u) => ({
          email: String(u.email ?? '').trim(),
          status: String(u.status ?? '').trim(),
        }))
        .filter((u) => u.email.length > 0)
    )

    const next = String(data?.page_info?.next_page_token ?? '').trim()
    if (!next) break
    pageToken = next
  }

  return users
}
