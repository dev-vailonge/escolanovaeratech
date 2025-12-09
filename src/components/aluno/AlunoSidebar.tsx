'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import {
  Home,
  Trophy,
  HelpCircle,
  Target,
  Users,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileText,
  Menu,
  LogOut,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/lib/SidebarContext'
import { useTheme } from '@/lib/ThemeContext'
import { mockUser } from '@/data/aluno/mockUser'
import { useAuth } from '@/lib/AuthContext'

// Menu items principais (mostrados na bottom bar mobile - apenas 3 itens + Menu)
const mainMenuItems = [
  { icon: Home, label: 'Início', href: '/aluno' },
  { icon: BookOpen, label: 'Plano de Estudos', href: '/aluno/aulas' },
  { icon: Trophy, label: 'Ranking', href: '/aluno/ranking' },
]

// Menu items principais para desktop (inclui Perfil)
const desktopMainMenuItems = [
  ...mainMenuItems,
  { icon: User, label: 'Perfil', href: '/aluno/perfil' },
]

// Menu items secundários (apenas no sidebar desktop)
const secondaryMenuItems = [
  { icon: HelpCircle, label: 'Quiz', href: '/aluno/quiz' },
  { icon: Target, label: 'Desafios', href: '/aluno/desafios' },
  { icon: Users, label: 'Comunidade', href: '/aluno/comunidade' },
  { icon: FileText, label: 'Formulários', href: '/aluno/formularios' },
]

// Menu item admin (visível apenas para admin)
const adminMenuItem = {
  icon: Settings,
  label: 'Painel Admin',
  href: '/aluno/admin',
}

