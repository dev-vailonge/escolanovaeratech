import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from './supabaseAdmin'

/**
 * Cliente anon + JWT do usuário (RLS como no app). Preferir em rotas de aluno que só acessam linhas próprias,
 * para usar o mesmo projeto que NEXT_PUBLIC_SUPABASE_URL (evita mismatch com service role de outro env).
 */
export function createUserScopedSupabaseClient(accessToken: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

/**
 * Obtém cliente Supabase com fallback para anon key se service role key não estiver disponível
 * Útil para APIs que precisam funcionar mesmo sem SUPABASE_SERVICE_ROLE_KEY configurado
 */
export async function getSupabaseClient(accessToken?: string): Promise<SupabaseClient> {
  // Tentar usar admin primeiro (se disponível) - sempre preferir service role key
  try {
    return getSupabaseAdmin()
  } catch (adminError) {
    // Se não tiver service role key, usar anon key
    // IMPORTANTE: Isso pode falhar se RLS estiver habilitado nas tabelas
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !anonKey) {
      throw new Error('Supabase não configurado')
    }
    
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`
        } : {},
      },
    })

    // O header Authorization já é suficiente para o RLS funcionar
    // Não precisamos chamar setSession, pois isso pode invalidar a sessão do navegador

    return supabase
  }
}

