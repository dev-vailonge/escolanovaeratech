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
      console.error('[auth-callback] Erro ao definir sessão:', error)
      return NextResponse.redirect(new URL('/aluno/login?error=invalid_session', request.url))
    }

    // Verificar se os cookies foram criados
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || 
      c.name.startsWith('sb-') || 
      c.name.includes('auth-token')
    )
    
    console.log('[auth-callback] Cookies criados:', {
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cookieNames: supabaseCookies.map(c => c.name),
      hasSession: !!data?.session,
      userId: data?.user?.id
    })

    // Criar resposta de redirect
    const response = NextResponse.redirect(new URL(redirectTo, request.url))
    
    // IMPORTANTE: Os cookies são gerenciados automaticamente pelo createRouteHandlerClient
    // Mas precisamos garantir que eles sejam incluídos na resposta
    // O createRouteHandlerClient já deve ter feito isso, mas vamos verificar
    
    return response
  } catch (error: any) {
    console.error('Erro no auth-callback:', error)
    return NextResponse.redirect(new URL('/aluno/login?error=server_error', request.url))
  }
}

