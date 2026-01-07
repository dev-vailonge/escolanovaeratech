'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, Bell, Info, AlertTriangle, RefreshCw, Check, CheckCheck } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { useNotifications } from '@/lib/NotificationsContext'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { DatabaseNotificacao } from '@/types/database'

// Ícone baseado no tipo de notificação
function NotificationIcon({ tipo }: { tipo: DatabaseNotificacao['tipo'] }) {
  const { theme } = useTheme()
  
  switch (tipo) {
    case 'info':
      return (
        <div className={cn(
          "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-yellow-400/20 text-yellow-400" 
            : "bg-yellow-100 text-yellow-600"
        )}>
          <Info className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      )
    case 'update':
      return (
        <div className={cn(
          "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-emerald-500/20 text-emerald-400" 
            : "bg-emerald-100 text-emerald-600"
        )}>
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      )
    case 'warning':
      return (
        <div className={cn(
          "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-orange-500/20 text-orange-400" 
            : "bg-orange-100 text-orange-600"
        )}>
          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      )
    default:
      return (
        <div className={cn(
          "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-white/10 text-gray-400" 
            : "bg-gray-100 text-gray-600"
        )}>
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      )
  }
}

// Card de notificação individual
function NotificationCard({ 
  notification, 
  isRead, 
  onMarkAsRead,
  onClose
}: { 
  notification: DatabaseNotificacao
  isRead: boolean
  onMarkAsRead: () => void
  onClose?: () => void
}) {
  const { theme } = useTheme()
  const router = useRouter()
  
  const tipoLabel = {
    info: 'Informação',
    update: 'Atualização',
    warning: 'Aviso',
  }

  const handleClick = () => {
    if (notification.action_url) {
      onMarkAsRead()
      if (onClose) {
        onClose()
      }
      router.push(notification.action_url)
    }
  }

  const isClickable = !!notification.action_url

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={handleClick}
      className={cn(
        "p-3 md:p-4 rounded-lg md:rounded-xl border transition-all duration-200",
        isClickable && "cursor-pointer active:scale-[0.98]",
        isRead 
          ? theme === 'dark' 
            ? "bg-gray-800/20 border-white/5 opacity-50 backdrop-blur-xl" 
            : "bg-yellow-50/50 border-yellow-400/50 opacity-70"
          : theme === 'dark'
            ? "bg-gray-800/30 border-white/10 hover:border-yellow-400/50 active:border-yellow-400/40 backdrop-blur-xl"
            : "bg-yellow-50/50 border-yellow-400/50 hover:border-yellow-500 active:border-yellow-600"
      )}
    >
      <div className="flex gap-2.5 md:gap-3">
        <NotificationIcon tipo={notification.tipo} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={cn(
                "font-semibold text-sm md:text-base break-words",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {notification.titulo}
              </h3>
              <span className={cn(
                "inline-block px-1.5 md:px-2 py-0.5 text-xs rounded-full mt-1",
                notification.tipo === 'info' && (
                  theme === 'dark'
                    ? "bg-yellow-400/20 text-yellow-400"
                    : "bg-yellow-100 text-yellow-700"
                ),
                notification.tipo === 'update' && (
                  theme === 'dark'
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-emerald-100 text-emerald-700"
                ),
                notification.tipo === 'warning' && (
                  theme === 'dark'
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-orange-100 text-orange-700"
                )
              )}>
                {tipoLabel[notification.tipo]}
              </span>
            </div>
            
            {!isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead()
                }}
                className={cn(
                  "p-2 md:p-1.5 rounded-lg transition-colors flex-shrink-0 active:scale-95 touch-manipulation",
                  theme === 'dark'
                    ? "hover:bg-white/10 text-gray-400 hover:text-green-400 active:bg-white/20"
                    : "hover:bg-gray-100 text-gray-500 hover:text-green-600 active:bg-gray-200"
                )}
                title="Marcar como lida"
                aria-label="Marcar como lida"
              >
                <Check className="w-4 h-4 md:w-4 md:h-4" />
              </button>
            )}
          </div>
          
          <p className={cn(
            "text-sm md:text-sm mt-2 leading-relaxed break-words",
            theme === 'dark' ? "text-gray-300" : "text-gray-600"
          )}>
            {notification.mensagem}
          </p>
          
          <div className={cn(
            "flex items-center gap-2 mt-2 md:mt-3 text-xs",
            theme === 'dark' ? "text-gray-500" : "text-gray-400"
          )}>
            <span>
              {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function NotificationsModal() {
  const { theme } = useTheme()
  const { 
    notifications, 
    unreadCount, 
    isModalOpen, 
    closeModal, 
    markAsRead, 
    markAllAsRead,
    isRead
  } = useNotifications()
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isModalOpen, closeModal])

  // Prevenir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  if (!isModalOpen || !mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-2 md:p-4"
      onClick={closeModal}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 transition-opacity",
          theme === 'dark' ? "backdrop-blur-xl bg-black/70" : "backdrop-blur-md bg-black/50"
        )}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          "relative w-full max-w-lg rounded-2xl md:rounded-2xl rounded-t-3xl md:rounded-t-2xl overflow-hidden",
          "h-[90vh] md:h-auto md:max-h-[80vh]",
          theme === 'dark'
            ? "bg-gray-800/30 border border-white/10 backdrop-blur-xl shadow-2xl"
            : "bg-white border border-yellow-400/90 shadow-xl"
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 10000,
        }}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-3 md:p-4 lg:p-5 border-b sticky top-0 z-10",
          theme === 'dark' 
            ? "border-white/10 bg-gray-800/30 backdrop-blur-xl" 
            : "border-yellow-400/30 bg-white"
        )}>
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0",
              theme === 'dark'
                ? "bg-yellow-400/20 text-yellow-400"
                : "bg-yellow-100 text-yellow-600"
            )}>
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={cn(
                "text-base md:text-lg font-bold truncate",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Notificações
              </h2>
              <p className={cn(
                "text-xs md:text-xs",
                theme === 'dark' ? "text-gray-400" : "text-gray-500"
              )}>
                {unreadCount > 0 
                  ? `${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}`
                  : 'Todas lidas'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={cn(
                  "flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 md:py-1.5 rounded-lg text-xs font-medium transition-colors",
                  "active:scale-95",
                  theme === 'dark'
                    ? "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 active:bg-yellow-400/30"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 active:bg-yellow-300"
                )}
              >
                <CheckCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Marcar todas</span>
              </button>
            )}
            <button
              onClick={closeModal}
              className={cn(
                "p-2 md:p-2 rounded-lg transition-colors active:scale-95",
                theme === 'dark'
                  ? "hover:bg-white/10 text-gray-400 hover:text-white active:bg-white/20"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900 active:bg-gray-200"
              )}
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className="p-3 md:p-4 lg:p-5 space-y-2.5 md:space-y-3 overflow-y-auto flex-1"
          style={{ 
            maxHeight: 'calc(90vh - 70px)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "py-12 text-center",
                  theme === 'dark' ? "text-gray-500" : "text-gray-400"
                )}
              >
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma notificação no momento</p>
              </motion.div>
            ) : (
              notifications.map((notification) => (
                <NotificationCard
                  onClose={closeModal}
                  key={notification.id}
                  notification={notification}
                  isRead={isRead(notification.id)}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )

  return mounted ? createPortal(modalContent, document.body) : null
}

