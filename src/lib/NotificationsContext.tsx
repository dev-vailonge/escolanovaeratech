'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import type { DatabaseNotificacao } from '@/types/database'

interface NotificationsContextType {
  notifications: DatabaseNotificacao[]
  unreadCount: number
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  hasNewNotification: boolean
  clearNewNotificationFlag: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

// Chave para armazenar IDs lidas no localStorage
const STORAGE_KEY = 'ne_notifications_read'

// Verificar se Supabase está configurado
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<DatabaseNotificacao[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  // Carregar IDs lidas do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setReadIds(new Set(parsed))
        } catch (e) {
          console.error('Erro ao parsear notificações lidas:', e)
        }
      }
    }
  }, [])

  // Salvar IDs lidas no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined' && readIds.size > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds]))
    }
  }, [readIds])

  // Função para buscar notificações ativas
  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      const now = new Date().toISOString()
      
      let query = supabase
        .from('notificacoes')
        .select('*')
        .lte('data_inicio', now)
        .gte('data_fim', now)
        .order('created_at', { ascending: false })

      // Filtrar por público-alvo baseado no nível de acesso do usuário
      if (user?.accessLevel) {
        const publicoAlvo = user.accessLevel === 'full' ? 'alunos-full' : 'alunos-limited'
        query = query.or(`publico_alvo.eq.${publicoAlvo},publico_alvo.eq.todos`)
      } else {
        query = query.eq('publico_alvo', 'todos')
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar notificações:', error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    }
  }, [user?.accessLevel])

  // Buscar notificações na montagem e quando o usuário mudar
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Configurar Supabase Realtime para notificações
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return
    }

    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
        },
        (payload) => {
          console.log('Nova notificação recebida:', payload)
          const newNotification = payload.new as DatabaseNotificacao
          
          // Verificar se a notificação está ativa (dentro do período)
          const now = new Date()
          const dataInicio = new Date(newNotification.data_inicio)
          const dataFim = new Date(newNotification.data_fim)
          
          if (now >= dataInicio && now <= dataFim) {
            // Verificar público-alvo
            const isForUser = 
              newNotification.publico_alvo === 'todos' ||
              (user?.accessLevel === 'full' && newNotification.publico_alvo === 'alunos-full') ||
              (user?.accessLevel === 'limited' && newNotification.publico_alvo === 'alunos-limited')

            if (isForUser) {
              setNotifications(prev => [newNotification, ...prev])
              setHasNewNotification(true)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
        },
        (payload) => {
          console.log('Notificação atualizada:', payload)
          const updatedNotification = payload.new as DatabaseNotificacao
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notificacoes',
        },
        (payload) => {
          console.log('Notificação deletada:', payload)
          const deletedId = (payload.old as DatabaseNotificacao).id
          setNotifications(prev => prev.filter(n => n.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.accessLevel])

  // Calcular contagem de não lidas
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    setReadIds(prev => new Set([...prev, notificationId]))
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id)
    setReadIds(prev => new Set([...prev, ...allIds]))
    setHasNewNotification(false)
  }, [notifications])

  // Abrir modal
  const openModal = useCallback(() => {
    setIsModalOpen(true)
    setHasNewNotification(false)
  }, [])

  // Fechar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  // Limpar flag de nova notificação
  const clearNewNotificationFlag = useCallback(() => {
    setHasNewNotification(false)
  }, [])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isModalOpen,
        openModal,
        closeModal,
        markAsRead,
        markAllAsRead,
        hasNewNotification,
        clearNewNotificationFlag,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de NotificationsProvider')
  }
  return context
}


