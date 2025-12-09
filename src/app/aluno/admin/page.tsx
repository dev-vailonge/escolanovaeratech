'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { mockUser } from '@/data/aluno/mockUser'
import { HelpCircle, Target, Bell, FileText } from 'lucide-react'

// Componentes das abas (serão criados depois)
import AdminQuizTab from './components/AdminQuizTab'
import AdminDesafiosTab from './components/AdminDesafiosTab'
import AdminNotificacoesTab from './components/AdminNotificacoesTab'
import AdminFormulariosTab from './components/AdminFormulariosTab'

type AdminTab = 'quiz' | 'desafios' | 'notificacoes' | 'formularios'

export default function AdminPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<AdminTab>('quiz')

  // Verificar se é admin (em produção, isso virá do contexto de autenticação)
  if (mockUser.role !== 'admin') {
    return (
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
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
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    )
  }

  const tabs: { id: AdminTab; label: string; icon: typeof HelpCircle }[] = [
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'desafios', label: 'Desafios', icon: Target },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'formularios', label: 'Formulários', icon: FileText },
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
          Gerencie quizzes, desafios, notificações e formulários
        </p>
      </div>

      {/* Tabs */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-1 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Conteúdo das Abas */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        {activeTab === 'quiz' && <AdminQuizTab />}
        {activeTab === 'desafios' && <AdminDesafiosTab />}
        {activeTab === 'notificacoes' && <AdminNotificacoesTab />}
        {activeTab === 'formularios' && <AdminFormulariosTab />}
      </div>
    </div>
  )
}

