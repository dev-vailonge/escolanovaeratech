'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
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
  LogOut,
  ClipboardList,
  Settings,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSidebar } from '@/lib/SidebarContext'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'

// Menu items principais (mostrados na bottom bar mobile)
const mainMenuItems = [
  { icon: Home, label: 'Início', href: '/aluno' },
  { icon: BookOpen, label: 'Aulas', href: '/aluno/aulas' },
  { icon: Trophy, label: 'Ranking', href: '/aluno/ranking' },
  { icon: User, label: 'Perfil', href: '/aluno/perfil' },
]

// Menu items secundários (apenas no sidebar desktop)
const secondaryMenuItems = [
  { icon: HelpCircle, label: 'Quiz', href: '/aluno/quiz' },
  { icon: Target, label: 'Desafios', href: '/aluno/desafios' },
  { icon: Users, label: 'Comunidade', href: '/aluno/comunidade' },
  { icon: ClipboardList, label: 'Formulários', href: '/aluno/formularios' },
]

// Menu items administrativos (apenas para admins)
const adminMenuItems = [
  { icon: Settings, label: 'Painel Admin', href: '/aluno/admin' },
]

export default function AlunoSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, setIsExpanded } = useSidebar()
  const { theme } = useTheme()
  const { signOut } = useAuth()

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/aluno/login')
  }

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
        </div>
        
        {/* Home Indicator Spacer (para iPhone) */}
        <div className="h-safe-area-inset-bottom bg-transparent" />
      </nav>

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
              "absolute -right-3 top-6 w-6 h-6 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors z-[60]",
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

        <nav className={cn("p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden pb-4 min-h-0", !isExpanded && "px-2")}>
          {/* Menu items principais */}
          {mainMenuItems.map((item) => {
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

          {/* Separador Admin */}
          {isExpanded && (
            <div className={cn(
              "my-4 border-t",
              theme === 'dark' ? "border-white/10" : "border-yellow-500/30"
            )} />
          )}

          {/* Menu items administrativos */}
          {adminMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

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
        </nav>

        {/* Botão de Sair */}
        <div className={cn(
          "p-4 flex-shrink-0 transition-colors duration-300",
          theme === 'dark' ? "border-t border-white/10" : "border-t border-yellow-500/30",
          !isExpanded && "px-2"
        )}>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 rounded-lg transition-all group relative w-full',
              isExpanded ? 'px-4 py-3' : 'px-3 py-3 justify-center',
              theme === 'dark'
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                : 'text-red-600 hover:text-red-700 hover:bg-red-500/10'
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
        </div>
      </aside>
    </>
  )
}

