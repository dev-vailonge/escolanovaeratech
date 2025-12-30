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

    // Verificar se os cookies foram criados no cookieStore
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || 
      c.name.startsWith('sb-') || 
      c.name.includes('auth-token')
    )
    
    console.log('[auth-callback] Cookies no cookieStore após setSession:', {
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cookieNames: supabaseCookies.map(c => c.name),
      allCookieNames: allCookies.map(c => c.name),
      hasSession: !!data?.session,
      userId: data?.user?.id
    })

    // Criar resposta de redirect
    const response = NextResponse.redirect(new URL(redirectTo, request.url))
    
    // IMPORTANTE: Se createRouteHandlerClient não criou cookies, criar manualmente
    if (supabaseCookies.length === 0 && data.session) {
      console.log('[auth-callback] Nenhum cookie criado, criando manualmente...')
      
      // Obter project ref do Supabase URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0] || 'default'
      const cookieName = `sb-${projectRef}-auth-token`
      
      // Criar cookie com dados da sessão
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: 'bearer',
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          aud: data.user.aud,
          role: data.user.role
        } : null
      }
      
      const expires = new Date((data.session.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000)
      
      response.cookies.set({
        name: cookieName,
        value: JSON.stringify(sessionData),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expires,
      })
      
      console.log('[auth-callback] Cookie criado manualmente:', {
        cookieName,
        expires: expires.toISOString(),
        redirectTo
      })
    } else {
      // Se cookies foram criados, copiar para a resposta
      allCookies.forEach(cookie => {
        response.cookies.set({
          name: cookie.name,
          value: cookie.value,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 dias
        })
      })
      
      console.log('[auth-callback] Cookies copiados para resposta:', {
        totalCookies: allCookies.length,
        cookieNames: allCookies.map(c => c.name)
      })
    }
    
    return response
  } catch (error: any) {
    console.error('Erro no auth-callback:', error)
    return NextResponse.redirect(new URL('/aluno/login?error=server_error', request.url))
  }
}

