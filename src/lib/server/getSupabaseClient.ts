import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from './supabaseAdmin'

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

    // Se tiver token do usuário, definir na sessão para que RLS funcione corretamente
    if (accessToken) {
      try {
        // Primeiro, obter o usuário do token para verificar se é válido
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
        
        if (userError || !user) {
          console.warn('[getSupabaseClient] Erro ao obter usuário do token:', userError)
        } else {
          // Definir sessão com o token para que RLS reconheça o usuário
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '', // Não temos refresh token aqui, mas o access token deve ser suficiente
          } as any)
          
          console.log('[getSupabaseClient] Sessão definida para usuário:', user.id)
        }
      } catch (sessionError) {
        console.warn('[getSupabaseClient] Erro ao definir sessão com token:', sessionError)
        // Continuar mesmo com erro - o header Authorization pode ser suficiente
      }
    }

    return supabase
  }
}

