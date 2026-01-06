'use client'

import { mockUser } from '@/data/aluno/mockUser'
import { Bell, Coins, Flame, Sun, Moon, BookOpen, HelpCircle, Target, MessageCircle, Trophy } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { isFeatureEnabled } from '@/lib/features'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/NotificationsContext'
import { motion, AnimatePresence } from 'framer-motion'
import { getLevelBorderColor, calculateLevel } from '@/lib/gamification'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import type { DatabaseUserXpHistory } from '@/types/database'

export default function AlunoHeader() {
  const { user: authUser } = useAuth()
  const router = useRouter()
  // Usar usuário autenticado se disponível, senão usar mockUser como fallback
  const user = authUser
    ? {
        ...mockUser,
        name: authUser.name,
        email: authUser.email,
        level: authUser.level ?? mockUser.level,
        xp: authUser.xp ?? mockUser.xp,
        coins: authUser.coins ?? mockUser.coins,
        streak: authUser.streak ?? mockUser.streak,
        avatarUrl: authUser.avatarUrl ?? null,
      }
    : { ...mockUser, avatarUrl: null as string | null }
  const { theme, toggleTheme } = useTheme()
  const { unreadCount, openModal, hasNewNotification } = useNotifications()
  const [xpModalOpen, setXpModalOpen] = useState(false)
  const [xpHistory, setXpHistory] = useState<DatabaseUserXpHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Calcular nível baseado no XP atual (pode ser diferente do user.level se estiver desatualizado)
  const currentLevel = calculateLevel(user.xp || 0)

  // Buscar histórico de XP quando abrir a modal
  useEffect(() => {
    const fetchXpHistory = async () => {
      if (!xpModalOpen || !authUser?.id) return

      setLoadingHistory(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          setLoadingHistory(false)
          return
        }

        const res = await fetch('/api/users/me/xp-history', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!res.ok) {
          throw new Error('Erro ao buscar histórico de XP')
        }

        const json = await res.json()
        if (json.success && json.history) {
          setXpHistory(json.history.slice(0, 10)) // Mostrar apenas os 10 mais recentes
        }
      } catch (error) {
        console.error('Erro ao buscar histórico de XP:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchXpHistory()
  }, [xpModalOpen, authUser?.id])

  return (
    <header className={cn(
      "backdrop-blur-xl rounded-xl p-4 mb-6 shadow-lg transition-colors duration-300 max-w-full overflow-visible",
      theme === 'dark' 
        ? "bg-gray-800/30 border border-white/10 shadow-black/30"
        : "bg-yellow-400/90 border border-yellow-500/30 shadow-yellow-400/20"
    )}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 max-w-full">
        {/* User Info - Mobile: primeira linha */}
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto min-w-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 flex-shrink-0",
                getLevelBorderColor(currentLevel, theme === 'dark')
              )}
            />
          ) : (
            <div
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 border-2",
                theme === 'dark'
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                  : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white",
                getLevelBorderColor(currentLevel, theme === 'dark')
              )}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold text-sm sm:text-base truncate",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              {user.name}
            </h3>
            <p className={cn(
              "text-xs sm:text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Nível {currentLevel}
            </p>
          </div>
          
          {/* Theme Toggle e Notifications - Mobile: junto com user info */}
          <div className="flex items-center gap-2 flex-shrink-0 lg:hidden">
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                theme === 'dark'
                  ? "bg-[#0f0f0f] border-white/10 hover:bg-white/5"
                  : "bg-yellow-500/20 border-yellow-600/30 hover:bg-yellow-500/30"
              )}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-yellow-400" />
              ) : (
                <Moon className="w-4 h-4 text-yellow-700" />
              )}
            </button>
            <button 
              onClick={openModal}
              className={cn(
                "p-2 rounded-lg border transition-colors relative",
                theme === 'dark'
                  ? "bg-[#0f0f0f] border-white/10 hover:bg-white/5"
                  : "bg-yellow-500/20 border-yellow-600/30 hover:bg-yellow-500/30"
              )}
            >
              <Bell className={cn(
                "w-4 h-4",
                theme === 'dark' ? "text-gray-400" : "text-gray-700"
              )} />
              {/* Badge de notificações não lidas */}
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      "absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full z-50 shadow-lg",
                      theme === 'dark'
                        ? "bg-yellow-400 text-black"
                        : "bg-red-500 text-white"
                    )}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Indicador de nova notificação */}
              <AnimatePresence>
                {hasNewNotification && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    exit={{ scale: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black z-50"
                  />
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Stats - Mobile: segunda linha com XP | Desktop: todos alinhados à direita */}
        <div className="flex items-center flex-nowrap gap-2 sm:gap-3 w-full lg:w-auto lg:gap-4">
          {/* XP Total - Clicável */}
          <button
            onClick={() => setXpModalOpen(true)}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex-shrink-0 transition-colors cursor-pointer",
              theme === 'dark'
                ? "bg-[#0f0f0f] border-white/10 hover:bg-white/5"
                : "bg-yellow-500/20 border-yellow-600/30 hover:bg-yellow-500/30"
            )}
          >
            <span className={cn(
              "text-xs sm:text-sm font-medium",
              theme === 'dark' ? "text-gray-400" : "text-gray-700"
            )}>
              XP:
            </span>
            <span className={cn(
              "font-semibold text-xs sm:text-sm",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              {user.xp.toLocaleString('pt-BR')}
            </span>
          </button>

          {/* Coins - Oculto no MVP */}
          {isFeatureEnabled('coins') && (
            <div className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex-shrink-0",
              theme === 'dark'
                ? "bg-[#0f0f0f] border-white/10"
                : "bg-yellow-500/20 border-yellow-600/30"
            )}>
              <Coins className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
              )} />
              <span className={cn(
                "font-semibold text-xs sm:text-sm",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {user.coins}
              </span>
            </div>
          )}

          {/* Streak - Oculto no MVP */}
          {isFeatureEnabled('streak') && (
            <div className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex-shrink-0",
              theme === 'dark'
                ? "bg-[#0f0f0f] border-white/10"
                : "bg-yellow-500/20 border-yellow-600/30"
            )}>
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              <span className={cn(
                "font-semibold text-xs sm:text-sm",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {user.streak}
              </span>
            </div>
          )}

          {/* Theme Toggle e Notifications - Desktop: visíveis aqui */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                theme === 'dark'
                  ? "bg-[#0f0f0f] border-white/10 hover:bg-white/5"
                  : "bg-yellow-500/20 border-yellow-600/30 hover:bg-yellow-500/30"
              )}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-yellow-700" />
              )}
            </button>
            <button 
              onClick={openModal}
              className={cn(
                "p-2 rounded-lg border transition-colors relative",
                theme === 'dark'
                  ? "bg-[#0f0f0f] border-white/10 hover:bg-white/5"
                  : "bg-yellow-500/20 border-yellow-600/30 hover:bg-yellow-500/30"
              )}
            >
              <Bell className={cn(
                "w-5 h-5",
                theme === 'dark' ? "text-gray-400" : "text-gray-700"
              )} />
              {/* Badge de notificações não lidas */}
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      "absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center text-xs font-bold rounded-full z-50 shadow-lg",
                      theme === 'dark'
                        ? "bg-yellow-400 text-black"
                        : "bg-red-500 text-white"
                    )}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Indicador de nova notificação */}
              <AnimatePresence>
                {hasNewNotification && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    exit={{ scale: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black z-50"
                  />
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Histórico de XP */}
      <Modal
        isOpen={xpModalOpen}
        onClose={() => setXpModalOpen(false)}
        title="Histórico de XP"
        size="md"
      >
        <div className="space-y-4">
          {loadingHistory ? (
            <div className={cn(
              "text-center py-8 text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Carregando histórico...
            </div>
          ) : xpHistory.length === 0 ? (
            <div className={cn(
              "text-center py-8 text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              Nenhum histórico de XP ainda
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {xpHistory.map((entry) => {
                // Ícone e cor baseado na origem
                let icon: React.ReactNode
                let iconColor: string
                let sourceLabel: string

                switch (entry.source) {
                  case 'aula':
                    icon = <BookOpen className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    sourceLabel = 'Aula'
                    break
                  case 'quiz':
                    icon = <HelpCircle className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    sourceLabel = 'Quiz'
                    break
                  case 'desafio':
                    icon = <Target className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    sourceLabel = 'Desafio'
                    break
                  case 'comunidade':
                    icon = <MessageCircle className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                    sourceLabel = 'Comunidade'
                    break
                  default:
                    icon = <Trophy className="w-4 h-4" />
                    iconColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    sourceLabel = entry.source
                }

                // Formatar data e hora
                const date = new Date(entry.created_at)
                const formattedDate = date.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
                const formattedTime = date.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border",
                      theme === 'dark'
                        ? "bg-black/20 border-white/10"
                        : "bg-yellow-50/50 border-yellow-400/50"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0",
                      iconColor
                    )}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={cn(
                          "text-xs font-medium",
                          theme === 'dark' ? "text-gray-300" : "text-gray-700"
                        )}>
                          {sourceLabel}
                        </span>
                        <span className={cn(
                          "text-sm font-bold",
                          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                        )}>
                          +{entry.amount} XP
                        </span>
                      </div>
                      {entry.description && (
                        <p className={cn(
                          "text-xs truncate",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          {entry.description}
                        </p>
                      )}
                      <p className={cn(
                        "text-xs mt-1",
                        theme === 'dark' ? "text-gray-500" : "text-gray-500"
                      )}>
                        {formattedDate} às {formattedTime}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setXpModalOpen(false)
                router.push('/aluno/perfil')
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                theme === 'dark'
                  ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/30"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              )}
            >
              Ver todas
            </button>
          </div>
        </div>
      </Modal>
    </header>
  )
}

