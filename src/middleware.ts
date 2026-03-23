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
      '/aluno/signup',
      '/aluno/forgot-password',
      '/aluno/reset-password',
      '/aluno/auth/confirm' // Rota de confirmação de email
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

        // Exceção específica: evitar chamadas ao Supabase Auth no middleware
        // durante o carregamento do Norte Tech Test (reduz risco de 429 no GoTrue).
        if (pathname === '/aluno/norte-tech-test') {
          const allCookies = request.cookies.getAll()
          const supabaseCookies = allCookies.filter((c) => {
            const name = c.name.toLowerCase()
            return (
              name.includes('supabase') ||
              name.startsWith('sb-') ||
              name.includes('auth-token')
            )
          })

          if (supabaseCookies.length > 0) {
            return NextResponse.next()
          }

          const loginUrl = new URL('/aluno/login', request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        }
        
        // Em produção com Supabase: verificar sessão usando createMiddlewareClient
        // Isso lê cookies automaticamente e valida a sessão
        try {
          // Verificar cookies antes de criar o cliente
          const allCookies = request.cookies.getAll()
          const supabaseCookies = allCookies.filter(c => {
            const name = c.name.toLowerCase()
            return name.includes('supabase') || name.startsWith('sb-') || name.includes('auth-token')
          })

          const response = NextResponse.next()
          const supabase = createMiddlewareClient({ req: request, res: response })
          const { data: { session }, error } = await supabase.auth.getSession()

          if (session?.user) {
            return response
          }

          if (supabaseCookies.length > 0) {
            return response
          }
          const loginUrl = new URL('/', request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        } catch {
          const allCookies = request.cookies.getAll()
          const supabaseCookies = allCookies.filter(c => {
            const name = c.name.toLowerCase()
            return name.includes('supabase') || name.startsWith('sb-') || name.includes('auth-token')
          })

          if (supabaseCookies.length > 0) {
            return NextResponse.next()
          }
          
          // Se não tem cookies, redirecionar para login
          const loginUrl = new URL('/', request.url)
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
            const loginUrl = new URL('/', request.url)
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