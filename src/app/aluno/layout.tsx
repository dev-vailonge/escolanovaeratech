'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AlunoSidebar from '@/components/aluno/AlunoSidebar'
import AlunoHeader from '@/components/aluno/AlunoHeader'
import NotificationsModal from '@/components/aluno/NotificationsModal'
import { SidebarProvider, useSidebar } from '@/lib/SidebarContext'
import { ThemeProvider, useTheme } from '@/lib/ThemeContext'
import { NotificationsProvider } from '@/lib/NotificationsContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/aluno/signup',
  '/aluno/forgot-password',
  '/aluno/reset-password'
]

function AlunoLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { isExpanded } = useSidebar()
  const { theme } = useTheme()
  const { user, loading, initialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isPublicRoute = publicRoutes.includes(pathname)

  // Timeout de segurança: se estiver carregando por mais de 15 segundos, mostrar erro
  // IMPORTANTE: Hooks devem ser chamados ANTES de qualquer return condicional
  const [showTimeoutError, setShowTimeoutError] = useState(false)
  
  useEffect(() => {
    if (loading || !initialized) {
      const timeout = setTimeout(() => {
        setShowTimeoutError(true)
      }, 15000) // 15 segundos
      
      return () => clearTimeout(timeout)
    } else {
      setShowTimeoutError(false)
    }
  }, [loading, initialized])

  useEffect(() => {
    // Se não é rota pública e a autenticação foi inicializada e não está carregando
    if (!isPublicRoute && initialized && !loading) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:37',message:'Layout checking auth',data:{hasUser:!!user,loading,initialized,isPublicRoute,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (!user) {
        // Verificar ambiente e configuração do Supabase
        const isProduction = process.env.NODE_ENV === 'production'
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const hasValidSupabase = supabaseUrl && !supabaseUrl.includes('placeholder')
        
        // Em produção: SEMPRE exigir autenticação se Supabase estiver configurado
        // Em desenvolvimento: permitir acesso sem Supabase
        if (isProduction && hasValidSupabase) {
          // Produção com Supabase = sempre exigir autenticação
          const loginUrl = `/?redirect=${encodeURIComponent(pathname)}`
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/49008451-c824-441a-8f4c-4518059814cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:49',message:'Layout redirecting to login',data:{pathname,loginUrl,reason:'no-user-production'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          router.push(loginUrl)
        } else if (!isProduction && hasValidSupabase) {
          // Desenvolvimento com Supabase = verificar autenticação
          const loginUrl = `/?redirect=${encodeURIComponent(pathname)}`
          router.push(loginUrl)
        }
        // Se não tem Supabase válido em desenvolvimento, permite acesso (modo desenvolvimento)
      }
    }
  }, [user, loading, initialized, isPublicRoute, pathname, router])

  // Se é rota pública, mostrar conteúdo sem sidebar/header
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Se está carregando ou ainda não inicializou, mostrar loading
  if (loading || !initialized) {
    return (
      <div className={cn(
        "min-h-screen overflow-x-hidden relative transition-colors duration-300 flex flex-col items-center justify-center gap-4",
        theme === 'dark' ? "bg-black" : "bg-white"
      )}>
        <div className={cn(
          "animate-spin rounded-full h-12 w-12 border-b-2",
          theme === 'dark' ? "border-yellow-400" : "border-yellow-600"
        )}></div>
        {showTimeoutError && (
          <div className={cn(
            "text-center p-4 rounded-lg max-w-md",
            theme === 'dark' 
              ? "bg-red-500/10 border border-red-500/30 text-red-300"
              : "bg-red-50 border border-red-200 text-red-700"
          )}>
            <p className="font-semibold mb-2">Carregamento demorado</p>
            <p className="text-sm mb-4">A página está demorando mais que o esperado.</p>
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50"
                  : "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              Recarregar Página
            </button>
          </div>
        )}
      </div>
    )
  }
  
  // Se não está carregando e não tem usuário, mas não é rota pública
  // Verificar se precisa redirecionar (já está sendo feito no useEffect acima)
  // Por enquanto, permitir acesso se não tiver Supabase configurado (modo desenvolvimento)
  // Se não tem usuário mas não redirecionou ainda, mostrar layout (pode estar em modo mock)

  // Mostrar layout completo (com ou sem autenticação, dependendo da configuração)
  return (
    <NotificationsProvider>
      <div className={cn(
        "min-h-screen overflow-x-hidden relative transition-colors duration-300",
        theme === 'dark' ? "bg-black" : "bg-white"
      )}>
        {/* Background Gradient */}
        <div className={cn(
          "fixed inset-0 pointer-events-none transition-colors duration-300",
          theme === 'dark' 
            ? "bg-gradient-to-br from-black via-black to-yellow-600/20"
            : "bg-gradient-to-br from-white via-white to-yellow-50/30"
        )}></div>
        
        {/* Geometric Grid Pattern */}
        <div className={cn(
          "fixed inset-0 pointer-events-none transition-opacity duration-300",
          theme === 'dark' ? "opacity-10" : "opacity-[0.15]"
        )}>
          <div className="absolute inset-0" style={{
            backgroundImage: theme === 'dark'
              ? `
                linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px)
              `
              : `
                linear-gradient(rgba(234, 179, 8, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(234, 179, 8, 0.4) 1px, transparent 1px)
              `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <AlunoSidebar />
        {/* Mobile: sem margem, Desktop: margem para sidebar flutuante */}
        <div 
          className={cn(
            "lg:transition-all lg:duration-300 relative z-10",
            isExpanded ? "lg:ml-[280px]" : "lg:ml-[104px]"
          )}
        >
          {/* Mobile/Tablet: padding bottom para a bottom nav bar, Desktop: padding normal */}
          <main 
            className="p-4 lg:p-6 pb-20 md:pb-20 lg:pb-6 min-h-screen overflow-x-hidden max-w-full"
            style={{
              paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <AlunoHeader />
            {children}
          </main>
        </div>
        
        {/* Modal de Notificações */}
        <NotificationsModal />
      </div>
    </NotificationsProvider>
  )
}

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AlunoLayoutContent>{children}</AlunoLayoutContent>
      </SidebarProvider>
    </ThemeProvider>
  )
}

