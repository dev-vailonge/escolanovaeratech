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

  // Usar API REST do Supabase diretamente para validar o token
  // Isso é mais confiável do que usar o cliente JS que pode ter problemas com sessões
  const supabaseUrl = serverConfig.supabase.url
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': serverConfig.supabase.anonKey,
    },
  })

  if (!response.ok) {
    console.error('❌ [requireUserIdFromBearer] Erro ao validar token:', response.status, response.statusText)
    const errorText = await response.text().catch(() => '')
    console.error('❌ [requireUserIdFromBearer] Resposta do erro:', errorText.substring(0, 200))
    throw new Error('Não autenticado')
  }

  const userData = await response.json()
  
  if (!userData?.id) {
    console.error('❌ [requireUserIdFromBearer] Token válido mas sem user.id:', userData)
    throw new Error('Não autenticado')
  }

  console.log('✅ [requireUserIdFromBearer] Token válido para usuário:', userData.id)
  return userData.id
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






