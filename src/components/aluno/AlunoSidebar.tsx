'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  LogOut,
  ClipboardList,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/lib/SidebarContext'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'

// Menu items principais (mostrados na bottom bar mobile)
const mainMenuItems = [
  { icon: Home, label: 'Início', href: '/aluno' },
  { icon: Trophy, label: 'Ranking', href: '/aluno/ranking' },
  { icon: Users, label: 'Comunidade', href: '/aluno/comunidade' },
  { icon: User, label: 'Perfil', href: '/aluno/perfil' },
]

// Item do Menu (abre modal com todas as outras páginas)
// NOTA: Painel Admin foi removido daqui - será adicionado dinamicamente se o usuário for admin
// NOTA: Perfil foi movido para a bottom bar, então foi removido daqui
// NOTA: Comunidade foi movida para a bottom bar, então foi removida daqui
// NOTA: Plano de Estudos aparece apenas no menu modal e no sidebar desktop
// NOTA: Formulários foi removido - acesso apenas via notificações
const baseMenuModalItems = [
  { icon: BookOpen, label: 'Plano de Estudos', href: '/aluno/aulas' },
  { icon: HelpCircle, label: 'Quiz', href: '/aluno/quiz' },
  { icon: Target, label: 'Desafios', href: '/aluno/desafios' },
]