export default function AlunoSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, setIsExpanded } = useSidebar()
  const { theme } = useTheme()
  const { signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/aluno/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      router.push('/aluno/login')
    }
  }

  // Itens do menu modal (páginas restantes + perfil)
  const menuModalItems = [
    { icon: User, label: 'Perfil', href: '/aluno/perfil' },
    ...secondaryMenuItems,
  ]

  // Fechar modal quando navegar
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Prevenir scroll automático ao navegar
  useEffect(() => {
    // Garantir que a página sempre comece no topo
    window.scrollTo(0, 0)
    
    // Prevenir scroll durante transições
    document.documentElement.style.scrollBehavior = 'auto'
    const timer = setTimeout(() => {
      document.documentElement.style.scrollBehavior = 'smooth'
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.documentElement.style.scrollBehavior = 'smooth'
    }
  }, [pathname])

  // Garantir que bottom nav nunca se mova
  useEffect(() => {
    const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement
    if (bottomNav) {
      bottomNav.style.position = 'fixed'
      bottomNav.style.bottom = '0'
      bottomNav.style.transform = 'translateZ(0)'
      bottomNav.style.webkitTransform = 'translateZ(0)'
    }
  }, [pathname])

  return (
    <>
      {/* Mobile/Tablet: Bottom Navigation Bar com Glassmorphism */}
      <nav 
        data-bottom-nav
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-xl transition-colors duration-300",
          theme === 'dark'
            ? "glass border-t border-white/10 bg-black/40"
            : "bg-yellow-400/95 border-t border-yellow-500/30"
        )}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom max-w-full">
          {mainMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-all relative flex-1 max-w-[120px] touch-manipulation select-none',
                  theme === 'dark'
                    ? (isActive ? 'text-yellow-400' : 'text-gray-400')
                    : (isActive ? 'text-yellow-800' : 'text-gray-700'),
                  'active:scale-95 active:opacity-70'
                )}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
                prefetch={true}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className={cn(
                    'w-5 h-5 sm:w-6 sm:h-6 transition-colors pointer-events-none',
                    theme === 'dark'
                      ? (isActive ? 'text-yellow-400' : 'text-gray-400')
                      : (isActive ? 'text-yellow-800' : 'text-gray-700')
                  )} />
                </motion.div>
                
                <span className={cn(
                  'text-[9px] sm:text-[10px] font-medium transition-colors text-center pointer-events-none',
                  theme === 'dark'
                    ? (isActive ? 'text-yellow-400' : 'text-gray-500')
                    : (isActive ? 'text-yellow-800' : 'text-gray-600')
                )}>
                  {item.label}
                </span>

                {/* Indicador ativo */}
                {isActive && (
                  <motion.div
                    className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full pointer-events-none",
                      theme === 'dark' ? "bg-yellow-400" : "bg-yellow-800"
                    )}
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
          
          {/* Botão Menu */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-xl transition-all relative flex-1 max-w-[120px] touch-manipulation select-none',
              theme === 'dark'
                ? (isMenuOpen ? 'text-yellow-400' : 'text-gray-400')
                : (isMenuOpen ? 'text-yellow-800' : 'text-gray-700'),
              'active:scale-95 active:opacity-70'
            )}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            <motion.div
              animate={{
                scale: isMenuOpen ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu className={cn(
                'w-5 h-5 sm:w-6 sm:h-6 transition-colors pointer-events-none',
                theme === 'dark'
                  ? (isMenuOpen ? 'text-yellow-400' : 'text-gray-400')
                  : (isMenuOpen ? 'text-yellow-800' : 'text-gray-700')
              )} />
            </motion.div>
            
            <span className={cn(
              'text-[9px] sm:text-[10px] font-medium transition-colors text-center pointer-events-none',
              theme === 'dark'
                ? (isMenuOpen ? 'text-yellow-400' : 'text-gray-500')
                : (isMenuOpen ? 'text-yellow-800' : 'text-gray-600')
            )}>
              Menu
            </span>
          </button>
        </div>
        
        {/* Home Indicator Spacer (para iPhone) */}
        <div className="h-safe-area-inset-bottom bg-transparent" />
      </nav>

      {/* Modal Menu Mobile - Desliza de baixo */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                "fixed inset-0 z-[9999] lg:hidden backdrop-blur-xl shadow-2xl flex flex-col",
                theme === 'dark'
                  ? "bg-black/90"
                  : "bg-yellow-400/95"
              )}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-4 pb-2 flex-shrink-0">
                <div className={cn(
                  "w-12 h-1 rounded-full",
                  theme === 'dark' ? "bg-white/20" : "bg-gray-700/30"
                )} />
              </div>

              {/* Header */}
              <div className={cn(
                "px-6 py-4 border-b flex-shrink-0",
                theme === 'dark' ? "border-white/10" : "border-yellow-500/30"
              )}>
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-xl font-bold",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    Menu
                  </h3>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      theme === 'dark'
                        ? "text-gray-400 hover:bg-white/10 hover:text-white"
                        : "text-gray-700 hover:bg-yellow-500/20 hover:text-gray-900"
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Container flex para menu items e logout */}
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Menu Items - Área scrollável */}
                <div className="px-4 py-4 overflow-y-auto flex-1 min-h-0">
                  <div className="space-y-2">
                    {menuModalItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-4 px-4 py-3 rounded-xl transition-all',
                            isActive
                              ? theme === 'dark'
                                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                                : 'bg-yellow-600/30 text-yellow-900 border border-yellow-700/40'
                              : theme === 'dark'
                                ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                                : 'text-gray-700 hover:bg-yellow-500/20 hover:text-gray-900'
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )
                    })}

                    {/* Item Admin - Visível apenas para admin */}
                    {mockUser.role === 'admin' && (
                      <Link
                        href={adminMenuItem.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3 rounded-xl transition-all',
                          pathname === adminMenuItem.href || pathname.startsWith(adminMenuItem.href + '/')
                            ? theme === 'dark'
                              ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                              : 'bg-yellow-600/30 text-yellow-900 border border-yellow-700/40'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                              : 'text-gray-700 hover:bg-yellow-500/20 hover:text-gray-900'
                        )}
                      >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{adminMenuItem.label}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Separador antes do logout */}
                <div className={cn(
                  "border-t my-2",
                  theme === 'dark' ? "border-white/10" : "border-yellow-500/30"
                )} />

                {/* Botão Sair - Fixo na parte inferior */}
                <div className={cn(
                  "px-4 py-3 flex-shrink-0",
                  theme === 'dark' ? "bg-black/50" : "bg-yellow-400/50"
                )}>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-left',
                      theme === 'dark'
                        ? 'text-red-400 hover:bg-red-400/10 hover:text-red-300 bg-red-400/5'
                        : 'text-red-600 hover:bg-red-500/20 hover:text-red-700 bg-red-500/10'
                    )}
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: Sidebar Flutuante */}
      <aside 
        className={cn(
          "hidden lg:flex fixed left-6 top-6 bottom-6 backdrop-blur-xl rounded-xl shadow-lg z-40 flex-col transition-all duration-300",
          theme === 'dark'
            ? "bg-black/40 border border-white/10 shadow-black/30"
            : "bg-yellow-400/90 border border-yellow-500/30 shadow-yellow-400/20",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        <div className={cn(
          "p-6 relative flex-shrink-0 transition-colors duration-300",
          theme === 'dark' ? "border-b border-white/10" : "border-b border-yellow-500/30",
          !isExpanded && "px-4"
        )}>
          {isExpanded ? (
            <>
              <h2 className={cn(
                "text-xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Nova Era Tech
              </h2>
              <p className={cn(
                "text-sm mt-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-700"
              )}>
                Área do Aluno
              </p>
            </>
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto",
              theme === 'dark'
                ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
            )}>
              NE
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute -right-3 top-6 w-6 h-6 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors z-10",
              theme === 'dark'
                ? "bg-[#111]/90 border border-white/10 text-white hover:bg-white/10"
                : "bg-yellow-500/80 border border-yellow-600/30 text-gray-900 hover:bg-yellow-500/90"
            )}
            aria-label={isExpanded ? "Recolher sidebar" : "Expandir sidebar"}
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className={cn("p-4 flex-1 flex flex-col min-h-0", !isExpanded && "px-2")}>
          {/* Área scrollável dos itens do menu */}
          <div className={cn("space-y-2 flex-1 overflow-y-auto pb-4", !isExpanded && "px-0")}>
            {/* Menu items principais */}
            {desktopMainMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all group relative',
                  isExpanded ? 'px-4 py-3' : 'px-3 py-3 justify-center',
                  isActive
                    ? theme === 'dark'
                      ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                      : 'bg-yellow-600/30 text-yellow-900 border border-yellow-700/40'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="font-medium">{item.label}</span>
                )}
                {!isExpanded && (
                  <div className={cn(
                    "absolute left-full ml-2 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",
                    theme === 'dark'
                      ? "bg-[#111]/90 border border-white/10 text-white"
                      : "bg-yellow-500/95 border border-yellow-600/30 text-gray-900"
                  )}>
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}

          {/* Separador */}
          {isExpanded && (
            <div className={cn(
              "my-4 border-t",
              theme === 'dark' ? "border-white/10" : "border-yellow-500/30"
            )} />
          )}

          {/* Menu items secundários */}
          {secondaryMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all group relative',
                  isExpanded ? 'px-4 py-3' : 'px-3 py-3 justify-center',
                  isActive
                    ? theme === 'dark'
                      ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                      : 'bg-yellow-600/30 text-yellow-900 border border-yellow-700/40'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="font-medium">{item.label}</span>
                )}
                {!isExpanded && (
                  <div className={cn(
                    "absolute left-full ml-2 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",
                    theme === 'dark'
                      ? "bg-[#111]/90 border border-white/10 text-white"
                      : "bg-yellow-500/95 border border-yellow-600/30 text-gray-900"
                  )}>
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}

          {/* Item Admin - Visível apenas para admin */}
          {mockUser.role === 'admin' && (
            <>
              {/* Separador */}
              {isExpanded && (
                <div className={cn(
                  "my-4 border-t",
                  theme === 'dark' ? "border-white/10" : "border-yellow-500/30"
                )} />
              )}
              
              {(() => {
                const Icon = adminMenuItem.icon
                const isActive = pathname === adminMenuItem.href || pathname.startsWith(adminMenuItem.href + '/')

                return (
                  <Link
                    href={adminMenuItem.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg transition-all group relative',
                      isExpanded ? 'px-4 py-3' : 'px-3 py-3 justify-center',
                      isActive
                        ? theme === 'dark'
                          ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                          : 'bg-yellow-600/30 text-yellow-900 border border-yellow-700/40'
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-white/5'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20'
                    )}
                    title={!isExpanded ? adminMenuItem.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="font-medium">{adminMenuItem.label}</span>
                    )}
                    {!isExpanded && (
                      <div className={cn(
                        "absolute left-full ml-2 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",
                        theme === 'dark'
                          ? "bg-[#111]/90 border border-white/10 text-white"
                          : "bg-yellow-500/95 border border-yellow-600/30 text-gray-900"
                      )}>
                        {adminMenuItem.label}
                      </div>
                    )}
                  </Link>
                )
              })()}
            </>
          )}
          </div>

          {/* Separador antes do logout */}
          <div className={cn(
            "pt-4 border-t",
            theme === 'dark' ? "border-white/10" : "border-yellow-500/30"
          )} />

          {/* Botão Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 rounded-lg transition-all group relative w-full',
              isExpanded ? 'px-4 py-3' : 'px-3 py-3 justify-center',
              theme === 'dark'
                ? 'text-red-400 hover:bg-red-400/10 hover:text-red-300'
                : 'text-red-600 hover:bg-red-500/20 hover:text-red-700'
            )}
            title={!isExpanded ? 'Sair' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="font-medium">Sair</span>
            )}
            {!isExpanded && (
              <div className={cn(
                "absolute left-full ml-2 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",
                theme === 'dark'
                  ? "bg-[#111]/90 border border-white/10 text-white"
                  : "bg-yellow-500/95 border border-yellow-600/30 text-gray-900"
              )}>
                Sair
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  )
}

