import { createClient } from '@supabase/supabase-js'
import { serverConfig } from '@/lib/server-config'

export async function requireUserIdFromBearer(request: Request): Promise<string> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Não autenticado')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) throw new Error('Não autenticado')

  const supabase = createClient(serverConfig.supabase.url, serverConfig.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user?.id) {
    throw new Error('Não autenticado')
  }

  return data.user.id
}

/**
 * Extrai o accessToken do header Authorization
 * @returns O token de acesso ou undefined se não estiver presente
 */
export function getAccessTokenFromBearer(request: Request): string | undefined {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token || undefined
}






