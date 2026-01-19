'use client'

import { useState, lazy, Suspense, useCallback, memo, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { HelpCircle, Target, Bell, FileText, Users, Loader2, DollarSign, Settings } from 'lucide-react'
import SafeLoading from '@/components/ui/SafeLoading'

// Lazy loading dos componentes das abas para melhor performance
const AdminQuizTab = lazy(() => import('./components/AdminQuizTab'))
const AdminDesafiosTab = lazy(() => import('./components/AdminDesafiosTab'))
const AdminNotificacoesTab = lazy(() => import('./components/AdminNotificacoesTab'))
const AdminFormulariosTab = lazy(() => import('./components/AdminFormulariosTab'))
const AdminAlunosTab = lazy(() => import('./components/AdminAlunosTab'))
const AdminTokensTab = lazy(() => import('./components/AdminTokensTab'))
const AdminCorrigirXPTab = lazy(() => import('./components/AdminCorrigirXPTab'))

type AdminTab = 'quiz' | 'desafios' | 'notificacoes' | 'formularios' | 'alunos' | 'tokens' | 'corrigir-xp'

// Lista de abas válidas para validação
const validTabs: AdminTab[] = ['quiz', 'desafios', 'notificacoes', 'formularios', 'alunos', 'tokens', 'corrigir-xp']

// Componente de loading para Suspense
const TabLoading = memo(function TabLoading({ theme }: { theme: string }) {
  return (
    <SafeLoading
      loading={true}
      error={null}
      loadingMessage="Carregando..."
    />
  )
})

export default function AdminPage() {
  const { theme } = useTheme()
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // Obtém a aba da URL ou usa 'quiz' como padrão
  const tabFromUrl = searchParams.get('tab') as AdminTab | null
  const initialTab: AdminTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'quiz'
  
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab)
  // Rastrear quais abas já foram visitadas para manter os dados em cache
  const [visitedTabs, setVisitedTabs] = useState<Set<AdminTab>>(new Set([initialTab]))

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/aluno/login?redirect=' + encodeURIComponent('/aluno/admin'))
    }
  }, [user, loading, router])

  // Pré-carregar a aba inicial assim que o componente montar para evitar delay
  useEffect(() => {
    // Pré-carregar a aba inicial para evitar delay no primeiro acesso
    const tabToPreload = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'quiz'
    if (tabToPreload === 'quiz') {
      import('./components/AdminQuizTab')
    } else if (tabToPreload === 'desafios') {
      import('./components/AdminDesafiosTab')
    } else if (tabToPreload === 'notificacoes') {
      import('./components/AdminNotificacoesTab')
    } else if (tabToPreload === 'formularios') {
      import('./components/AdminFormulariosTab')
    } else if (tabToPreload === 'alunos') {
      import('./components/AdminAlunosTab')
    } else if (tabToPreload === 'tokens') {
      import('./components/AdminTokensTab')
    } else if (tabToPreload === 'corrigir-xp') {
      import('./components/AdminCorrigirXPTab')
    }
  }, [tabFromUrl]) // Executar quando a aba da URL mudar

  // Sincroniza o estado com a URL quando ela muda (ex: botão voltar do navegador)
  useEffect(() => {
    const tabParam = searchParams.get('tab') as AdminTab | null
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
      setVisitedTabs(prev => new Set(prev).add(tabParam))
    }
  }, [searchParams, activeTab])

  // Handler para mudar de aba e atualizar a URL
  const handleTabChange = useCallback((tabId: AdminTab) => {
    setActiveTab(tabId)
    setVisitedTabs(prev => new Set(prev).add(tabId))
    
    // Atualiza a URL sem recarregar a página
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Verificando permissões...
        </p>
      </div>
    )
  }

  // Verificar se é admin usando o usuário autenticado
  if (!user || user.role !== 'admin') {
    return (
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <h2 className={cn(
          "text-xl md:text-2xl font-bold mb-4",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Acesso Negado
        </h2>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Você não tem permissão para acessar esta área. Apenas administradores podem acessar o painel administrativo.
        </p>
      </div>
    )
  }

  const tabs: { id: AdminTab; label: string; icon: typeof HelpCircle }[] = [
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'desafios', label: 'Desafios', icon: Target },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'formularios', label: 'Formulários', icon: FileText },
    { id: 'alunos', label: 'Alunos', icon: Users },
    { id: 'tokens', label: 'Tokens', icon: DollarSign },
    { id: 'corrigir-xp', label: 'Manutenção de XP', icon: Settings },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Painel Administrativo
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Gerencie quizzes, desafios, notificações, formulários, alunos e tokens OpenAI
        </p>
      </div>

      {/* Tabs */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-1 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base flex-1 min-w-0",
                  isActive
                    ? theme === 'dark'
                      ? "bg-yellow-400 text-black"
                      : "bg-yellow-500 text-white"
                    : theme === 'dark'
                      ? "text-gray-400 hover:text-white hover:bg-white/5"
                      : "text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20"
                )}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo das Abas - Mantém abas visitadas em cache para evitar recarregamento */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <Suspense fallback={<TabLoading theme={theme} />}>
          {/* Renderiza abas visitadas com display:none para manter cache dos dados */}
          {/* Sempre renderiza a aba ativa ou visitada para garantir carregamento */}
          <div style={{ display: activeTab === 'quiz' ? 'block' : 'none' }}>
            {(activeTab === 'quiz' || visitedTabs.has('quiz')) && <AdminQuizTab />}
          </div>
          <div style={{ display: activeTab === 'desafios' ? 'block' : 'none' }}>
            {(activeTab === 'desafios' || visitedTabs.has('desafios')) && <AdminDesafiosTab />}
          </div>
          <div style={{ display: activeTab === 'notificacoes' ? 'block' : 'none' }}>
            {(activeTab === 'notificacoes' || visitedTabs.has('notificacoes')) && <AdminNotificacoesTab />}
          </div>
          <div style={{ display: activeTab === 'formularios' ? 'block' : 'none' }}>
            {(activeTab === 'formularios' || visitedTabs.has('formularios')) && <AdminFormulariosTab />}
          </div>
          <div style={{ display: activeTab === 'alunos' ? 'block' : 'none' }}>
            {(activeTab === 'alunos' || visitedTabs.has('alunos')) && <AdminAlunosTab />}
          </div>
          <div style={{ display: activeTab === 'tokens' ? 'block' : 'none' }}>
            {(activeTab === 'tokens' || visitedTabs.has('tokens')) && <AdminTokensTab />}
          </div>
          <div style={{ display: activeTab === 'corrigir-xp' ? 'block' : 'none' }}>
            {(activeTab === 'corrigir-xp' || visitedTabs.has('corrigir-xp')) && <AdminCorrigirXPTab />}
          </div>
        </Suspense>
      </div>
    </div>
  )
}


