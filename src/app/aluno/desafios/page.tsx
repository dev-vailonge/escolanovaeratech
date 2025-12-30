'use client'

import { Target, Clock, CheckCircle2, Trophy, Sparkles, Github, Loader2, ExternalLink, XCircle, Send, AlertCircle, Flag } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { hasFullAccess } from '@/lib/types/auth'
import { useAuth } from '@/lib/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import type { DatabaseDesafio, DatabaseDesafioSubmission } from '@/types/database'

// Tecnologias organizadas por categoria/curso
const TECNOLOGIAS_POR_CATEGORIA = {
  'Frontend Web': ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
  'Backend': ['Node.js', 'Express', 'APIs REST', 'PostgreSQL', 'MongoDB'],
  'Mobile Android': ['Kotlin', 'Jetpack Compose', 'Android'],
  'Mobile iOS': ['Swift', 'SwiftUI'],
  'Análise de Dados': ['Python', 'Pandas', 'SQL', 'Data Visualization'],
  'Fundamentos': ['Lógica de Programação', 'Algoritmos', 'Estrutura de Dados', 'Git'],
}

// Lista flat de todas as tecnologias para o select
const TECNOLOGIAS = Object.values(TECNOLOGIAS_POR_CATEGORIA).flat()
const NIVEIS: Array<'iniciante' | 'intermediario' | 'avancado'> = ['iniciante', 'intermediario', 'avancado']

// Tipo para desafio do usuário com status
interface MeuDesafio {
  id: string
  desafio: DatabaseDesafio
  atribuido_em: string
  submission?: DatabaseDesafioSubmission
  status: 'pendente_envio' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'desistiu'
}

