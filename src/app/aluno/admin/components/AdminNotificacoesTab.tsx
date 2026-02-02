'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, Loader2, Bell, Inbox, Send, Bug, Lightbulb, X, Maximize2 } from 'lucide-react'
import CreateNotificacaoModal from './CreateNotificacaoModal'
import { getAllNotificacoes, createNotificacao, updateNotificacao, deleteNotificacao } from '@/lib/database'
import type { DatabaseNotificacao, NotificacaoWithUser } from '@/types/database'
import { supabase } from '@/lib/supabase'
import Pagination from '@/components/ui/Pagination'
import SafeLoading from '@/components/ui/SafeLoading'
import { safeFetch, safeSupabaseQuery } from '@/lib/utils/safeSupabaseQuery'

type TabType = 'enviadas' | 'recebidas'

export default function AdminNotificacoesTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Ler subtab da URL ou usar 'enviadas' como padrão
  const subtabFromUrl = searchParams.get('subtab') as TabType | null
  const initialTab: TabType = subtabFromUrl && (subtabFromUrl === 'enviadas' || subtabFromUrl === 'recebidas')
    ? subtabFromUrl
    : 'enviadas'

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [notificacoes, setNotificacoes] = useState<DatabaseNotificacao[]>([])
  const [sugestoesRecebidas, setSugestoesRecebidas] = useState<NotificacaoWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecebidas, setLoadingRecebidas] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNotificacao, setEditingNotificacao] = useState<DatabaseNotificacao | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPageEnviadas, setCurrentPageEnviadas] = useState(1)
  const [currentPageRecebidas, setCurrentPageRecebidas] = useState(1)
  const [imagemModalOpen, setImagemModalOpen] = useState(false)
  const [imagemModalUrl, setImagemModalUrl] = useState<string | null>(null)
  const itemsPerPage = 10

  // Sincronizar com a URL quando ela mudar (ex: quando clicar em notificação)
  useEffect(() => {
    const subtabParam = searchParams.get('subtab') as TabType | null
    if (subtabParam && (subtabParam === 'enviadas' || subtabParam === 'recebidas') && subtabParam !== activeTab) {
      setActiveTab(subtabParam)
    }
  }, [searchParams, activeTab])

  useEffect(() => {
    carregarNotificacoes()
  }, [])

  useEffect(() => {
    if (activeTab === 'recebidas') {
      carregarSugestoesRecebidas()
      setCurrentPageRecebidas(1) // Resetar página ao mudar aba
    } else {
      setCurrentPageEnviadas(1) // Resetar página ao mudar aba
    }
  }, [activeTab])

  // Handler para mudar de sub-aba e atualizar a URL
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId)

    // Atualiza a URL sem recarregar a página
    const params = new URLSearchParams(searchParams.toString())
    params.set('subtab', tabId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Paginação - calcular notificações paginadas
  const notificacoesPaginadas = useMemo(() => {
    const startIndex = (currentPageEnviadas - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return notificacoes.slice(startIndex, endIndex)
  }, [notificacoes, currentPageEnviadas, itemsPerPage])

  // Paginação - calcular sugestões recebidas paginadas
  const sugestoesPaginadas = useMemo(() => {
    const startIndex = (currentPageRecebidas - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sugestoesRecebidas.slice(startIndex, endIndex)
  }, [sugestoesRecebidas, currentPageRecebidas, itemsPerPage])

  const carregarNotificacoes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar Promise.race com timeout para getAllNotificacoes
      const timeoutPromise = new Promise<DatabaseNotificacao[]>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar notificações')), 10000)
      })

      const dataPromise = getAllNotificacoes()
      const dados = await Promise.race([dataPromise, timeoutPromise])

      // Filtrar apenas notificações enviadas pelo admin:
      // - created_by é null (notificações antigas, assumimos que são do admin)
      // - created_by é o admin atual
      // - E que NÃO são sugestões/bugs (is_sugestao_bug não é true)
      const notificacoesEnviadas = dados.filter(n => {
        // Excluir sugestões/bugs da aba enviadas
        if (n.is_sugestao_bug === true) return false
        return !n.created_by || n.created_by === user?.id
      })
      setNotificacoes(notificacoesEnviadas)
    } catch (err: any) {
      console.error('Erro ao carregar notificações:', err)
      setError(err.message || 'Erro ao carregar notificações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const carregarSugestoesRecebidas = async () => {
    try {
      setLoadingRecebidas(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      // Buscar notificações que são sugestões/bugs (criadas por alunos)
      // São notificações onde:
      // - is_sugestao_bug é true (marcadas como sugestão/bug)
      // - created_by não é null (foi criada por alguém)
      // - created_by não é o admin atual (foi criada por um aluno)
      const { data: todasNotificacoes, error: notifError } = await safeSupabaseQuery(
        async () => {
          const result = await supabase
            .from('notificacoes')
            .select('*')
            .eq('is_sugestao_bug', true)
            .not('created_by', 'is', null)
            .neq('created_by', user?.id || '')
            .order('created_at', { ascending: false })
          return result
        },
        { timeout: 10000, retryAttempts: 0 }
      )

      if (notifError || !todasNotificacoes) {
        throw new Error(notifError?.message || 'Erro ao buscar notificações')
      }

      // Buscar dados dos usuários que criaram as notificações
      const userIds = [...new Set((todasNotificacoes || []).map((n: any) => n.created_by).filter(Boolean) as string[])]

      let usersMap: Record<string, { id: string; name: string; email: string; avatar_url?: string | null; level?: number }> = {}

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await safeSupabaseQuery(
          async () => {
            const result = await supabase
              .from('users')
              .select('id, name, email, avatar_url, level')
              .in('id', userIds)
            return result
          },
          { timeout: 10000, retryAttempts: 0 }
        )

        if (!usersError && users) {
          usersMap = users.reduce((acc: any, user: any) => {
            acc[user.id] = {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar_url: user.avatar_url,
              level: user.level
            }
            return acc
          }, {} as Record<string, { id: string; name: string; email: string; avatar_url?: string | null; level?: number }>)
        }
      }

      // Mapear os dados para o formato NotificacaoWithUser
      const sugestoes: NotificacaoWithUser[] = (todasNotificacoes || []).map((notif: any) => ({
        ...notif,
        user: notif.created_by ? usersMap[notif.created_by] : undefined
      }))

      setSugestoesRecebidas(sugestoes)
    } catch (err: any) {
      console.error('Erro ao carregar sugestões recebidas:', err)
      setError(err.message || 'Erro ao carregar sugestões recebidas. Tente novamente.')
    } finally {
      setLoadingRecebidas(false)
    }
  }

  const handleSave = async (notificacaoData: any) => {
    try {
      setError('')

      // Preparar dados no formato do banco
      // Converter datas para ISO string se necessário
      const dataInicioISO = notificacaoData.dataInicio
        ? new Date(notificacaoData.dataInicio).toISOString()
        : new Date().toISOString()
      const dataFimISO = notificacaoData.dataFim
        ? new Date(notificacaoData.dataFim + 'T23:59:59').toISOString()
        : new Date().toISOString()

      const dadosNotificacao: Omit<DatabaseNotificacao, 'id' | 'created_at' | 'updated_at'> = {
        titulo: notificacaoData.titulo,
        mensagem: notificacaoData.mensagem,
        tipo: notificacaoData.tipo as 'info' | 'update' | 'warning',
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        publico_alvo: notificacaoData.publicoAlvo as 'todos' | 'alunos-full' | 'alunos-limited',
        created_by: user?.id || null,
        imagem_url: notificacaoData.imagem_url?.trim() || null,
        action_url: notificacaoData.action_url?.trim() || null
      }

      console.log('Dados da notificação a serem salvos:', dadosNotificacao)

      if (editingNotificacao) {
        // Atualizar notificação existente
        const sucesso = await updateNotificacao(editingNotificacao.id, dadosNotificacao)
        if (sucesso) {
          await carregarNotificacoes()
          setIsCreating(false)
          setEditingNotificacao(null)
        } else {
          setError('Erro ao atualizar notificação. Tente novamente.')
        }
      } else {
        // Criar nova notificação
        const novaNotificacao = await createNotificacao(dadosNotificacao)
        if (novaNotificacao) {
          await carregarNotificacoes()
          setIsCreating(false)
        } else {
          setError('Erro ao criar notificação. Tente novamente.')
        }
      }
    } catch (err) {
      console.error('Erro ao salvar notificação:', err)
      setError('Erro ao salvar notificação. Tente novamente.')
    }
  }

  const handleDelete = async (notificacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setError('')
      const sucesso = await deleteNotificacao(notificacaoId)
      if (sucesso) {
        await carregarNotificacoes()
      } else {
        setError('Erro ao excluir notificação. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao excluir notificação:', err)
      setError('Erro ao excluir notificação. Tente novamente.')
    }
  }

  if (loading || error) {
    return (
      <SafeLoading
        loading={loading}
        error={error}
        onRetry={carregarNotificacoes}
        loadingMessage="Carregando notificações..."
        errorMessage="Não foi possível carregar as notificações. Tente novamente."
      />
    )
  }

  const sugestoesPendentesCount = sugestoesRecebidas.length

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className={cn(
        "flex gap-2 border-b pb-2",
        theme === 'dark' ? "border-white/10" : "border-gray-200"
      )}>
        <button
          onClick={() => handleTabChange('enviadas')}
          className={cn(
            "px-4 py-2 rounded-t-lg font-medium transition-colors text-sm flex items-center gap-2",
            activeTab === 'enviadas'
              ? theme === 'dark'
                ? "bg-yellow-400/20 text-yellow-400 border-b-2 border-yellow-400"
                : "bg-yellow-500 text-white border-b-2 border-yellow-600"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Send className="w-4 h-4" />
          Enviadas
        </button>
        <button
          onClick={() => handleTabChange('recebidas')}
          className={cn(
            "px-4 py-2 rounded-t-lg font-medium transition-colors text-sm flex items-center gap-2",
            activeTab === 'recebidas'
              ? theme === 'dark'
                ? "bg-yellow-400/20 text-yellow-400 border-b-2 border-yellow-400"
                : "bg-yellow-500 text-white border-b-2 border-yellow-600"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Inbox className="w-4 h-4" />
          Recebidas
          {sugestoesPendentesCount > 0 && (
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full font-bold",
              activeTab === 'recebidas'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-white text-yellow-600"
                : theme === 'dark'
                  ? "bg-yellow-400/30 text-yellow-400"
                  : "bg-yellow-500/30 text-yellow-700"
            )}>
              {sugestoesPendentesCount}
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo da aba Enviadas */}
      {activeTab === 'enviadas' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className={cn(
                "text-lg md:text-xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Notificações Enviadas
              </h2>
              <p className={cn(
                "text-xs md:text-sm mt-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                {notificacoes.length} {notificacoes.length === 1 ? 'notificação cadastrada' : 'notificações cadastradas'}
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
                theme === 'dark'
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              )}
            >
              <Plus className="w-4 h-4" />
              Criar Notificação
            </button>
          </div>

      {error && (
        <div className={cn(
          "p-3 rounded-lg border",
          theme === 'dark'
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-red-50 border-red-200 text-red-700"
        )}>
          {error}
        </div>
      )}

      {/* Modal Criar/Editar Notificação */}
      <CreateNotificacaoModal
        isOpen={isCreating || !!editingNotificacao}
        onClose={() => {
          setIsCreating(false)
          setEditingNotificacao(null)
          setError('')
        }}
        onSave={handleSave}
        notificacao={editingNotificacao ? {
          ...editingNotificacao,
          dataInicio: editingNotificacao.data_inicio,
          dataFim: editingNotificacao.data_fim,
          publicoAlvo: editingNotificacao.publico_alvo,
          imagem_url: editingNotificacao.imagem_url ?? '',
          action_url: editingNotificacao.action_url ?? ''
        } : undefined}
      />

          {notificacoes.length === 0 ? (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              Nenhuma notificação cadastrada ainda. Clique em "Criar Notificação" para começar.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {notificacoesPaginadas.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    theme === 'dark'
                      ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                      : "bg-gray-50 border-gray-200 hover:border-yellow-400"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className={cn(
                          "font-semibold text-base",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {notificacao.titulo}
                        </h3>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border capitalize",
                          notificacao.tipo === 'info' && (
                            theme === 'dark'
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-blue-100 text-blue-700 border-blue-300"
                          ),
                          notificacao.tipo === 'update' && (
                            theme === 'dark'
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-green-100 text-green-700 border-green-300"
                          ),
                          notificacao.tipo === 'warning' && (
                            theme === 'dark'
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-yellow-100 text-yellow-700 border-yellow-300"
                          )
                        )}>
                          {notificacao.tipo}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm mb-2",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        {notificacao.mensagem}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                          {new Date(notificacao.data_inicio).toLocaleDateString('pt-BR')} - {new Date(notificacao.data_fim).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={cn(
                          "capitalize",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          {notificacao.publico_alvo.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditingNotificacao(notificacao)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          theme === 'dark'
                            ? "hover:bg-white/10 text-gray-400 hover:text-white"
                            : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                        )}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notificacao.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          theme === 'dark'
                            ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                            : "hover:bg-red-100 text-gray-600 hover:text-red-600"
                        )}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPageEnviadas}
              totalPages={Math.ceil(notificacoes.length / itemsPerPage)}
              onPageChange={setCurrentPageEnviadas}
              itemsPerPage={itemsPerPage}
              totalItems={notificacoes.length}
            />
          </>
          )}
        </>
      )}

      {/* Conteúdo da aba Recebidas */}
      {activeTab === 'recebidas' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className={cn(
                "text-lg md:text-xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Sugestões e Bugs Recebidos
              </h2>
              <p className={cn(
                "text-xs md:text-sm mt-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                {sugestoesRecebidas.length} {sugestoesRecebidas.length === 1 ? 'sugestão recebida' : 'sugestões recebidas'}
              </p>
            </div>
          </div>

          {loadingRecebidas || error ? (
            <SafeLoading
              loading={loadingRecebidas}
              error={error}
              onRetry={carregarSugestoesRecebidas}
              loadingMessage="Carregando sugestões..."
              errorMessage="Não foi possível carregar as sugestões. Tente novamente."
            />
          ) : sugestoesRecebidas.length === 0 ? (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              Nenhuma sugestão ou bug recebido ainda.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sugestoesPaginadas.map((sugestao) => {
                const isBug = sugestao.titulo === 'Relato de Bug'
                const mensagemLimpa = sugestao.mensagem.replace(/^\[(SUGESTÃO|BUG)\]\s*/, '')

                return (
                  <div
                    key={sugestao.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      theme === 'dark'
                        ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                        : "bg-gray-50 border-gray-200 hover:border-yellow-400"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Informações do aluno que enviou */}
                        {sugestao.user && (
                          <div className="flex items-center gap-2 mb-3">
                            {sugestao.user.avatar_url ? (
                              <img
                                src={sugestao.user.avatar_url}
                                alt={sugestao.user.name}
                                className="w-8 h-8 rounded-full object-cover border-2"
                                style={{
                                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            ) : (
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2",
                                theme === 'dark'
                                  ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-300"
                              )}>
                                {sugestao.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-semibold text-sm truncate",
                                theme === 'dark' ? "text-white" : "text-gray-900"
                              )}>
                                {sugestao.user.name}
                              </p>
                              <p className={cn(
                                "text-xs truncate",
                                theme === 'dark' ? "text-gray-400" : "text-gray-600"
                              )}>
                                {sugestao.user.email}
                              </p>
                            </div>
                            {sugestao.user.level !== undefined && (
                              <span className={cn(
                                "px-2 py-0.5 text-xs rounded-full font-medium",
                                theme === 'dark'
                                  ? "bg-yellow-400/20 text-yellow-400"
                                  : "bg-yellow-100 text-yellow-700"
                              )}>
                                Nível {sugestao.user.level}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {isBug ? (
                            <Bug className={cn("w-4 h-4", theme === 'dark' ? "text-red-400" : "text-red-600")} />
                          ) : (
                            <Lightbulb className={cn("w-4 h-4", theme === 'dark' ? "text-yellow-400" : "text-yellow-600")} />
                          )}
                          <h3 className={cn(
                            "font-semibold text-base",
                            theme === 'dark' ? "text-white" : "text-gray-900"
                          )}>
                            {sugestao.titulo}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full border",
                            isBug
                              ? theme === 'dark'
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-red-100 text-red-700 border-red-300"
                              : theme === 'dark'
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-yellow-100 text-yellow-700 border-yellow-300"
                          )}>
                            {isBug ? 'Bug' : 'Melhoria'}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm mb-2 whitespace-pre-wrap",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          {mensagemLimpa}
                        </p>

                        {/* Exibir imagem se houver */}
                        {sugestao.imagem_url && (
                          <div className="mb-3 relative group">
                            <img
                              src={sugestao.imagem_url}
                              alt="Imagem da sugestão"
                              className={cn(
                                "max-w-full rounded-lg border cursor-pointer transition-opacity hover:opacity-90",
                                theme === 'dark' ? "border-white/10" : "border-gray-200"
                              )}
                              style={{ maxHeight: '300px', objectFit: 'contain' }}
                              onClick={() => {
                                setImagemModalUrl(sugestao.imagem_url || null)
                                setImagemModalOpen(true)
                              }}
                            />
                            <div className={cn(
                              "absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm border transition-opacity opacity-0 group-hover:opacity-100",
                              theme === 'dark'
                                ? "bg-black/50 border-white/20 text-white"
                                : "bg-white/90 border-gray-300 text-gray-700"
                            )}>
                              <Maximize2 className="w-4 h-4" />
                            </div>
                            <p className={cn(
                              "text-xs mt-1 text-center",
                              theme === 'dark' ? "text-gray-400" : "text-gray-600"
                            )}>
                              Clique na imagem para ampliar
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs">
                          <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                            Recebido em {new Date(sugestao.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(sugestao.id)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            theme === 'dark'
                              ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                              : "hover:bg-red-100 text-gray-600 hover:text-red-600"
                          )}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Pagination
              currentPage={currentPageRecebidas}
              totalPages={Math.ceil(sugestoesRecebidas.length / itemsPerPage)}
              onPageChange={setCurrentPageRecebidas}
              itemsPerPage={itemsPerPage}
              totalItems={sugestoesRecebidas.length}
            />
          </>
          )}
        </>
      )}

      {/* Modal de Visualização de Imagem */}
      {imagemModalOpen && imagemModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setImagemModalOpen(false)
            setImagemModalUrl(null)
          }}
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <button
              onClick={() => {
                setImagemModalOpen(false)
                setImagemModalUrl(null)
              }}
              className={cn(
                "absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-sm border transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/20 text-white hover:bg-black/70"
                  : "bg-white/90 border-gray-300 text-gray-700 hover:bg-white"
              )}
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Imagem */}
            <img
              src={imagemModalUrl}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: '90vh' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
