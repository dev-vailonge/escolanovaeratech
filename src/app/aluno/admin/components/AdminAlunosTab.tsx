'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { Loader2, RefreshCw, Mail, Phone, Calendar, ShoppingBag, DollarSign, Search, Download, Database, ExternalLink, Trophy, Zap, Coins, Shield, User, Lock, Unlock } from 'lucide-react'
import { getAllUsers, updateUserRole, updateUserAccessLevel } from '@/lib/database'
import type { DatabaseUser } from '@/types/database'

// Aluno vindo da Hotmart
interface AlunoHotmart {
  email: string
  nome: string
  telefone: string | null
  documento: string | null
  primeiraCompra: string
  ultimaCompra: string
  totalCompras: number
  status: string
  produtos: Array<{
    id: string
    nome: string
    valor: number
    moeda: string
    dataCompra: string
    status: string
    transactionId: string
  }>
}

type AlunoTab = 'local' | 'hotmart'

export default function AdminAlunosTab() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<AlunoTab>('local')
  
  // Usuários do banco local
  const [usersLocal, setUsersLocal] = useState<DatabaseUser[]>([])
  const [loadingLocal, setLoadingLocal] = useState(true)
  
  // Alunos da Hotmart
  const [alunosHotmart, setAlunosHotmart] = useState<AlunoHotmart[]>([])
  const [loadingHotmart, setLoadingHotmart] = useState(false)
  const [hotmartCarregado, setHotmartCarregado] = useState(false)
  
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [updatingAccess, setUpdatingAccess] = useState<string | null>(null)

  useEffect(() => {
    // Carregar apenas usuários locais automaticamente
    // Hotmart só carrega quando clicar em Atualizar
    carregarUsersLocal()
  }, [])
  
  const carregarUsersLocal = async () => {
    try {
      setLoadingLocal(true)
      const users = await getAllUsers()
      setUsersLocal(users)
    } catch (err: any) {
      console.error('Erro ao carregar usuários locais:', err)
    } finally {
      setLoadingLocal(false)
    }
  }

  const carregarAlunosHotmart = async () => {
    try {
      setLoadingHotmart(true)
      setError('')
      
      const response = await fetch('/api/hotmart/alunos?pageSize=100')
      const data = await response.json()

      if (!response.ok || !data.success) {
        // Não mostrar erro se a API da Hotmart não estiver disponível
        console.warn('API Hotmart:', data.message || 'Não disponível')
        setAlunosHotmart([])
        return
      }

      setAlunosHotmart(data.alunos || [])
    } catch (err: any) {
      console.error('Erro ao carregar alunos Hotmart:', err)
      // Não bloquear a UI se Hotmart não estiver disponível
      setAlunosHotmart([])
    } finally {
      setLoadingHotmart(false)
      setHotmartCarregado(true)
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
    if (activeTab === 'local') {
      await carregarUsersLocal()
    } else {
      await carregarAlunosHotmart()
    }
    setRefreshing(false)
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setError('')
      
      // Calcular data de 1 ano atrás até hoje
      const endDate = new Date()
      const startDate = new Date()
      startDate.setFullYear(endDate.getFullYear() - 1)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      const response = await fetch('/api/hotmart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDateStr,
          endDate: endDateStr,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao sincronizar dados')
      }
      
      // Após sincronizar, recarregar ambas listas
      await Promise.all([carregarUsersLocal(), carregarAlunosHotmart()])
      
      // Mostrar mensagem de sucesso
      alert(`Sincronização concluída! ${data.processed} aluno(s) processado(s).`)
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err)
      setError(err.message || 'Erro ao sincronizar dados históricos')
    } finally {
      setSyncing(false)
    }
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

  const formatarMoeda = (valor: number, moeda: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: moeda,
    }).format(valor)
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'approved' || statusLower === 'active') {
      return {
        label: 'Ativo',
        className: theme === 'dark'
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-green-100 text-green-700 border-green-300',
      }
    }
    if (statusLower === 'cancelled' || statusLower === 'canceled') {
      return {
        label: 'Cancelado',
        className: theme === 'dark'
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-red-100 text-red-700 border-red-300',
      }
    }
    if (statusLower === 'expired') {
      return {
        label: 'Expirado',
        className: theme === 'dark'
          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          : 'bg-yellow-100 text-yellow-700 border-yellow-300',
      }
    }
    return {
      label: status,
      className: theme === 'dark'
        ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        : 'bg-gray-100 text-gray-600 border-gray-300',
    }
  }

  // Filtrar usuários locais por termo de busca
  const usersLocalFiltrados = usersLocal.filter((user) => {
    const termo = searchTerm.toLowerCase()
    return (
      user.name.toLowerCase().includes(termo) ||
      user.email.toLowerCase().includes(termo)
    )
  })

  // Filtrar alunos Hotmart por termo de busca
  const alunosHotmartFiltrados = alunosHotmart.filter((aluno) => {
    const termo = searchTerm.toLowerCase()
    return (
      aluno.nome.toLowerCase().includes(termo) ||
      aluno.email.toLowerCase().includes(termo) ||
      (aluno.telefone && aluno.telefone.includes(termo)) ||
      (aluno.documento && aluno.documento.includes(termo))
    )
  })

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
      {/* Sub-tabs: Local vs Hotmart */}
      <div className={cn(
        "flex gap-2 p-1 rounded-lg",
        theme === 'dark'
          ? "bg-black/30"
          : "bg-gray-100"
      )}>
        <button
          onClick={() => setActiveTab('local')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm flex-1",
            activeTab === 'local'
              ? theme === 'dark'
                ? "bg-yellow-400 text-black"
                : "bg-yellow-500 text-white"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white hover:bg-white/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
          )}
        >
          <Database className="w-4 h-4" />
          <span>Usuários Locais</span>
          <span className={cn(
            "px-2 py-0.5 text-xs rounded-full",
            activeTab === 'local'
              ? theme === 'dark' ? "bg-black/20" : "bg-white/30"
              : theme === 'dark' ? "bg-white/10" : "bg-gray-200"
          )}>
            {usersLocal.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('hotmart')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm flex-1",
            activeTab === 'hotmart'
              ? theme === 'dark'
                ? "bg-yellow-400 text-black"
                : "bg-yellow-500 text-white"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white hover:bg-white/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
          )}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Hotmart</span>
          <span className={cn(
            "px-2 py-0.5 text-xs rounded-full",
            activeTab === 'hotmart'
              ? theme === 'dark' ? "bg-black/20" : "bg-white/30"
              : theme === 'dark' ? "bg-white/10" : "bg-gray-200"
          )}>
            {loadingHotmart ? '...' : alunosHotmart.length}
          </span>
        </button>
      </div>

      {/* Header com busca e refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {activeTab === 'local' ? 'Usuários do Sistema' : 'Alunos da Hotmart'}
          </h2>
          <p className={cn(
            "text-xs md:text-sm mt-1",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {activeTab === 'local' 
              ? `${usersLocalFiltrados.length} de ${usersLocal.length} usuário${usersLocal.length !== 1 ? 's' : ''}`
              : `${alunosHotmartFiltrados.length} de ${alunosHotmart.length} aluno${alunosHotmart.length !== 1 ? 's' : ''}`
            }
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
          {activeTab === 'hotmart' && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
                theme === 'dark'
                  ? "bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50"
                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              )}
              title="Sincronizar dados históricos da Hotmart (último ano)"
            >
              <Download className={cn("w-4 h-4", syncing && "animate-pulse")} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          )}
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

      {/* Lista de Usuários Locais */}
      {activeTab === 'local' && (
        <>
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
            <div className="space-y-3">
              {usersLocalFiltrados.map((user) => {
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
          )}
        </>
      )}

      {/* Lista de Alunos Hotmart */}
      {activeTab === 'hotmart' && (
        <>
          {!hotmartCarregado && !loadingHotmart ? (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              <ExternalLink className={cn(
                "w-12 h-12 mx-auto mb-4 opacity-50",
                theme === 'dark' ? "text-gray-500" : "text-gray-400"
              )} />
              <div className="mb-2 font-medium">Dados da Hotmart não carregados</div>
              <div className="text-xs opacity-75 mb-4">
                Clique em "Atualizar" para buscar os alunos da Hotmart.
              </div>
              <button
                onClick={carregarAlunosHotmart}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                  theme === 'dark'
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "bg-yellow-500 text-white hover:bg-yellow-600"
                )}
              >
                <RefreshCw className="w-4 h-4" />
                Carregar Alunos
              </button>
            </div>
          ) : loadingHotmart ? (
            <div className={cn(
              "flex items-center justify-center p-8",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando alunos da Hotmart...</span>
            </div>
          ) : alunosHotmartFiltrados.length === 0 ? (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              <div className="mb-2">
                {searchTerm
                  ? 'Nenhum aluno encontrado com o termo de busca.'
                  : 'Nenhum aluno encontrado na Hotmart.'}
              </div>
              <div className="text-xs opacity-75">
                {!searchTerm && 'A integração com a Hotmart ainda está aguardando liberação. Clique em "Sincronizar" para tentar novamente.'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alunosHotmartFiltrados.map((aluno, index) => {
                const statusBadge = getStatusBadge(aluno.status)
                const valorTotal = aluno.produtos.reduce((sum, p) => sum + p.valor, 0)
                const moedaPrincipal = aluno.produtos[0]?.moeda || 'BRL'

                return (
                  <div
                    key={`${aluno.email}-${index}`}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      theme === 'dark'
                        ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                        : "bg-gray-50 border-gray-200 hover:border-yellow-400"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Informações do Aluno */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className={cn(
                            "font-semibold text-base",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            {aluno.nome}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full border",
                            statusBadge.className
                          )}>
                            {statusBadge.label}
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
                              {aluno.email}
                            </span>
                          </div>

                          {aluno.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className={cn(
                                "w-4 h-4 flex-shrink-0",
                                theme === 'dark' ? "text-gray-400" : "text-gray-500"
                              )} />
                              <span className={cn(
                                theme === 'dark' ? "text-gray-400" : "text-gray-600"
                              )}>
                                {aluno.telefone}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Calendar className={cn(
                              "w-4 h-4 flex-shrink-0",
                              theme === 'dark' ? "text-gray-400" : "text-gray-500"
                            )} />
                            <span className={cn(
                              theme === 'dark' ? "text-gray-400" : "text-gray-600"
                            )}>
                              Última compra: {formatarData(aluno.ultimaCompra)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas */}
                      <div className="flex flex-col gap-2 md:items-end">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <ShoppingBag className={cn(
                              "w-4 h-4",
                              theme === 'dark' ? "text-gray-400" : "text-gray-500"
                            )} />
                            <span className={cn(
                              "font-semibold",
                              theme === 'dark' ? "text-white" : "text-gray-900"
                            )}>
                              {aluno.totalCompras} compra{aluno.totalCompras !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className={cn(
                              "w-4 h-4",
                              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                            )} />
                            <span className={cn(
                              "font-semibold",
                              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                            )}>
                              {formatarMoeda(valorTotal, moedaPrincipal)}
                            </span>
                          </div>
                        </div>

                        {/* Lista de Produtos */}
                        {aluno.produtos.length > 0 && (
                          <div className={cn(
                            "mt-2 p-2 rounded border text-xs w-full md:w-auto",
                            theme === 'dark'
                              ? "bg-black/20 border-white/5"
                              : "bg-white border-gray-200"
                          )}>
                            <div className="font-semibold mb-1">Produtos:</div>
                            {aluno.produtos.map((produto, pIndex) => (
                              <div key={pIndex} className="flex items-center justify-between gap-2">
                                <span className={cn(
                                  "truncate",
                                  theme === 'dark' ? "text-gray-300" : "text-gray-700"
                                )}>
                                  {produto.nome}
                                </span>
                                <span className={cn(
                                  "font-semibold flex-shrink-0",
                                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                                )}>
                                  {formatarMoeda(produto.valor, produto.moeda)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

