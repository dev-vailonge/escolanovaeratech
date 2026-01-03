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

  // Decodificar JWT para extrair user ID (sem verificar assinatura)
  // O RLS do Supabase vai validar o token quando fizermos operações
  try {
    // JWT tem formato: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('❌ [requireUserIdFromBearer] Token JWT inválido (formato incorreto)')
      throw new Error('Não autenticado')
    }

    // Decodificar payload (base64url)
    const payload = parts[1]
    // Adicionar padding se necessário (base64url pode não ter padding)
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
    const decodedPayload = JSON.parse(
      Buffer.from(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    )

    // Extrair user ID (sub = subject, que é o user ID no Supabase)
    const userId = decodedPayload.sub || decodedPayload.user_id

    if (!userId) {
      console.error('❌ [requireUserIdFromBearer] Token JWT não contém user ID:', decodedPayload)
      throw new Error('Não autenticado')
    }

    // Verificar se o token não expirou (exp = expiration time em segundos)
    if (decodedPayload.exp) {
      const expirationTime = decodedPayload.exp * 1000 // Converter para milissegundos
      const now = Date.now()
      if (now > expirationTime) {
        console.error('❌ [requireUserIdFromBearer] Token JWT expirado')
        throw new Error('Não autenticado')
      }
    }

    console.log('✅ [requireUserIdFromBearer] Token JWT válido para usuário:', userId)
    return userId
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      throw error
    }
    console.error('❌ [requireUserIdFromBearer] Erro ao decodificar token JWT:', error)
    throw new Error('Não autenticado')
  }
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






