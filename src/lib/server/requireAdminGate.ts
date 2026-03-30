import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export type AdminGate =
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; response: NextResponse }

/**
 * Exige Bearer JWT válido e role admin em public.users.
 * Retorna cliente Supabase (service role quando configurado, como nas outras rotas /api/admin).
 */
export async function requireAdminGate(request: Request): Promise<AdminGate> {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const { data: user, error } = await supabase.from('users').select('role').eq('id', userId).single()

    if (error || user?.role !== 'admin') {
      return { ok: false, response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
    }

    return { ok: true, userId, supabase }
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
}