// Menu items secundários (apenas no sidebar desktop)
// NOTA: Perfil e Comunidade foram removidos daqui pois já estão em mainMenuItems
// NOTA: Plano de Estudos aparece aqui também para o sidebar desktop
// NOTA: Formulários foi removido - acesso apenas via notificações
const secondaryMenuItems = [
  { icon: BookOpen, label: 'Plano de Estudos', href: '/aluno/aulas' },
  { icon: HelpCircle, label: 'Quiz', href: '/aluno/quiz' },
  { icon: Target, label: 'Desafios', href: '/aluno/desafios' },
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
  const { user, signOut } = useAuth()
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)

  // Verificar se o usuário é admin
  const isAdmin = user?.role === 'admin'

  // Menu items do modal - adicionar admin apenas se for admin
  const menuModalItems = isAdmin 
    ? [...baseMenuModalItems, ...adminMenuItems]
    : baseMenuModalItems

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/aluno/login')
  }

  const toggleMenuModal = () => {
    setIsMenuModalOpen(!isMenuModalOpen)
  }

  const closeMenuModal = () => {
    setIsMenuModalOpen(false)
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

  // Verifica se algum item do modal está ativo
  const isMenuItemActive = menuModalItems.some(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Encontra qual item do modal está ativo
  const activeMenuItem = menuModalItems.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // Ícone a ser exibido no botão central
  const CentralIcon = activeMenuItem ? activeMenuItem.icon : Menu

  return (
    <>
      {/* Menu Modal - aparece quando clica em "Menu" */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
              onClick={closeMenuModal}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "lg:hidden fixed bottom-0 left-0 right-0 z-[160] rounded-t-3xl backdrop-blur-xl",
                theme === 'dark'
                  ? "bg-black/95 border-t border-white/10"
                  : "bg-white border-t border-yellow-400/30"
              )}
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className={cn(
                  "w-10 h-1 rounded-full",
                  theme === 'dark' ? "bg-white/20" : "bg-gray-300"
                )} />
              </div>

              {/* Header do Modal */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className={cn(
                  "text-lg font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Menu
                </h3>
                <button
                  onClick={closeMenuModal}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    theme === 'dark'
                      ? "hover:bg-white/10 text-gray-400"
                      : "hover:bg-gray-100 text-gray-600"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items Grid */}
              <div className="px-4 pb-6 grid grid-cols-3 gap-3">
                {menuModalItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenuModal}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all",
                        isActive
                          ? theme === 'dark'
                            ? "bg-yellow-400/20 border border-yellow-400/30"
                            : "bg-yellow-100 border border-yellow-400"
                          : theme === 'dark'
                            ? "bg-white/5 border border-white/10 hover:bg-white/10"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      <Icon className={cn(
                        "w-6 h-6",
                        isActive
                          ? theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
                          : theme === 'dark' ? "text-gray-300" : "text-gray-600"
                      )} />
                      <span className={cn(
                        "text-xs font-medium text-center",
                        isActive
                          ? theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
                          : theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
                
                {/* Botão de Sair - dentro do grid */}
                <button
                  onClick={() => {
                    closeMenuModal()
                    handleLogout()
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all",
                    theme === 'dark'
                      ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      : "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                  )}
                >
                  <LogOut className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
        <div className="relative flex items-center justify-between px-4 sm:px-6 md:px-4 lg:px-6 py-2 safe-area-bottom max-w-full">
          {/* Primeiros dois itens: Início e Ranking */}
          {mainMenuItems.slice(0, 2).map((item) => {
            const Icon = item.icon
            // Início só é ativo na rota exata, outros itens podem ter rotas filhas
            const isActive = item.href === '/aluno' 
              ? pathname === '/aluno' || pathname === '/aluno/'
              : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all relative touch-manipulation select-none',
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

          {/* Botão Menu - círculo flutuante no centro */}
          <div className="relative flex-shrink-0 flex justify-center items-center mx-4 sm:mx-6 md:mx-2 lg:mx-4" style={{ minWidth: 'fit-content' }}>
            <button
              onClick={toggleMenuModal}
              className={cn(
                'w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all touch-manipulation select-none shadow-lg',
                theme === 'dark'
                  ? (isMenuModalOpen || isMenuItemActive 
                      ? 'bg-yellow-400 text-black border-2 border-yellow-400 shadow-yellow-400/50' 
                      : 'bg-black/80 text-yellow-400 border-2 border-yellow-400/80 shadow-black/50')
                  : (isMenuModalOpen || isMenuItemActive 
                      ? 'bg-yellow-500 text-black border-2 border-yellow-600 shadow-yellow-500/50' 
                      : 'bg-white text-yellow-600 border-2 border-yellow-500 shadow-gray-400/50'),
                'active:scale-95 active:opacity-70',
                'absolute -top-12 sm:-top-14 z-10'
              )}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              <motion.div
                animate={{
                  scale: isMenuModalOpen || isMenuItemActive ? 1.1 : 1,
                  rotate: isMenuModalOpen ? 90 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                whileTap={{ scale: 0.9 }}
              >
                <CentralIcon className={cn(
                  'w-6 h-6 sm:w-7 sm:h-7 transition-colors pointer-events-none',
                  theme === 'dark'
                    ? (isMenuModalOpen || isMenuItemActive ? 'text-black' : 'text-yellow-400')
                    : (isMenuModalOpen ? 'text-black' : isMenuItemActive ? 'text-yellow-800' : 'text-yellow-800')
                )} />
              </motion.div>
            </button>
          </div>

          {/* Últimos dois itens: Comunidade e Perfil */}
          {mainMenuItems.slice(2).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all relative touch-manipulation select-none',
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
            ? "bg-gray-800/30 border border-white/10 shadow-black/30"
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                <div className="relative w-full h-full flex items-center justify-center scale-150">
                  <Image
                    src="/logo light .svg"
                    alt="Nova Era Tech"
                    width={40}
                    height={40}
                    quality={100}
                    priority
                    unoptimized={true}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div>
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
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center overflow-hidden mx-auto">
              <div className="relative w-full h-full flex items-center justify-center scale-150">
                <Image
                  src="/logo light .svg"
                  alt="Nova Era Tech"
                  width={40}
                  height={40}
                  quality={100}
                  priority
                  unoptimized={true}
                  className="w-full h-full object-contain"
                />
              </div>
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
            // Início só é ativo na rota exata, outros itens podem ter rotas filhas
            const isActive = item.href === '/aluno' 
              ? pathname === '/aluno' || pathname === '/aluno/'
              : pathname === item.href || pathname.startsWith(item.href + '/')

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

          {/* Separador Admin - apenas se for admin */}
          {isExpanded && isAdmin && (
            <div className={cn(
              "my-4 border-t",
              theme === 'dark' ? "border-white/10" : "border-yellow-500/30"
            )} />
          )}

          {/* Menu items administrativos - apenas se for admin */}
          {isAdmin && adminMenuItems.map((item) => {
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

