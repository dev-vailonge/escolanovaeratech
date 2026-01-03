import { createClient } from '@supabase/supabase-js'
import { serverConfig } from '@/lib/server-config'

export async function requireUserIdFromBearer(request: Request): Promise<string> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ [requireUserIdFromBearer] Header Authorization não encontrado ou formato inválido')
    throw new Error('Não autenticado')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    console.error('❌ [requireUserIdFromBearer] Token vazio após extrair do header')
    throw new Error('Não autenticado')
  }

  console.log('🔍 [requireUserIdFromBearer] Validando token...', token.substring(0, 20) + '...')

  // Criar cliente com o token no header Authorization
  const supabase = createClient(serverConfig.supabase.url, serverConfig.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })

  // Usar getUser() que vai usar o header Authorization automaticamente
  const { data, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('❌ [requireUserIdFromBearer] Erro ao validar token:', error)
    console.error('❌ [requireUserIdFromBearer] Detalhes do erro:', {
      message: error.message,
      status: error.status,
      name: error.name
    })
    throw new Error('Não autenticado')
  }
  
  if (!data?.user?.id) {
    console.error('❌ [requireUserIdFromBearer] Token válido mas sem user.id:', data)
    throw new Error('Não autenticado')
  }

  console.log('✅ [requireUserIdFromBearer] Token válido para usuário:', data.user.id)
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






