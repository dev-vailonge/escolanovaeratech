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
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-yellow-400/20 text-yellow-400" 
            : "bg-yellow-100 text-yellow-600"
        )}>
          <Info className="w-5 h-5" />
        </div>
      )
    case 'update':
      return (
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-emerald-500/20 text-emerald-400" 
            : "bg-emerald-100 text-emerald-600"
        )}>
          <RefreshCw className="w-5 h-5" />
        </div>
      )
    case 'warning':
      return (
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-orange-500/20 text-orange-400" 
            : "bg-orange-100 text-orange-600"
        )}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      )
    default:
      return (
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          theme === 'dark' 
            ? "bg-white/10 text-gray-400" 
            : "bg-gray-100 text-gray-600"
        )}>
          <Bell className="w-5 h-5" />
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
        "p-4 rounded-xl border transition-all duration-200",
        isClickable && "cursor-pointer",
        isRead 
          ? theme === 'dark' 
            ? "bg-white/5 border-white/5 opacity-50" 
            : "bg-gray-50 border-gray-100 opacity-70"
          : theme === 'dark'
            ? "bg-[#111111] border-yellow-400/20 hover:border-yellow-400/50"
            : "bg-gradient-to-br from-yellow-50 to-white border-yellow-200 hover:border-yellow-300"
      )}
    >
      <div className="flex gap-3">
        <NotificationIcon tipo={notification.tipo} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={cn(
                "font-semibold text-base",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {notification.titulo}
              </h3>
              <span className={cn(
                "inline-block px-2 py-0.5 text-xs rounded-full mt-1",
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
                  "p-1.5 rounded-lg transition-colors flex-shrink-0",
                  theme === 'dark'
                    ? "hover:bg-white/10 text-gray-400 hover:text-green-400"
                    : "hover:bg-gray-100 text-gray-500 hover:text-green-600"
                )}
                title="Marcar como lida"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <p className={cn(
            "text-sm mt-2 leading-relaxed",
            theme === 'dark' ? "text-gray-300" : "text-gray-600"
          )}>
            {notification.mensagem}
          </p>
          
          <div className={cn(
            "flex items-center gap-2 mt-3 text-xs",
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
    markAllAsRead 
  } = useNotifications()
  
  const [mounted, setMounted] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // Carregar IDs lidas do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ne_notifications_read')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setReadIds(new Set(parsed))
        } catch (e) {
          console.error('Erro ao parsear notificações lidas:', e)
        }
      }
    }
    setMounted(true)
  }, [])

  // Atualizar readIds quando notificações forem marcadas como lidas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ne_notifications_read')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setReadIds(new Set(parsed))
        } catch (e) {
          // Ignora erro
        }
      }
    }
  }, [notifications])

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

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
    setReadIds(prev => new Set([...prev, notificationId]))
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    const allIds = notifications.map(n => n.id)
    setReadIds(new Set(allIds))
  }

  if (!isModalOpen || !mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
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
          "fixed inset-0 backdrop-blur-md transition-opacity",
          theme === 'dark' ? "bg-black/70" : "bg-black/50"
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
          "relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden",
          theme === 'dark'
            ? "bg-[#0a0a0a] border border-yellow-400/20"
            : "bg-white border border-yellow-200"
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 10000,
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 md:p-5 border-b sticky top-0 z-10",
          theme === 'dark' 
            ? "border-yellow-400/10 bg-[#0a0a0a]/95 backdrop-blur-sm" 
            : "border-yellow-200 bg-white/95 backdrop-blur-sm"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              theme === 'dark'
                ? "bg-yellow-400/20 text-yellow-400"
                : "bg-yellow-100 text-yellow-600"
            )}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className={cn(
                "text-lg font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Notificações
              </h2>
              <p className={cn(
                "text-xs",
                theme === 'dark' ? "text-gray-400" : "text-gray-500"
              )}>
                {unreadCount > 0 
                  ? `${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}`
                  : 'Todas lidas'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  theme === 'dark'
                    ? "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                )}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
            <button
              onClick={closeModal}
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? "hover:bg-white/10 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              )}
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className="p-4 md:p-5 space-y-3 overflow-y-auto"
          style={{ maxHeight: 'calc(80vh - 80px)' }}
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
                  isRead={readIds.has(notification.id)}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
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

