import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Rota para processar confirmação de email do Supabase
 * O Supabase redireciona para esta rota após o usuário clicar no link de confirmação
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // O Supabase pode enviar os tokens de duas formas:
    // 1. Query params: ?access_token=...&refresh_token=...
    // 2. Hash fragment: #access_token=...&refresh_token=... (processado pelo cliente)
    
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type') // 'signup' ou 'email'
    
    // Se tiver tokens na query, processar diretamente
    if (accessToken && refreshToken) {
      return await handleTokenConfirmation(request, accessToken, refreshToken)
    }
    
    // Se não tiver tokens, pode ser que esteja no hash fragment
    // Nesse caso, redirecionar para uma página cliente que processa o hash
    return NextResponse.redirect(new URL('/aluno/auth/confirm', request.url))
  } catch (error: any) {
    console.error('[auth/confirm] Erro ao processar confirmação:', error)
    return NextResponse.redirect(new URL('/aluno/login?error=confirmation_failed', request.url))
  }
}

async function handleTokenConfirmation(
  request: NextRequest,
  accessToken: string,
  refreshToken: string
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Definir a sessão para criar os cookies
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error || !data?.session) {
      console.error('[auth/confirm] Erro ao definir sessão:', error)
      return NextResponse.redirect(new URL('/aluno/login?error=invalid_session', request.url))
    }

    console.log('[auth/confirm] Email confirmado com sucesso:', data.user?.email)

    // Redirecionar para a área do aluno
    return NextResponse.redirect(new URL('/aluno?confirmed=true', request.url))
  } catch (error: any) {
    console.error('[auth/confirm] Erro ao processar tokens:', error)
    return NextResponse.redirect(new URL('/aluno/login?error=confirmation_failed', request.url))
  }
}

