import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Tokens são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase que gerencia cookies automaticamente
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Definir a sessão manualmente para criar os cookies
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Criar resposta - IMPORTANTE: criar a resposta ANTES de usar o supabase
    // para garantir que os cookies sejam incluídos
    const response = NextResponse.json({
      success: true,
      user: data.user,
    })

    // O createRouteHandlerClient gerencia cookies automaticamente
    // Mas precisamos garantir que os cookies sejam retornados na resposta
    // Os cookies são gerenciados internamente pelo cliente Supabase
    
    return response
  } catch (error: any) {
    console.error('Erro ao sincronizar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

