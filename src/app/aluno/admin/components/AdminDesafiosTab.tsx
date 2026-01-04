'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, Sparkles, Loader2, Filter, Github, CheckCircle2, XCircle, ExternalLink, Clock, User, FileCode } from 'lucide-react'
import CreateDesafioModal from './CreateDesafioModal'
import { getAllDesafios, createDesafio, updateDesafio, deleteDesafio } from '@/lib/database'
import type { DatabaseDesafio, DesafioSubmissionWithUser } from '@/types/database'
import { getCursoNome, CURSOS_COM_GERAL, type CursoId } from '@/lib/constants/cursos'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { getLevelCategory, getLevelBorderColor } from '@/lib/gamification'

type TabType = 'desafios' | 'submissions'
type StatusFilter = 'pendente' | 'aprovado' | 'rejeitado' | 'todos'

export default function AdminDesafiosTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  
  // Verificar se há parâmetro 'subtab' na URL para abrir submissions
  const subtabFromUrl = searchParams.get('subtab')
  const initialTab: TabType = subtabFromUrl === 'submissions' ? 'submissions' : 'desafios'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  
  // Estados para desafios
  const [desafios, setDesafios] = useState<DatabaseDesafio[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingDesafio, setEditingDesafio] = useState<DatabaseDesafio | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filtroCurso, setFiltroCurso] = useState<CursoId | 'todos'>('todos')

  // Estados para submissions
  const [submissions, setSubmissions] = useState<DesafioSubmissionWithUser[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pendente')
  const [reviewingSubmission, setReviewingSubmission] = useState<DesafioSubmissionWithUser | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    carregarDesafios()
  }, [])

  useEffect(() => {
    if (activeTab === 'submissions') {
      carregarSubmissions()
    }
  }, [activeTab, statusFilter])

  const carregarDesafios = async () => {
    try {
      setLoading(true)
      setError('')
      const dados = await getAllDesafios()
      setDesafios(dados)
    } catch (err) {
      console.error('Erro ao carregar desafios:', err)
      setError('Erro ao carregar desafios. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const carregarSubmissions = useCallback(async () => {
    try {
      setLoadingSubmissions(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      const res = await fetch(`/api/admin/submissions?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao carregar submissions')
      }

      setSubmissions(json.submissions || [])
    } catch (err: any) {
      console.error('Erro ao carregar submissions:', err)
      setError(err?.message || 'Erro ao carregar submissions')
    } finally {
      setLoadingSubmissions(false)
    }
  }, [statusFilter])

  const handleReviewSubmission = async (status: 'aprovado' | 'rejeitado') => {
    if (!reviewingSubmission) return

    setIsApproving(true)
    setError('')
    setSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      const res = await fetch(`/api/admin/submissions/${reviewingSubmission.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status, admin_notes: adminNotes || null })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao atualizar submission')
      }

      // Log de debug para XP (sempre aparece no console do navegador)
      if (status === 'aprovado') {
        console.log('🔍 [DEBUG XP] ===== RESULTADO DA APROVAÇÃO =====')
        console.log('📊 Dados recebidos:', json.debug || {
          xpAwarded: json.xpAwarded,
          xpAwardedSuccessfully: json.xpAwardedSuccessfully,
          xpError: json.xpError,
        })
        console.log('📝 Mensagem:', json.message)
        
        if (json.debug?.xpError) {
          console.error('❌ [DEBUG XP] ERRO ao conceder XP:', {
            message: json.debug.xpError.message,
            code: json.debug.xpError.code,
            details: json.debug.xpError.details,
            rpcError: json.debug.xpError.rpcError, // Erro da função SQL RPC
            userId: json.debug.userId,
            desafioId: json.debug.desafioId,
          })
          if (json.debug.xpError.rpcError) {
            console.error('🔍 [DEBUG XP] Erro da função SQL RPC:', json.debug.xpError.rpcError)
            console.error('💡 Dica: A função SQL complete_desafio_for_user existe mas está falhando. Verifique os logs do servidor ou execute o SQL novamente.')
          } else {
            console.error('💡 Dica: Verifique se a função SQL complete_desafio_for_user foi criada no banco')
          }
        } else if (json.xpAwardedSuccessfully) {
          console.log(`✅ [DEBUG XP] XP concedido com SUCESSO: ${json.xpAwarded} XP`)
          console.log(`👤 Usuário: ${json.debug?.userId}`)
          console.log(`🎯 Desafio: ${json.debug?.desafioId}`)
        } else {
          console.warn(`⚠️ [DEBUG XP] ATENÇÃO: XP não foi concedido mas mostra na mensagem: ${json.xpAwarded} XP`)
          console.warn('💡 Verifique os logs do servidor ou se a função SQL foi executada')
        }
        console.log('🔍 [DEBUG XP] ====================================')
      }

      setSuccess(json.message || 'Submissão atualizada com sucesso!')
      setReviewingSubmission(null)
      setAdminNotes('')
      await carregarSubmissions()
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar submission')
    } finally {
      setIsApproving(false)
    }
  }

  const handleSave = async (desafioData: any) => {
    try {
      setError('')
      
      // Preparar dados no formato do banco
      const dadosDesafio: Omit<DatabaseDesafio, 'id' | 'created_at' | 'updated_at'> = {
        titulo: desafioData.titulo,
        descricao: desafioData.descricao,
        tecnologia: desafioData.tecnologia,
        dificuldade: desafioData.dificuldade as 'iniciante' | 'intermediario' | 'avancado',
        xp: desafioData.xp,
        periodicidade: desafioData.periodicidade as 'semanal' | 'mensal' | 'especial',
        prazo: null, // Pode ser adicionado depois se necessário
        requisitos: Array.isArray(desafioData.requisitos) ? desafioData.requisitos : [],
        curso_id: desafioData.curso_id || null,
        created_by: user?.id || null
      }

      console.log('Dados do desafio a serem salvos:', dadosDesafio)

      if (editingDesafio) {
        // Atualizar desafio existente
        const sucesso = await updateDesafio(editingDesafio.id, dadosDesafio)
        if (sucesso) {
          await carregarDesafios()
          setIsCreating(false)
          setEditingDesafio(null)
        } else {
          setError('Erro ao atualizar desafio. Tente novamente.')
        }
      } else {
        // Criar novo desafio
        const novoDesafio = await createDesafio(dadosDesafio)
        if (novoDesafio) {
          await carregarDesafios()
          setIsCreating(false)
        } else {
          setError('Erro ao criar desafio. Tente novamente.')
        }
      }
    } catch (err) {
      console.error('Erro ao salvar desafio:', err)
      setError('Erro ao salvar desafio. Tente novamente.')
    }
  }

  const handleDelete = async (desafioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setError('')
      const sucesso = await deleteDesafio(desafioId)
      if (sucesso) {
        await carregarDesafios()
      } else {
        setError('Erro ao excluir desafio. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao excluir desafio:', err)
      setError('Erro ao excluir desafio. Tente novamente.')
    }
  }

  const pendingCount = submissions.filter(s => s.status === 'pendente').length

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className={cn(
        "flex gap-2 border-b pb-2",
        theme === 'dark' ? "border-white/10" : "border-gray-200"
      )}>
        <button
          onClick={() => setActiveTab('desafios')}
          className={cn(
            "px-4 py-2 rounded-t-lg font-medium transition-colors text-sm",
            activeTab === 'desafios'
              ? theme === 'dark'
                ? "bg-yellow-400/20 text-yellow-400 border-b-2 border-yellow-400"
                : "bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          )}
        >
          <FileCode className="w-4 h-4 inline mr-2" />
          Desafios
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={cn(
            "px-4 py-2 rounded-t-lg font-medium transition-colors text-sm flex items-center gap-2",
            activeTab === 'submissions'
              ? theme === 'dark'
                ? "bg-yellow-400/20 text-yellow-400 border-b-2 border-yellow-400"
                : "bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500"
              : theme === 'dark'
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Github className="w-4 h-4" />
          Submissions
          {pendingCount > 0 && (
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full font-bold",
              theme === 'dark' ? "bg-red-500 text-white" : "bg-red-500 text-white"
            )}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Mensagens de erro/sucesso */}
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

      {success && (
        <div className={cn(
          "p-3 rounded-lg border",
          theme === 'dark'
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-green-50 border-green-200 text-green-700"
        )}>
          {success}
        </div>
      )}

      {/* Tab: Desafios */}
      {activeTab === 'desafios' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className={cn(
                "text-lg md:text-xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Gerenciar Desafios
              </h2>
              <p className={cn(
                "text-xs md:text-sm mt-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                {desafios.length} desafio{desafios.length !== 1 ? 's' : ''} cadastrado{desafios.length !== 1 ? 's' : ''}
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
              Criar Desafio
            </button>
          </div>

          {/* Modal Criar/Editar Desafio */}
          <CreateDesafioModal
            isOpen={isCreating || !!editingDesafio}
            onClose={() => {
              setIsCreating(false)
              setEditingDesafio(null)
              setError('')
            }}
            onSave={handleSave}
            desafio={editingDesafio}
          />

          {/* Filtro por Curso */}
          {desafios.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className={cn(
                "w-4 h-4",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )} />
              <select
                value={filtroCurso || 'todos'}
                onChange={(e) => setFiltroCurso(e.target.value as CursoId | 'todos')}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors",
                  theme === 'dark'
                    ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                    : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
                )}
              >
                <option value="todos">Todos os cursos</option>
                {CURSOS_COM_GERAL.map((curso) => (
                  <option key={curso.id || 'geral'} value={curso.id || 'geral'}>
                    {curso.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className={cn(
              "flex items-center justify-center p-8",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando desafios...</span>
            </div>
          ) : desafios.length === 0 ? (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              Nenhum desafio cadastrado ainda. Clique em "Criar Desafio" para começar.
            </div>
          ) : (
            <div className="space-y-3">
              {desafios
                .filter((desafio) => {
                  if (filtroCurso === 'todos') return true
                  if (filtroCurso === null) return !desafio.curso_id
                  return desafio.curso_id === filtroCurso
                })
                .map((desafio) => (
                <div
                  key={desafio.id}
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
                          {desafio.titulo}
                        </h3>
                        {/* Tecnologia - destaque principal */}
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border font-medium",
                          theme === 'dark'
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        )}>
                          {desafio.tecnologia}
                        </span>
                        {/* Nível de dificuldade */}
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border capitalize",
                          theme === 'dark'
                            ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300"
                        )}>
                          {desafio.dificuldade}
                        </span>
                        {/* Badge de IA */}
                        {desafio.gerado_por_ia && (
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full flex items-center gap-1",
                            theme === 'dark'
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-purple-100 text-purple-700"
                          )}>
                            <Sparkles className="w-3 h-3" />
                            IA
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm mb-2",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        {desafio.descricao}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={cn(
                          "font-semibold",
                          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                        )}>
                          +{desafio.xp} XP
                        </span>
                        {desafio.curso_id && (
                          <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                            Curso: {getCursoNome(desafio.curso_id as CursoId)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditingDesafio(desafio)}
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
                        onClick={() => handleDelete(desafio.id)}
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
          )}
        </>
      )}

      {/* Tab: Submissions */}
      {activeTab === 'submissions' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className={cn(
                "text-lg md:text-xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Revisar Submissões
              </h2>
              <p className={cn(
                "text-xs md:text-sm mt-1",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Revise os links do GitHub enviados pelos alunos
              </p>
            </div>
          </div>

          {/* Filtro por status */}
          <div className="flex items-center gap-2">
            <Filter className={cn(
              "w-4 h-4",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors",
                theme === 'dark'
                  ? "bg-black/50 border-white/10 text-white focus:border-yellow-400 focus:ring-yellow-400/20"
                  : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500/20"
              )}
            >
              <option value="pendente">Pendentes</option>
              <option value="aprovado">Aprovados</option>
              <option value="rejeitado">Rejeitados</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          {/* Modal de Revisão */}
          <Modal
            isOpen={!!reviewingSubmission}
            onClose={() => {
              setReviewingSubmission(null)
              setAdminNotes('')
            }}
            title="Revisar Submissão"
            size="md"
          >
            {reviewingSubmission && (
              <div className="space-y-4">
                {/* Info do Aluno */}
                {(() => {
                  const userLevel = reviewingSubmission.user?.level || 1
                  const levelCategory = getLevelCategory(userLevel)
                  const borderColor = getLevelBorderColor(userLevel)
                  
                  // Cores do badge de nível baseado na categoria
                  let levelBadgeBg = ''
                  let levelBadgeText = ''
                  if (levelCategory === 'iniciante') {
                    levelBadgeBg = 'bg-yellow-500'
                    levelBadgeText = 'text-white'
                  } else if (levelCategory === 'intermediario') {
                    levelBadgeBg = 'bg-blue-500'
                    levelBadgeText = 'text-white'
                  } else {
                    levelBadgeBg = 'bg-purple-600'
                    levelBadgeText = 'text-white'
                  }
                  
                  return (
                    <div className={cn(
                      "p-4 rounded-lg border",
                      theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                    )}>
                      <div className="flex items-center gap-4">
                        {/* Avatar com borda colorida pelo nível */}
                        {reviewingSubmission.user?.avatar_url ? (
                          <img
                            src={reviewingSubmission.user.avatar_url}
                            alt={reviewingSubmission.user?.name || 'Avatar'}
                            className={cn("w-14 h-14 rounded-full object-cover border-3", borderColor)}
                            style={{ borderWidth: '3px' }}
                          />
                        ) : (
                          <div className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center border-3",
                            borderColor,
                            theme === 'dark' ? "bg-white/10" : "bg-gray-200"
                          )} style={{ borderWidth: '3px' }}>
                            <User className={cn("w-7 h-7", theme === 'dark' ? "text-gray-400" : "text-gray-600")} />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-semibold text-base", theme === 'dark' ? "text-white" : "text-gray-900")}>
                            {reviewingSubmission.user?.name || 'Usuário'}
                          </p>
                          <p className={cn("text-xs mb-2", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                            {reviewingSubmission.user?.email}
                          </p>
                          
                          {/* Badges de status */}
                          <div className="flex flex-wrap gap-2">
                            {/* Nível com cor dinâmica */}
                            <span className={cn(
                              "px-2.5 py-1 text-xs rounded-full font-semibold",
                              levelBadgeBg,
                              levelBadgeText
                            )}>
                              Nível {userLevel}
                            </span>
                            
                            {/* XP Total */}
                            <span className={cn(
                              "px-2.5 py-1 text-xs rounded-full font-medium",
                              theme === 'dark'
                                ? "bg-white/10 text-white"
                                : "bg-gray-200 text-gray-800"
                            )}>
                              {reviewingSubmission.user?.xp || 0} XP
                            </span>
                            
                            {/* Posição no Ranking */}
                            {reviewingSubmission.user?.ranking_position && (
                              <span className={cn(
                                "px-2.5 py-1 text-xs rounded-full font-medium",
                                theme === 'dark'
                                  ? "bg-white/10 text-white"
                                  : "bg-gray-200 text-gray-800"
                              )}>
                                #{reviewingSubmission.user.ranking_position} Ranking
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Info do Desafio */}
                <div className={cn(
                  "p-3 rounded-lg border",
                  theme === 'dark' ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"
                )}>
                  <p className={cn("text-sm font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {reviewingSubmission.desafio?.titulo}
                  </p>
                  <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                    {reviewingSubmission.desafio?.tecnologia} • {reviewingSubmission.desafio?.xp} XP
                  </p>
                </div>

                {/* Link do GitHub */}
                <div>
                  <label className={cn("block text-sm font-medium mb-1", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>
                    Repositório GitHub
                  </label>
                  <a
                    href={reviewingSubmission.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-sm hover:underline",
                      theme === 'dark'
                        ? "bg-white/5 border-white/10 text-blue-400 hover:bg-white/10"
                        : "bg-gray-50 border-gray-200 text-blue-600 hover:bg-gray-100"
                    )}
                  >
                    <Github className="w-4 h-4" />
                    {reviewingSubmission.github_url}
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                </div>

                {/* Notas do Admin */}
                <div>
                  <label className={cn("block text-sm font-medium mb-1", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>
                    Feedback (opcional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Deixe um comentário para o aluno..."
                    rows={3}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border text-sm",
                      theme === 'dark'
                        ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    )}
                  />
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleReviewSubmission('rejeitado')}
                    disabled={isApproving}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                      theme === 'dark'
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-red-100 text-red-700 hover:bg-red-200",
                      isApproving && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleReviewSubmission('aprovado')}
                    disabled={isApproving}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                      theme === 'dark'
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-green-600 text-white hover:bg-green-700",
                      isApproving && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isApproving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Aprovar
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {loadingSubmissions ? (
            <div className={cn(
              "flex items-center justify-center p-8",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando submissões...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className={cn(
              "p-8 text-center rounded-lg border",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-600"
            )}>
              {statusFilter === 'pendente'
                ? 'Nenhuma submissão pendente de revisão.'
                : `Nenhuma submissão ${statusFilter === 'todos' ? '' : statusFilter} encontrada.`
              }
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    theme === 'dark'
                      ? "bg-black/30 border-white/10"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                          {submission.user?.name || 'Usuário'}
                        </span>
                        <span className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                          •
                        </span>
                        <span className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                          {submission.desafio?.titulo}
                        </span>
                        {/* Status Badge */}
                        {submission.status === 'pendente' && (
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full flex items-center gap-1",
                            theme === 'dark' ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                          )}>
                            <Clock className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                        {submission.status === 'aprovado' && (
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full flex items-center gap-1",
                            theme === 'dark' ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"
                          )}>
                            <CheckCircle2 className="w-3 h-3" />
                            Aprovado
                          </span>
                        )}
                        {submission.status === 'rejeitado' && (
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full flex items-center gap-1",
                            theme === 'dark' ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700"
                          )}>
                            <XCircle className="w-3 h-3" />
                            Rejeitado
                          </span>
                        )}
                      </div>
                      
                      <a
                        href={submission.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-1 text-sm hover:underline",
                          theme === 'dark' ? "text-blue-400" : "text-blue-600"
                        )}
                      >
                        <Github className="w-4 h-4" />
                        {submission.github_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <p className={cn("text-xs mt-2", theme === 'dark' ? "text-gray-500" : "text-gray-500")}>
                        Enviado em {new Date(submission.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      {submission.admin_notes && (
                        <p className={cn(
                          "text-sm mt-2 p-2 rounded",
                          theme === 'dark' ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-700"
                        )}>
                          <strong>Feedback:</strong> {submission.admin_notes}
                        </p>
                      )}
                    </div>

                    {submission.status === 'pendente' && (
                      <button
                        onClick={() => setReviewingSubmission(submission)}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                          theme === 'dark'
                            ? "bg-yellow-400 text-black hover:bg-yellow-300"
                            : "bg-yellow-500 text-white hover:bg-yellow-600"
                        )}
                      >
                        Revisar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
