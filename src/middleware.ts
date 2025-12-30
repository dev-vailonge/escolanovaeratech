import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { SecureSessionManager } from './lib/session'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always redirect signup to signin
  if (pathname === '/signup') {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // Proteger rotas da área do aluno (exceto páginas de autenticação)
  if (pathname.startsWith('/aluno')) {
    // Rotas públicas da área do aluno (não precisam de autenticação)
    const publicRoutes = [
      '/aluno/login',
      '/aluno/signup',
      '/aluno/forgot-password',
      '/aluno/reset-password'
    ]

    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

    // Se não é rota pública, verificar autenticação
    if (!isPublicRoute) {
      const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const isProduction = process.env.NODE_ENV === 'production'
      
      // Em produção: SEMPRE exigir Supabase configurado e autenticação
      if (isProduction) {
        if (!hasSupabaseConfig) {
          // Em produção sem Supabase = erro crítico de configuração
          console.error('❌ ERRO CRÍTICO: Supabase não configurado em produção!')
          return new NextResponse(
            JSON.stringify({ 
              error: 'Configuração de autenticação ausente. Contate o administrador.',
              code: 'AUTH_CONFIG_MISSING'
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        // Em produção com Supabase: verificar sessão usando createMiddlewareClient
        // Isso lê cookies automaticamente e valida a sessão
        try {
          const response = NextResponse.next()
          const supabase = createMiddlewareClient({ req: request, res: response })
          const { data: { session }, error } = await supabase.auth.getSession()
          
          // #region agent log
          // Note: logs no middleware não funcionam via fetch, mas podemos usar console
          console.log('[Middleware] Session check:', { hasSession: !!session, hasUser: !!session?.user, error: error?.message, pathname })
          // #endregion
          
          // Se não tem sessão válida, redirecionar para login
          if (error || !session?.user) {
            const loginUrl = new URL('/aluno/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
          }
          
          // Se tem sessão válida, permitir acesso
          return response
        } catch (authError) {
          // Se houver erro ao verificar sessão, redirecionar para login por segurança
          console.error('[Middleware] Erro ao verificar sessão:', authError)
          const loginUrl = new URL('/aluno/login', request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        }
      } else {
        // Em desenvolvimento: permitir acesso sem Supabase (para desenvolvimento local)
        if (hasSupabaseConfig) {
          // Se tem Supabase configurado, verificar autenticação
          // Mas em desenvolvimento, ser mais permissivo
          const session = SecureSessionManager.getSessionFromRequest(request)
          
          // Em desenvolvimento, também verificar cookies do Supabase diretamente
          const supabaseCookies = [
            request.cookies.get('sb-access-token'),
            request.cookies.get('sb-refresh-token'),
            ...Array.from(request.cookies.getAll()).filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
          ]
          
          // Se não tem sessão válida E não tem cookies do Supabase, redirecionar para login
          if (!session?.isValid && supabaseCookies.length === 0) {
            const loginUrl = new URL('/aluno/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
          }
          // Se tem cookies do Supabase, permitir acesso (o AuthContext vai validar)
        }
        // Se não tem Supabase em desenvolvimento, permite acesso (modo desenvolvimento)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/signup',
    '/aluno',
    '/aluno/:path*'
  ]
} 