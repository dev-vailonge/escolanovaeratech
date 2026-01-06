import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

/**
 * API para obter token de autenticação do servidor
 * Usado quando o getSession() no cliente está travando
 */
export async function GET(request: Request) {
  try {
    // Verificar se há token no header (para validar)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.slice('Bearer '.length).trim()
    
    // Validar o token
    const userId = await requireUserIdFromBearer(request)
    
    // Buscar dados do usuário para confirmar
    const supabase = getSupabaseAdmin()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role, access_level')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Retornar o token validado
    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        access_level: user.access_level,
      }
    })
  } catch (error: any) {
    console.error('Erro ao obter token:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao obter token' }, { status: 500 })
  }
}






