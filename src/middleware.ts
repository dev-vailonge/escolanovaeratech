import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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
        
        // Em produção com Supabase: verificar se há cookies de sessão
        // O middleware apenas verifica a presença de cookies, a validação real é feita pelo AuthContext
        const allCookies = request.cookies.getAll()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:49',message:'Middleware checking cookies',data:{pathname,allCookiesCount:allCookies.length,cookieNames:allCookies.map(c=>c.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const hasSupabaseCookies = allCookies.some(cookie => {
          const name = cookie.name.toLowerCase()
          // Verificar padrões comuns de cookies do Supabase
          return (
            name.includes('supabase') ||
            name.startsWith('sb-') ||
            name.includes('auth-token') ||
            name.includes('access-token') ||
            name.includes('refresh-token')
          )
        })
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:62',message:'Middleware cookie check result',data:{hasSupabaseCookies,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Se não tem cookies do Supabase, redirecionar para login
        if (!hasSupabaseCookies) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:66',message:'Middleware redirecting to login',data:{pathname,reason:'no-supabase-cookies'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          const loginUrl = new URL('/aluno/login', request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        }
        
        // Se tem cookies, permitir acesso e deixar o AuthContext validar a sessão
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:72',message:'Middleware allowing access',data:{pathname,hasSupabaseCookies},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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