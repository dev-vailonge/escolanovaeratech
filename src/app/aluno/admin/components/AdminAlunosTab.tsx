'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { Loader2, RefreshCw, Mail, Calendar, Search, Database, Trophy, Zap, Coins, Shield, User, Lock, Unlock } from 'lucide-react'
import { getAllUsers, updateUserRole, updateUserAccessLevel } from '@/lib/database'
import type { DatabaseUser } from '@/types/database'
import Pagination from '@/components/ui/Pagination'

export default function AdminAlunosTab() {
  const { theme } = useTheme()
  
  // Usuários do banco local
  const [usersLocal, setUsersLocal] = useState<DatabaseUser[]>([])
  const [loadingLocal, setLoadingLocal] = useState(true)
  
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [updatingAccess, setUpdatingAccess] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    carregarUsersLocal()
  }, [])
  
  const carregarUsersLocal = async (retryCount = 0) => {
    const maxRetries = 2
    try {
      setLoadingLocal(true)
      const users = await getAllUsers()
      setUsersLocal(users)
    } catch (err: any) {
      console.error('Erro ao carregar usuários locais:', err)
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Tentando novamente (tentativa ${retryCount + 1}/${maxRetries})...`)
        setTimeout(() => carregarUsersLocal(retryCount + 1), 1000 * (retryCount + 1))
        return
      }
    } finally {
      setLoadingLocal(false)
    }
  }


  // Função para alterar a role do usuário
  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'aluno' : 'admin'
    const confirmMessage = currentRole === 'admin' 
      ? 'Tem certeza que deseja remover os privilégios de administrador deste usuário?'
      : 'Tem certeza que deseja tornar este usuário um administrador? Ele terá acesso completo automaticamente.'
    
    if (!confirm(confirmMessage)) return

    try {
      setUpdatingRole(userId)
      setError('')
      
      const success = await updateUserRole(userId, newRole)
      
      // Se virou admin, também atualizar para access_level full
      let accessSuccess = true
      if (success && newRole === 'admin') {
        accessSuccess = await updateUserAccessLevel(userId, 'full')
      }
      
      if (success && accessSuccess) {
        // Atualizar lista local
        setUsersLocal(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                role: newRole,
                // Se virou admin, também muda para full
                access_level: newRole === 'admin' ? 'full' : user.access_level
              } 
            : user
        ))
      } else {
        setError('Erro ao atualizar role do usuário. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Erro ao atualizar role:', err)
      setError('Erro ao atualizar role do usuário.')
    } finally {
      setUpdatingRole(null)
    }
  }

  // Função para alterar o access_level do usuário
  const handleChangeAccessLevel = async (userId: string, currentAccess: string) => {
    const newAccess = currentAccess === 'full' ? 'limited' : 'full'
    const confirmMessage = currentAccess === 'full' 
      ? 'Tem certeza que deseja limitar o acesso deste usuário? Ele não poderá mais participar de quiz, desafios e ranking.'
      : 'Tem certeza que deseja dar acesso completo a este usuário? Ele poderá participar de quiz, desafios e ranking.'
    
    if (!confirm(confirmMessage)) return

    try {
      setUpdatingAccess(userId)
      setError('')
      
      const success = await updateUserAccessLevel(userId, newAccess)
      
      if (success) {
        // Atualizar lista local
        setUsersLocal(prev => prev.map(user => 
          user.id === userId ? { ...user, access_level: newAccess } : user
        ))
      } else {
        setError('Erro ao atualizar acesso do usuário. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Erro ao atualizar acesso:', err)
      setError('Erro ao atualizar acesso do usuário.')
    } finally {
      setUpdatingAccess(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
      await carregarUsersLocal()
    setRefreshing(false)
  }

  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return data
    }
  }


  // Filtrar usuários locais por termo de busca
  const usersLocalFiltrados = useMemo(() => {
    return usersLocal.filter((user) => {
      const termo = searchTerm.toLowerCase()
      return (
        user.name.toLowerCase().includes(termo) ||
        user.email.toLowerCase().includes(termo)
      )
    })
  }, [usersLocal, searchTerm])

  // Resetar página ao mudar busca
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Paginação - calcular usuários paginados
  const usersPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return usersLocalFiltrados.slice(startIndex, endIndex)
  }, [usersLocalFiltrados, currentPage, itemsPerPage])

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return {
        label: 'Admin',
        className: theme === 'dark'
          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
          : 'bg-purple-100 text-purple-700 border-purple-300',
      }
    }
    return {
      label: 'Aluno',
      className: theme === 'dark'
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        : 'bg-blue-100 text-blue-700 border-blue-300',
    }
  }

  const getAccessBadge = (access: string) => {
    if (access === 'full') {
      return {
        label: 'Full',
        className: theme === 'dark'
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-green-100 text-green-700 border-green-300',
      }
    }
    return {
      label: 'Limited',
      className: theme === 'dark'
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        : 'bg-yellow-100 text-yellow-700 border-yellow-300',
    }
  }

  return (
    <div className="space-y-4">
      {/* Header com busca e refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Usuários do Sistema
          </h2>
          <p className={cn(
            "text-xs md:text-sm mt-1",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {usersLocalFiltrados.length} de {usersLocal.length} usuário{usersLocal.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Campo de busca */}
          <div className="relative flex items-center">
            <Search className={cn(
              "absolute left-3 w-4 h-4",
              theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )} />
            <input
              type="text"
              placeholder="Buscar por nome, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 pr-4 py-2 rounded-lg border text-sm w-48 md:w-64",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-white placeholder-gray-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              )}
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
              theme === 'dark'
                ? "bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
                : "bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className={cn(
          "p-4 rounded-lg border",
          theme === 'dark'
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-red-50 border-red-200 text-red-700"
        )}>
          <div className="font-semibold mb-1">Erro</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Lista de Usuários */}
          {loadingLocal ? (
            <div className={cn(
              "flex items-center justify-center p-8",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando usuários...</span>
            </div>
          ) : usersLocalFiltrados.length === 0 ? (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              {searchTerm
                ? 'Nenhum usuário encontrado com o termo de busca.'
                : 'Nenhum usuário cadastrado no sistema.'}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {usersPaginados.map((user) => {
                const roleBadge = getRoleBadge(user.role)
                const accessBadge = getAccessBadge(user.access_level)

                return (
                  <div
                    key={user.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      theme === 'dark'
                        ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                        : "bg-gray-50 border-gray-200 hover:border-yellow-400"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Informações do Usuário */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className={cn(
                            "font-semibold text-base",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            {user.name}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full border",
                            roleBadge.className
                          )}>
                            {roleBadge.label}
                          </span>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full border",
                            accessBadge.className
                          )}>
                            {accessBadge.label}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className={cn(
                              "w-4 h-4 flex-shrink-0",
                              theme === 'dark' ? "text-gray-400" : "text-gray-500"
                            )} />
                            <span className={cn(
                              "truncate",
                              theme === 'dark' ? "text-gray-400" : "text-gray-600"
                            )}>
                              {user.email}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className={cn(
                              "w-4 h-4 flex-shrink-0",
                              theme === 'dark' ? "text-gray-400" : "text-gray-500"
                            )} />
                            <span className={cn(
                              theme === 'dark' ? "text-gray-400" : "text-gray-600"
                            )}>
                              Cadastrado: {formatarData(user.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas de Gamificação */}
                      <div className="flex flex-col gap-2 md:items-end">
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-1">
                            <Trophy className={cn(
                              "w-4 h-4",
                              theme === 'dark' ? "text-purple-400" : "text-purple-600"
                            )} />
                            <span className={cn(
                              "font-semibold",
                              theme === 'dark' ? "text-white" : "text-gray-900"
                            )}>
                              Nível {user.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className={cn(
                              "w-4 h-4",
                              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                            )} />
                            <span className={cn(
                              "font-semibold",
                              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                            )}>
                              {user.xp.toLocaleString()} XP
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className={cn(
                              "w-4 h-4",
                              theme === 'dark' ? "text-amber-400" : "text-amber-600"
                            )} />
                            <span className={cn(
                              theme === 'dark' ? "text-amber-400" : "text-amber-600"
                            )}>
                              {user.coins}
                            </span>
                          </div>
                          {user.streak > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-lg">🔥</span>
                              <span className={cn(
                                theme === 'dark' ? "text-orange-400" : "text-orange-600"
                              )}>
                                {user.streak} dias
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {/* Botão para mudar role */}
                          <button
                            onClick={() => handleChangeRole(user.id, user.role)}
                            disabled={updatingRole === user.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                              user.role === 'admin'
                                ? theme === 'dark'
                                  ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                                  : "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
                                : theme === 'dark'
                                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300",
                              updatingRole === user.id && "opacity-50 cursor-not-allowed"
                            )}
                            title={user.role === 'admin' ? 'Tornar Aluno' : 'Tornar Admin'}
                          >
                            {updatingRole === user.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : user.role === 'admin' ? (
                              <User className="w-3 h-3" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            {updatingRole === user.id 
                              ? 'Atualizando...' 
                              : user.role === 'admin' 
                                ? 'Tornar Aluno' 
                                : 'Tornar Admin'
                            }
                          </button>

                          {/* Botão para mudar access_level (só para alunos) */}
                          {user.role === 'aluno' && (
                            <button
                              onClick={() => handleChangeAccessLevel(user.id, user.access_level)}
                              disabled={updatingAccess === user.id}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                user.access_level === 'full'
                                  ? theme === 'dark'
                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                                    : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                  : theme === 'dark'
                                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30"
                                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300",
                                updatingAccess === user.id && "opacity-50 cursor-not-allowed"
                              )}
                              title={user.access_level === 'full' ? 'Limitar Acesso' : 'Dar Acesso Full'}
                            >
                              {updatingAccess === user.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : user.access_level === 'full' ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                              {updatingAccess === user.id 
                                ? 'Atualizando...' 
                                : user.access_level === 'full' 
                                  ? 'Limitar Acesso' 
                                  : 'Dar Acesso Full'
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(usersLocalFiltrados.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={usersLocalFiltrados.length}
            />
          </>
      )}
    </div>
  )
}

