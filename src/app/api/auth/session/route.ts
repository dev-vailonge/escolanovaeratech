import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

/**
 * API para obter informações da sessão do usuário
 * Usado quando o getSession() no cliente está travando
 */
export async function GET(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const supabase = getSupabaseAdmin()

    // Buscar dados do usuário para confirmar que está autenticado
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, access_level')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        access_level: user.access_level,
      }
    })
  } catch (error: any) {
    console.error('Erro ao obter sessão:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao obter sessão' }, { status: 500 })
  }
}






