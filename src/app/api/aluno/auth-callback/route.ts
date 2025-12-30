import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const redirectTo = searchParams.get('redirect') || '/aluno'

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL('/aluno/login?error=missing_tokens', request.url))
    }

    // Criar cliente Supabase que gerencia cookies automaticamente
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Definir a sessão para criar os cookies
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error || !data?.session) {
      return NextResponse.redirect(new URL('/aluno/login?error=invalid_session', request.url))
    }

    // Redirecionar para a rota desejada
    // Os cookies já foram criados pelo createRouteHandlerClient
    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (error: any) {
    console.error('Erro no auth-callback:', error)
    return NextResponse.redirect(new URL('/aluno/login?error=server_error', request.url))
  }
}

