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

    // Criar resposta - os cookies são criados automaticamente pelo createRouteHandlerClient
    return NextResponse.json({
      success: true,
      user: data.user,
    })
  } catch (error: any) {
    console.error('Erro ao sincronizar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

