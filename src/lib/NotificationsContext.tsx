'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { isStudentRole } from './types/auth'
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
  isRead: (notificationId: string) => boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

// Chave base para armazenar IDs lidas no localStorage (será combinada com userId)
const STORAGE_KEY_BASE = 'ne_notifications_read'
const getStorageKey = (userId: string) => `${STORAGE_KEY_BASE}_${userId}`

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
  const [readIdsLoaded, setReadIdsLoaded] = useState(false) // Flag para garantir que IDs foram carregados
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  // Carregar IDs lidas do localStorage quando o usuário mudar
  // IMPORTANTE: Este deve ser o primeiro useEffect para garantir que os IDs sejam carregados antes de buscar notificações
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const storageKey = getStorageKey(user.id)
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as string[]
          const storedSet = new Set<string>(parsed)
          setReadIds(storedSet)
          setReadIdsLoaded(true)
        } catch {
          setReadIds(new Set())
          setReadIdsLoaded(true)
        }
      } else {
        // Limpar readIds se não houver dados para este usuário
        setReadIds(new Set())
        setReadIdsLoaded(true)
      }
    } else if (!user?.id) {
      // Limpar quando não há usuário
      setReadIds(new Set())
      setReadIdsLoaded(false)
    }
  }, [user?.id])

  // Salvar IDs lidas no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const storageKey = getStorageKey(user.id)
      if (readIds.size > 0) {
        localStorage.setItem(storageKey, JSON.stringify([...readIds]))
      } else {
        // Limpar localStorage se não houver notificações lidas
        localStorage.removeItem(storageKey)
      }
    }
  }, [readIds, user?.id])

  // Função para buscar notificações ativas
  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.id) {
      return
    }

    try {
      const now = new Date().toISOString()
      
      // Buscar notificações:
      // 1. Notificações individuais para este usuário (target_user_id = user.id)
      // 2. Notificações broadcast (target_user_id IS NULL) com público-alvo apropriado
      
      // Query para notificações individuais do usuário
      let individualQuery = supabase
        .from('notificacoes')
        .select('*')
        .eq('target_user_id', user.id)
        .lte('data_inicio', now)
        .gte('data_fim', now)
      
      if (isStudentRole(user?.role)) {
        // Alunos não devem ver notificações de sugestões/bugs
        // Usar neq para excluir is_sugestao_bug = true
        individualQuery = individualQuery.or('is_sugestao_bug.is.null,is_sugestao_bug.eq.false')
      }
      
      const { data: individualNotifs } = await individualQuery.order('created_at', { ascending: false })
      
      // Query para notificações broadcast (sem target_user_id)
      let broadcastQuery = supabase
        .from('notificacoes')
        .select('*')
        .is('target_user_id', null)
        .lte('data_inicio', now)
        .gte('data_fim', now)
      
      // Para alunos, excluir notificações de sugestões/bugs
      if (isStudentRole(user?.role)) {
        broadcastQuery = broadcastQuery.or('is_sugestao_bug.is.null,is_sugestao_bug.eq.false')
      }
      
      const { data: broadcastNotifs } = await broadcastQuery.order('created_at', { ascending: false })

      // Filtrar notificações broadcast por público-alvo
      // IMPORTANTE: Notificações individuais (target_user_id) já foram filtradas acima
      const filteredBroadcast = (broadcastNotifs || []).filter(notif => {
        // Notificações com publico_alvo 'todos' são para todos os usuários
        if (notif.publico_alvo === 'todos') return true
        
        // Admins recebem todas as notificações broadcast
        if (user?.role === 'admin') return true
        
        // Para alunos, filtrar por accessLevel
        if (isStudentRole(user?.role)) {
          if (notif.publico_alvo === 'alunos-full') return user?.accessLevel === 'full'
          if (notif.publico_alvo === 'alunos-limited') return user?.accessLevel === 'limited'
        }
        
        return false
      })

      // Combinar e ordenar por data de criação
      let allNotifications = [...(individualNotifs || []), ...filteredBroadcast]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Filtrar notificações de sugestões/bugs para alunos (apenas admins devem ver)
      if (isStudentRole(user?.role)) {
        allNotifications = allNotifications.filter(notif => !notif.is_sugestao_bug)
      }

      setNotifications(allNotifications)
    } catch {
      /* silencioso: evita vazar detalhes no console do cliente */
    }
  }, [user?.accessLevel, user?.id, user?.role])

  // Buscar notificações na montagem e quando o usuário mudar
  // IMPORTANTE: Este useEffect roda DEPOIS do que carrega os IDs lidos
  // Só buscar notificações depois que os IDs lidos foram carregados
  useEffect(() => {
    if (user?.id && readIdsLoaded) {
      fetchNotifications()
    }
  }, [fetchNotifications, user?.id, readIdsLoaded])

  // Configurar Supabase Realtime para notificações
  useEffect(() => {
    if (!isSupabaseConfigured() || !user?.id) {
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
          const newNotification = payload.new as DatabaseNotificacao
          
          if (!newNotification) return

          // Filtrar notificações de sugestões/bugs para alunos (apenas admins devem ver)
          if (isStudentRole(user?.role) && newNotification.is_sugestao_bug) {
            return
          }
          
          // Verificar se a notificação está ativa (dentro do período)
          const now = new Date()
          const dataInicio = new Date(newNotification.data_inicio)
          const dataFim = new Date(newNotification.data_fim)
          
          if (now >= dataInicio && now <= dataFim) {
            // Se é notificação individual, verificar se é para este usuário
            if (newNotification.target_user_id) {
              if (newNotification.target_user_id === user?.id) {
                setNotifications(prev => [newNotification, ...prev])
                setHasNewNotification(true)
              }
              // IMPORTANTE: Se tem target_user_id mas não é para este usuário, ignorar
              return
            }

            // Notificação broadcast (sem target_user_id) - verificar público-alvo
            // IMPORTANTE: Notificações individuais (target_user_id) já foram verificadas acima
            let isForUser = false
            
            if (newNotification.publico_alvo === 'todos') {
              // Notificações 'todos' são para todos os usuários
              isForUser = true
            } else if (user?.role === 'admin') {
              // Admins recebem todas as notificações broadcast
              isForUser = true
            } else if (isStudentRole(user?.role)) {
              // Para alunos, filtrar por accessLevel
              if (newNotification.publico_alvo === 'alunos-full' && user?.accessLevel === 'full') {
                isForUser = true
              } else if (newNotification.publico_alvo === 'alunos-limited' && user?.accessLevel === 'limited') {
                isForUser = true
              }
            }

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
          const deletedId = (payload.old as DatabaseNotificacao).id
          setNotifications(prev => prev.filter(n => n.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.accessLevel, user?.id, user?.role])

  // Calcular contagem de não lidas (usando useMemo para garantir recálculo)
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length
  }, [notifications, readIds])

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    setReadIds(prev => new Set([...prev, notificationId]))
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id)
    setReadIds(prev => {
      // Criar novo Set com todos os IDs para garantir atualização
      const newSet = new Set([...prev, ...allIds])
      
      // Salvar imediatamente no localStorage para garantir persistência
      if (typeof window !== 'undefined' && user?.id) {
        const storageKey = getStorageKey(user.id)
        localStorage.setItem(storageKey, JSON.stringify([...newSet]))
      }
      
      return newSet
    })
    setHasNewNotification(false)
  }, [notifications, user?.id])

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

  // Verificar se uma notificação está lida
  const isRead = useCallback((notificationId: string) => {
    return readIds.has(notificationId)
  }, [readIds])

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
        isRead,
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