export default function DesafiosPage() {
  const { theme } = useTheme()
  const { user: authUser } = useAuth()
  const canParticipate = hasFullAccess(authUser)

  // Estados
  const [activeTab, setActiveTab] = useState<'gerar' | 'meus'>('gerar')
  const [loading, setLoading] = useState(true)
  const [meusDesafios, setMeusDesafios] = useState<MeuDesafio[]>([])
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Estados para modal de seleção
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [selectedTecnologia, setSelectedTecnologia] = useState('')
  const [selectedNivel, setSelectedNivel] = useState<'iniciante' | 'intermediario' | 'avancado' | ''>('')
  const [selectionError, setSelectionError] = useState<string>('')
  const [isGerando, setIsGerando] = useState(false)

  // Estados para submeter GitHub
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [desafioParaSubmeter, setDesafioParaSubmeter] = useState<MeuDesafio | null>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [isSubmittingGithub, setIsSubmittingGithub] = useState(false)

  // Estados para desistir
  const [showDesistirModal, setShowDesistirModal] = useState(false)
  const [desafioParaDesistir, setDesafioParaDesistir] = useState<MeuDesafio | null>(null)
  const [isDesistindo, setIsDesistindo] = useState(false)

  // Carregar desafios do usuário
  const loadMeusDesafios = useCallback(async () => {
    if (!authUser?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Buscar atribuições do usuário
      const { data: atribuicoes, error: atribError } = await supabase
        .from('user_desafio_atribuido')
        .select('desafio_id, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })

      if (atribError) {
        console.error('Erro ao buscar atribuições:', atribError)
        setMeusDesafios([])
        return
      }

      if (!atribuicoes || atribuicoes.length === 0) {
        setMeusDesafios([])
        return
      }

      const desafioIds = atribuicoes.map(a => a.desafio_id)

      // Buscar detalhes dos desafios
      const { data: desafios } = await supabase
        .from('desafios')
        .select('*')
        .in('id', desafioIds)

      // Buscar submissions do usuário
      const { data: submissions } = await supabase
        .from('desafio_submissions')
        .select('*')
        .eq('user_id', authUser.id)
        .in('desafio_id', desafioIds)

      // Montar lista de "Meus Desafios"
      const meusDesafiosList: MeuDesafio[] = atribuicoes.map(atrib => {
        const desafio = desafios?.find(d => d.id === atrib.desafio_id)
        const submission = submissions?.find(s => s.desafio_id === atrib.desafio_id)

        let status: MeuDesafio['status'] = 'pendente_envio'
        if (submission) {
          if (submission.status === 'pendente') status = 'aguardando_aprovacao'
          else if (submission.status === 'aprovado') status = 'aprovado'
          else if (submission.status === 'rejeitado') status = 'rejeitado'
          else if (submission.status === 'desistiu') status = 'desistiu'
        }

        return {
          id: atrib.desafio_id,
          desafio: desafio as DatabaseDesafio,
          atribuido_em: atrib.created_at,
          submission,
          status
        }
      }).filter(d => d.desafio)

      setMeusDesafios(meusDesafiosList)
    } catch (err) {
      console.error('Erro ao carregar meus desafios:', err)
    } finally {
      setLoading(false)
    }
  }, [authUser?.id])

  useEffect(() => {
    loadMeusDesafios()
  }, [loadMeusDesafios])

  // Verificar se pode gerar novo desafio
  const podeGerarNovo = meusDesafios.every(d => d.status === 'aprovado' || d.status === 'rejeitado' || d.status === 'desistiu')
  const desafioAtivo = meusDesafios.find(d => d.status === 'pendente_envio' || d.status === 'aguardando_aprovacao')

  // Contadores
  const totalAprovados = meusDesafios.filter(d => d.status === 'aprovado').length

  // Abrir modal de seleção
  const handleGerarDesafio = () => {
    if (!canParticipate) return
    setSelectionError('')
    setSelectedTecnologia('')
    setSelectedNivel('')
    setShowSelectionModal(true)
  }

  // Confirmar seleção e gerar desafio
  const handleConfirmarSelecao = async () => {
    if (!selectedTecnologia || !selectedNivel) {
      setSelectionError('Por favor, selecione tecnologia e nível')
      return
    }

    setIsGerando(true)
    setSelectionError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      const res = await fetch('/api/desafios/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tecnologia: selectedTecnologia, nivel: selectedNivel })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao gerar desafio')
      }

      setShowSelectionModal(false)
      setSuccess('🎯 Desafio gerado com sucesso! Confira na aba "Meus Desafios".')
      await loadMeusDesafios()
      setActiveTab('meus')
    } catch (e: any) {
      setSelectionError(e?.message || 'Erro ao gerar desafio')
    } finally {
      setIsGerando(false)
    }
  }

  // Submeter link do GitHub
  const handleSubmitGithub = async () => {
    if (!desafioParaSubmeter || !githubUrl) {
      setError('Informe o link do GitHub')
      return
    }

    setIsSubmittingGithub(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      const res = await fetch(`/api/desafios/${desafioParaSubmeter.id}/submeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ github_url: githubUrl })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao submeter')
      }

      setSuccess('✅ Solução enviada! Aguarde a aprovação do admin.')
      setShowSubmitModal(false)
      setGithubUrl('')
      setDesafioParaSubmeter(null)
      await loadMeusDesafios()
    } catch (e: any) {
      setError(e?.message || 'Erro ao submeter')
    } finally {
      setIsSubmittingGithub(false)
    }
  }

  const openSubmitModal = (desafio: MeuDesafio) => {
    setDesafioParaSubmeter(desafio)
    setGithubUrl('')
    setShowSubmitModal(true)
    setError('')
  }

  // Desistir do desafio
  const openDesistirModal = (desafio: MeuDesafio) => {
    setDesafioParaDesistir(desafio)
    setShowDesistirModal(true)
    setError('')
  }

  const handleDesistir = async () => {
    if (!desafioParaDesistir) return

    setIsDesistindo(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      const res = await fetch(`/api/desafios/${desafioParaDesistir.id}/desistir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao desistir')
      }

      setSuccess('⚠️ Você desistiu do desafio e perdeu 20 XP.')
      setShowDesistirModal(false)
      setDesafioParaDesistir(null)
      await loadMeusDesafios()
    } catch (e: any) {
      setError(e?.message || 'Erro ao desistir')
    } finally {
      setIsDesistindo(false)
    }
  }

  const getStatusBadge = (status: MeuDesafio['status']) => {
    switch (status) {
      case 'pendente_envio':
        return (
          <span className={cn(
            "px-2 py-1 text-xs rounded-full border flex items-center gap-1",
            theme === 'dark'
              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
              : "bg-blue-100 text-blue-700 border-blue-300"
          )}>
            <Send className="w-3 h-3" />
            Enviar solução
          </span>
        )
      case 'aguardando_aprovacao':
        return (
          <span className={cn(
            "px-2 py-1 text-xs rounded-full border flex items-center gap-1",
            theme === 'dark'
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              : "bg-yellow-100 text-yellow-700 border-yellow-300"
          )}>
            <Clock className="w-3 h-3" />
            Aguardando
          </span>
        )
      case 'aprovado':
        return (
          <span className={cn(
            "px-2 py-1 text-xs rounded-full border flex items-center gap-1",
            theme === 'dark'
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-green-100 text-green-700 border-green-300"
          )}>
            <CheckCircle2 className="w-3 h-3" />
            Aprovado
          </span>
        )
      case 'rejeitado':
        return (
          <span className={cn(
            "px-2 py-1 text-xs rounded-full border flex items-center gap-1",
            theme === 'dark'
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : "bg-red-100 text-red-700 border-red-300"
          )}>
            <XCircle className="w-3 h-3" />
            Rejeitado
          </span>
        )
      case 'desistiu':
        return (
          <span className={cn(
            "px-2 py-1 text-xs rounded-full border flex items-center gap-1",
            theme === 'dark'
              ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
              : "bg-gray-100 text-gray-600 border-gray-300"
          )}>
            <Flag className="w-3 h-3" />
            Desistiu
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Desafios
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Complete desafios práticos e ganhe XP
          </p>
        </div>
        <div className={cn(
          "flex items-center justify-center p-12",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando desafios...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Modal de Seleção de Tecnologia e Nível */}
      <Modal 
        isOpen={showSelectionModal} 
        onClose={() => {
          setShowSelectionModal(false)
          setSelectionError('')
        }} 
        title="Selecione Tecnologia e Nível" 
        size="md"
      >
        <div className="space-y-4">
          {selectionError && (
            <div className={cn(
              'border rounded-lg p-3 text-sm',
              theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              {selectionError}
            </div>
          )}

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Tecnologia
            </label>
            <select
              value={selectedTecnologia}
              onChange={(e) => {
                setSelectedTecnologia(e.target.value)
                setSelectionError('')
              }}
              className={cn(
                "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              )}
            >
              <option value="">Selecione uma tecnologia</option>
              {Object.entries(TECNOLOGIAS_POR_CATEGORIA).map(([categoria, techs]) => (
                <optgroup key={categoria} label={categoria}>
                  {techs.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              theme === 'dark' ? "text-gray-300" : "text-gray-700"
            )}>
              Nível
            </label>
            <select
              value={selectedNivel}
              onChange={(e) => {
                setSelectedNivel(e.target.value as 'iniciante' | 'intermediario' | 'avancado' | '')
                setSelectionError('')
              }}
              className={cn(
                "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-400",
                theme === 'dark'
                  ? "bg-black/30 border-white/10 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              )}
            >
              <option value="">Selecione um nível</option>
              {NIVEIS.map(nivel => (
                <option key={nivel} value={nivel}>
                  {nivel === 'iniciante' ? 'Iniciante' : nivel === 'intermediario' ? 'Intermediário' : 'Avançado'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowSelectionModal(false)
                setSelectionError('')
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              )}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarSelecao}
              disabled={isGerando}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                isGerando && "opacity-50 cursor-not-allowed",
                theme === 'dark'
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              )}
            >
              {isGerando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Desafio
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para submeter GitHub */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Enviar Solução"
        size="md"
      >
        <div className="space-y-4">
          {desafioParaSubmeter && (
            <div className={cn(
              "p-3 rounded-lg border",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
            )}>
              <p className={cn("text-sm font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                {desafioParaSubmeter.desafio.titulo}
              </p>
              <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                {desafioParaSubmeter.desafio.tecnologia} • {desafioParaSubmeter.desafio.xp} XP
              </p>
            </div>
          )}

          <div>
            <label className={cn("block text-sm font-medium mb-2", theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Link do repositório GitHub
            </label>
            <div className="relative">
              <Github className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                theme === 'dark' ? "text-gray-400" : "text-gray-500"
              )} />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/usuario/repositorio"
                className={cn(
                  "w-full pl-10 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400",
                  theme === 'dark'
                    ? "bg-black/30 border-white/10 text-white placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                )}
              />
            </div>
            <p className={cn("text-xs mt-1", theme === 'dark' ? "text-gray-500" : "text-gray-500")}>
              Cole o link do repositório público com sua solução
            </p>
          </div>

          {error && (
            <div className={cn(
              "border rounded-lg p-3 text-sm",
              theme === 'dark' ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-red-50 border-red-200 text-red-700"
            )}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowSubmitModal(false)}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              )}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitGithub}
              disabled={isSubmittingGithub || !githubUrl}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                (isSubmittingGithub || !githubUrl) && "opacity-50 cursor-not-allowed",
                theme === 'dark'
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              )}
            >
              {isSubmittingGithub ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação para desistir */}
      <Modal
        isOpen={showDesistirModal}
        onClose={() => setShowDesistirModal(false)}
        title="Desistir do Desafio"
        size="md"
      >
        <div className="space-y-4">
          <div className={cn(
            "p-4 rounded-lg border",
            theme === 'dark' ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"
          )}>
            <div className="flex items-start gap-3">
              <AlertCircle className={cn(
                "w-5 h-5 flex-shrink-0 mt-0.5",
                theme === 'dark' ? "text-red-400" : "text-red-600"
              )} />
              <div>
                <p className={cn(
                  "font-medium mb-1",
                  theme === 'dark' ? "text-red-300" : "text-red-800"
                )}>
                  Tem certeza que deseja desistir?
                </p>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-red-200" : "text-red-700"
                )}>
                  Ao desistir deste desafio, você perderá <strong>20 XP</strong> como penalidade.
                </p>
              </div>
            </div>
          </div>

          {desafioParaDesistir && (
            <div className={cn(
              "p-3 rounded-lg border",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
            )}>
              <p className={cn("text-sm font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                {desafioParaDesistir.desafio.titulo}
              </p>
              <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                {desafioParaDesistir.desafio.tecnologia} • {desafioParaDesistir.desafio.dificuldade}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowDesistirModal(false)}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              )}
            >
              Cancelar
            </button>
            <button
              onClick={handleDesistir}
              disabled={isDesistindo}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                isDesistindo && "opacity-50 cursor-not-allowed",
                theme === 'dark'
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              {isDesistindo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Desistir (-20 XP)
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {(error || success) && (
        <div
          className={cn(
            'border rounded-lg p-3 text-sm',
            error
              ? theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
              : theme === 'dark'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-green-50 border-green-200 text-green-700'
          )}
        >
          {error || success}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Desafios
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Complete desafios práticos e ganhe XP
        </p>
      </div>

      {/* Abas */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-1 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        <div className="flex gap-1">
          <button
            onClick={() => { setActiveTab('gerar'); setError(''); setSuccess(''); }}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base",
              activeTab === 'gerar'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20"
            )}
          >
            Novo Desafio
          </button>
          <button
            onClick={() => { setActiveTab('meus'); setError(''); setSuccess(''); }}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base",
              activeTab === 'meus'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-700 hover:text-gray-900 hover:bg-yellow-500/20"
            )}
          >
            Meus Desafios
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        {activeTab === 'gerar' ? (
          // Aba Gerar Desafio
          <div className="flex flex-col items-center justify-center py-12 md:py-16">
            {!podeGerarNovo && desafioAtivo ? (
              // Tem desafio ativo - mostrar aviso
              <>
                <AlertCircle className={cn(
                  "w-16 h-16 md:w-20 md:h-20 mb-6",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )} />
                <h2 className={cn(
                  "text-xl md:text-2xl font-bold mb-4 text-center",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Você já tem um desafio ativo
                </h2>
                <p className={cn(
                  "text-sm md:text-base mb-4 text-center max-w-md",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  {desafioAtivo.status === 'pendente_envio'
                    ? 'Envie sua solução no GitHub antes de gerar outro desafio.'
                    : 'Aguarde a aprovação do admin para gerar outro desafio.'
                  }
                </p>
                <p className={cn(
                  "text-sm font-medium mb-6 text-center",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Desafio: {desafioAtivo.desafio.titulo}
                </p>
                {desafioAtivo.status === 'pendente_envio' && (
                  <button
                    onClick={() => openSubmitModal(desafioAtivo)}
                    className={cn(
                      "px-6 py-3 rounded-lg font-semibold text-base md:text-lg transition-all flex items-center gap-2 mb-4",
                      theme === 'dark'
                        ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                    )}
                  >
                    <Github className="w-5 h-5" />
                    Enviar Solução
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('meus')}
                  className={cn(
                    "text-sm hover:underline",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  Ver meus desafios →
                </button>
              </>
            ) : (
              // Pode gerar novo desafio
              <>
                <Sparkles className={cn(
                  "w-16 h-16 md:w-20 md:h-20 mb-6",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )} />
                <h2 className={cn(
                  "text-xl md:text-2xl font-bold mb-4 text-center",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Pronto para um novo desafio?
                </h2>
                <p className={cn(
                  "text-sm md:text-base mb-8 text-center max-w-md",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Escolha uma tecnologia e nível. Nossa IA irá gerar um desafio prático para você!
                </p>
                <button
                  onClick={handleGerarDesafio}
                  disabled={!canParticipate}
                  className={cn(
                    "px-6 py-3 rounded-lg font-semibold text-base md:text-lg transition-all flex items-center gap-2",
                    !canParticipate
                      ? "opacity-50 cursor-not-allowed bg-gray-400 text-white"
                      : theme === 'dark'
                        ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  {!canParticipate ? 'Acesso Limitado' : 'Gerar Desafio'}
                </button>
                <p className={cn(
                  "text-xs mt-4",
                  theme === 'dark' ? "text-gray-500" : "text-gray-500"
                )}>
                  <Trophy className="w-3 h-3 inline mr-1" />
                  Cada desafio vale 40 XP
                </p>
              </>
            )}
          </div>
        ) : (
          // Aba Meus Desafios
          <div className="space-y-3 md:space-y-4">
            {/* Card de Estatísticas */}
            <div className={cn(
              "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
              theme === 'dark'
                ? "bg-black/20 border-white/10"
                : "bg-white border-yellow-400/90 shadow-md"
            )}>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className={cn(
                    "text-xl md:text-2xl font-bold",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {totalAprovados}
                  </p>
                  <p className={cn(
                    "text-xs md:text-sm",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Desafios Concluídos
                  </p>
                </div>
              </div>
            </div>

            {meusDesafios.length === 0 ? (
              <div className={cn(
                "p-8 text-center rounded-xl border",
                theme === 'dark'
                  ? "bg-black/20 border-white/10 text-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              )}>
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum desafio ainda</p>
                <p className="text-sm">Gere seu primeiro desafio para começar!</p>
              </div>
            ) : (
              meusDesafios.map((meuDesafio) => (
                <div
                  key={meuDesafio.id}
                  className={cn(
                    "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300",
                    theme === 'dark'
                      ? "bg-black/20 border-white/10 hover:border-yellow-400/50"
                      : "bg-white border-yellow-400/90 shadow-md hover:border-yellow-500 hover:shadow-lg"
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
                        <h3 className={cn(
                          "text-base md:text-lg font-semibold flex-1 min-w-0",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {meuDesafio.desafio.titulo}
                        </h3>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border",
                          theme === 'dark'
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        )}>
                          {meuDesafio.desafio.tecnologia}
                        </span>
                        {getStatusBadge(meuDesafio.status)}
                      </div>
                      <p className={cn(
                        "text-sm md:text-base mb-3 md:mb-4 line-clamp-2",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        {meuDesafio.desafio.descricao}
                      </p>

                      {/* Requisitos */}
                      {meuDesafio.desafio.requisitos && meuDesafio.desafio.requisitos.length > 0 && (
                        <div className="mb-3">
                          <p className={cn(
                            "text-xs font-semibold mb-2 flex items-center gap-1",
                            theme === 'dark' ? "text-gray-300" : "text-gray-700"
                          )}>
                            📋 O que você precisa fazer:
                          </p>
                          <ul className={cn(
                            "space-y-1 text-xs pl-4",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            {meuDesafio.desafio.requisitos.map((req: string, idx: number) => (
                              <li
                                key={idx}
                                className="list-disc"
                              >
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        <span className="capitalize">{meuDesafio.desafio.dificuldade}</span>
                        <span className={cn(
                          "font-semibold",
                          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                        )}>
                          +{meuDesafio.desafio.xp} XP
                        </span>
                      </div>

                      {meuDesafio.submission?.github_url && (
                        <div className="mt-3">
                          <a
                            href={meuDesafio.submission.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "text-sm flex items-center gap-1 hover:underline",
                              theme === 'dark' ? "text-blue-400" : "text-blue-600"
                            )}
                          >
                            <Github className="w-4 h-4" />
                            Ver repositório
                          </a>
                        </div>
                      )}

                      {/* Feedback do admin para aprovado */}
                      {meuDesafio.status === 'aprovado' && meuDesafio.submission?.admin_notes && (
                        <div className={cn(
                          "mt-3 p-3 rounded text-sm",
                          theme === 'dark' ? "bg-green-500/10 text-green-300" : "bg-green-50 text-green-700"
                        )}>
                          <strong>Feedback do Admin:</strong> {meuDesafio.submission.admin_notes}
                        </div>
                      )}
                      
                      {/* Feedback do admin para rejeitado */}
                      {meuDesafio.status === 'rejeitado' && meuDesafio.submission?.admin_notes && (
                        <div className={cn(
                          "mt-3 p-3 rounded text-sm",
                          theme === 'dark' ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700"
                        )}>
                          <strong>Motivo da rejeição:</strong> {meuDesafio.submission.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex flex-col gap-2">
                      {/* Enviar (pendente) ou Reenviar (rejeitado) */}
                      {(meuDesafio.status === 'pendente_envio' || meuDesafio.status === 'rejeitado') && (
                        <button
                          onClick={() => openSubmitModal(meuDesafio)}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto",
                            theme === 'dark'
                              ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                              : "bg-yellow-500 hover:bg-yellow-600 text-white"
                          )}
                        >
                          <Github className="w-4 h-4" />
                          {meuDesafio.status === 'rejeitado' ? 'Reenviar' : 'Enviar'}
                        </button>
                      )}
                      {/* Editar submissão (aguardando aprovação) */}
                      {meuDesafio.status === 'aguardando_aprovacao' && (
                        <button
                          onClick={() => openSubmitModal(meuDesafio)}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto",
                            theme === 'dark'
                              ? "bg-transparent border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                              : "bg-transparent border border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                          )}
                        >
                          <Github className="w-4 h-4" />
                          Editar Link
                        </button>
                      )}
                      {/* Desistir (só quando ainda não submeteu) */}
                      {meuDesafio.status === 'pendente_envio' && (
                        <button
                          onClick={() => openDesistirModal(meuDesafio)}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto text-sm",
                            theme === 'dark'
                              ? "bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10"
                              : "bg-transparent border border-red-300 text-red-600 hover:bg-red-50"
                          )}
                        >
                          <Flag className="w-3 h-3" />
                          Desistir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
