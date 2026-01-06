'use client'

import { mockUser } from '@/data/aluno/mockUser'
import { Bell, Coins, Flame, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { isFeatureEnabled } from '@/lib/features'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/NotificationsContext'
import { motion, AnimatePresence } from 'framer-motion'
import { getLevelBorderColor, calculateLevel } from '@/lib/gamification'

export default function AlunoHeader() {
  const { user: authUser } = useAuth()
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

  // Calcular nível baseado no XP atual (pode ser diferente do user.level se estiver desatualizado)
  const currentLevel = calculateLevel(user.xp || 0)

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
          {/* XP Total */}
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex-shrink-0",
            theme === 'dark'
              ? "bg-[#0f0f0f] border-white/10"
              : "bg-yellow-500/20 border-yellow-600/30"
          )}>
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
          </div>

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
    </header>
  )
}

