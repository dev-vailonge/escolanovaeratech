'use client'

import { Target, Clock, CheckCircle2, Trophy, Sparkles, Github, Loader2, ExternalLink, XCircle, Send, AlertCircle, Flag } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { hasFullAccess } from '@/lib/types/auth'
import { useAuth } from '@/lib/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { getAuthToken } from '@/lib/getAuthToken'
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
  dataConclusao?: string // Data/hora de conclusão (aprovado)
  tentativas: number // Número de tentativas (submissões)
}

export default function DesafiosPage() {
  const { theme } = useTheme()
  const { user: authUser } = useAuth()
  const canParticipate = hasFullAccess(authUser)

  // Estados
  const [activeTab, setActiveTab] = useState<'gerar' | 'meus'>('gerar')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false) // Loading sem bloquear UI
  const [meusDesafios, setMeusDesafios] = useState<MeuDesafio[]>([])
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Estados para modal de seleção
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [selectedTecnologia, setSelectedTecnologia] = useState('')
  const [selectedNivel, setSelectedNivel] = useState<'iniciante' | 'intermediario' | 'avancado' | ''>('')
  const [selectionError, setSelectionError] = useState<string>('')
  const [isGerando, setIsGerando] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  
  // Mensagens animadas e provocativas para o loading (20 mensagens para cobrir 60s)
  const loadingMessages = [
    {
      title: "Nossa IA está criando um desafio para você!",
      subtitle: "Aguarde um momento enquanto geramos",
      emoji: "✨"
    },
    {
      title: "Espere mais um pouco...",
      subtitle: "Estamos gerando seu desafio personalizado",
      emoji: "⚡"
    },
    {
      title: "Se prepare heim!",
      subtitle: "O desafio está sendo criado especialmente para você",
      emoji: "🔥"
    },
    {
      title: "Pensando no melhor desafio...",
      subtitle: "Nossa IA está analisando o nível escolhido",
      emoji: "🤔"
    },
    {
      title: "Criando um desafio desafiador!",
      subtitle: "Garantindo que seja interessante e educativo",
      emoji: "💡"
    },
    {
      title: "Quase lá!",
      subtitle: "Últimos ajustes para garantir que o desafio seja perfeito",
      emoji: "🎯"
    },
    {
      title: "Definindo os requisitos...",
      subtitle: "Garantindo qualidade e relevância",
      emoji: "✅"
    },
    {
      title: "Faltam só alguns segundos...",
      subtitle: "Nossa IA está finalizando o desafio",
      emoji: "🚀"
    },
    {
      title: "Quase pronto!",
      subtitle: "Organizando os detalhes de forma inteligente",
      emoji: "📝"
    },
    {
      title: "Criando a descrição...",
      subtitle: "Garantindo que cada detalhe seja claro",
      emoji: "🎲"
    },
    {
      title: "Adicionando instruções...",
      subtitle: "Para que você entenda o que precisa fazer",
      emoji: "📚"
    },
    {
      title: "Revisando tudo...",
      subtitle: "Garantindo que está tudo perfeito para você",
      emoji: "🔍"
    },
    {
      title: "Quase finalizando!",
      subtitle: "Ajustando os últimos detalhes",
      emoji: "⚙️"
    },
    {
      title: "Preparando o desafio...",
      subtitle: "Organizando tudo para sua experiência",
      emoji: "🎨"
    },
    {
      title: "Últimos toques!",
      subtitle: "Deixando tudo perfeito para você",
      emoji: "🌟"
    },
    {
      title: "Quase terminando...",
      subtitle: "Só mais alguns segundos",
      emoji: "⏳"
    },
    {
      title: "Finalizando!",
      subtitle: "O desafio está quase pronto",
      emoji: "🎊"
    },
    {
      title: "Está quase pronto!",
      subtitle: "Só mais um pouquinho",
      emoji: "💫"
    },
    {
      title: "Quase acabando!",
      subtitle: "Últimos ajustes finais",
      emoji: "⚡"
    },
    {
      title: "Está saindo do forno!",
      subtitle: "Seu desafio personalizado está quase pronto",
      emoji: "🔥"
    }
  ]

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
  const loadMeusDesafios = useCallback(async (showFullLoading = false) => {
    if (!authUser?.id) {
      setLoading(false)
      return
    }

    try {
      // Usar loading completo apenas no primeiro carregamento
      if (showFullLoading) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      console.log('🔍 [loadMeusDesafios] Carregando desafios para usuário:', authUser.id)

      // Timeout de segurança: 10 segundos para cada operação
      const createTimeoutPromise = (timeoutMs: number) => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )

      // Buscar atribuições do usuário (com timeout)
      let atribuicoes, atribError
      try {
        const atribPromise = supabase
          .from('user_desafio_atribuido')
          .select('desafio_id, created_at')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
        
        const result = await Promise.race([
          atribPromise,
          createTimeoutPromise(10000)
        ]) as any
        
        atribuicoes = result?.data
        atribError = result?.error
      } catch (error: any) {
        console.error('❌ [loadMeusDesafios] Timeout ou erro ao buscar atribuições:', error)
        atribError = error
        atribuicoes = null
      }

      if (atribError) {
        console.error('❌ [loadMeusDesafios] Erro ao buscar atribuições:', atribError)
        setMeusDesafios([])
        return
      }

      console.log('📋 [loadMeusDesafios] Atribuições encontradas:', atribuicoes?.length || 0, atribuicoes)

      if (!atribuicoes || atribuicoes.length === 0) {
        console.log('⚠️ [loadMeusDesafios] Nenhuma atribuição encontrada')
        setMeusDesafios([])
        return
      }

      const desafioIds = atribuicoes.map((a: any) => a.desafio_id)
      console.log('🎯 [loadMeusDesafios] IDs de desafios para buscar:', desafioIds)

      // Buscar detalhes dos desafios (com timeout)
      let desafios, desafiosError
      try {
        const desafiosPromise = supabase
          .from('desafios')
          .select('*')
          .in('id', desafioIds)
        
        const result = await Promise.race([
          desafiosPromise,
          createTimeoutPromise(10000)
        ]) as any
        
        desafios = result?.data
        desafiosError = result?.error
      } catch (error: any) {
        console.error('❌ [loadMeusDesafios] Timeout ou erro ao buscar desafios:', error)
        desafiosError = error
        desafios = null
      }

      if (desafiosError) {
        console.error('❌ [loadMeusDesafios] Erro ao buscar desafios:', desafiosError)
      } else {
        console.log('📚 [loadMeusDesafios] Desafios encontrados:', desafios?.length || 0)
      }

      // Buscar submissions do usuário (com timeout)
      let submissions, submissionsError
      try {
        const submissionsPromise = supabase
          .from('desafio_submissions')
          .select('*')
          .eq('user_id', authUser.id)
          .in('desafio_id', desafioIds)
          .order('created_at', { ascending: true })
        
        const result = await Promise.race([
          submissionsPromise,
          createTimeoutPromise(10000)
        ]) as any
        
        submissions = result?.data
        submissionsError = result?.error
      } catch (error: any) {
        console.error('❌ [loadMeusDesafios] Timeout ou erro ao buscar submissions:', error)
        submissionsError = error
        submissions = null
      }

      if (submissionsError) {
        console.error('❌ [loadMeusDesafios] Erro ao buscar submissions:', submissionsError)
      } else {
        console.log('📝 [loadMeusDesafios] Submissions encontradas:', submissions?.length || 0)
      }

      // Montar lista de "Meus Desafios"
      const meusDesafiosList: MeuDesafio[] = atribuicoes.map((atrib: any) => {
        const desafio = desafios?.find((d: any) => d.id === atrib.desafio_id)
        
        // Buscar todas as submissões para este desafio (para contar tentativas)
        const todasSubmissions = submissions?.filter((s: any) => s.desafio_id === atrib.desafio_id) || []
        
        // A submissão atual é a última (mais recente)
        const submission = todasSubmissions.length > 0 
          ? todasSubmissions[todasSubmissions.length - 1] 
          : undefined

        // Contar tentativas: número total de submissões (pendente, aprovado, rejeitado)
        // Desistir não conta como tentativa, apenas submissões reais
        const tentativas = todasSubmissions.filter((s: any) =>
          s.status === 'pendente' || s.status === 'aprovado' || s.status === 'rejeitado'
        ).length

        let status: MeuDesafio['status'] = 'pendente_envio'
        let dataConclusao: string | undefined = undefined
        
        if (submission) {
          if (submission.status === 'pendente') status = 'aguardando_aprovacao'
          else if (submission.status === 'aprovado') {
            status = 'aprovado'
            // Data de conclusão é a data de aprovação (reviewed_at) ou created_at se não tiver reviewed_at
            dataConclusao = submission.reviewed_at || submission.created_at
          }
          else if (submission.status === 'rejeitado') {
            status = 'rejeitado'
            // Para rejeitados, dataConclusao será a data de submissão (created_at)
            dataConclusao = submission.created_at
          }
          else if (submission.status === 'desistiu') status = 'desistiu'
        }

        return {
          id: atrib.desafio_id,
          desafio: desafio as DatabaseDesafio,
          atribuido_em: atrib.created_at,
          submission,
          status,
          dataConclusao,
          tentativas: tentativas || 0
        }
      }).filter((d: any) => {
        // Filtrar desafios que existem
        if (!d.desafio) return false
        // Filtrar desafios com status "desistiu" (casos antigos onde a atribuição não foi removida)
        // Desafios desistidos não devem aparecer na lista, pois a atribuição é removida ao desistir
        if (d.status === 'desistiu') return false
        return true
      })

      console.log('✅ [loadMeusDesafios] Lista final montada:', meusDesafiosList.length, 'desafios')
      setMeusDesafios(meusDesafiosList)
    } catch (err) {
      console.error('❌ [loadMeusDesafios] Erro ao carregar meus desafios:', err)
      setError('Erro ao carregar desafios. Tente recarregar a página.')
      setMeusDesafios([]) // Garantir que a lista está vazia em caso de erro
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [authUser?.id])

  useEffect(() => {
    loadMeusDesafios(true) // Primeiro carregamento com loading completo
  }, [loadMeusDesafios])

  // Rotacionar mensagens de loading a cada 3 segundos (20 mensagens = 60 segundos)
  useEffect(() => {
    if (!isGerando) {
      setLoadingMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => {
        // Ciclar pelas mensagens (20 mensagens x 3s = 60s total)
        return (prev + 1) % loadingMessages.length
      })
    }, 3000) // Mudar mensagem a cada 3 segundos

    return () => clearInterval(interval)
  }, [isGerando, loadingMessages.length])

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
    setLoadingMessageIndex(0) // Resetar mensagem ao iniciar

    try {
      console.log('🔐 Obtendo token para gerar desafio...')
      let token = await getAuthToken()
      
      // Se não conseguiu token, tentar uma última vez com getSession direto (pode travar, mas é última opção)
      if (!token) {
        console.log('🔄 Última tentativa: getSession() direto...')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          token = session?.access_token || null
          if (token) {
            console.log('✅ Token obtido na última tentativa')
          }
        } catch (e) {
          console.error('❌ Última tentativa falhou:', e)
        }
      }
      
      if (!token) {
        console.error('❌ Token não encontrado após todas as tentativas')
        setSelectionError('Não foi possível obter o token de autenticação. Por favor, faça logout e login novamente.')
        setIsGerando(false)
        return
      }

      const res = await fetch('/api/desafios/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tecnologia: selectedTecnologia, nivel: selectedNivel })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao gerar desafio')
      }

      // Fechar modal e mostrar feedback imediatamente
      setShowSelectionModal(false)
      setSuccess('🎯 Desafio gerado com sucesso!')
      setActiveTab('meus')
      
      // Recarregar desafios em background (sem bloquear UI)
      loadMeusDesafios(false).catch(err => {
        console.error('Erro ao recarregar desafios:', err)
        // Em caso de erro, tentar novamente após um delay
        setTimeout(() => loadMeusDesafios(false), 1000)
      })
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
      console.log('🔐 Obtendo token para submeter desafio...')
      let token = await getAuthToken()
      
      // Se não conseguiu token, tentar uma última vez com getSession direto
      if (!token) {
        console.log('🔄 Última tentativa: getSession() direto...')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          token = session?.access_token || null
          if (token) {
            console.log('✅ Token obtido na última tentativa')
          }
        } catch (e) {
          console.error('❌ Última tentativa falhou:', e)
        }
      }
      
      if (!token) {
        console.error('❌ Token não encontrado após todas as tentativas')
        setError('Não foi possível obter o token de autenticação. Por favor, faça logout e login novamente.')
        setIsSubmittingGithub(false)
        return
      }

      const res = await fetch(`/api/desafios/${desafioParaSubmeter.id}/submeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ github_url: githubUrl })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao submeter')
      }

      // Fechar modal e mostrar feedback imediatamente
      setSuccess('✅ Solução enviada! Aguarde a aprovação do admin.')
      setShowSubmitModal(false)
      setGithubUrl('')
      
      // Update otimista: marcar desafio como aguardando aprovação
      if (desafioParaSubmeter) {
        setMeusDesafios(prev => prev.map(d => 
          d.id === desafioParaSubmeter.id 
            ? { ...d, status: 'aguardando_aprovacao' as const }
            : d
        ))
      }
      setDesafioParaSubmeter(null)
      
      // Recarregar em background para garantir sincronização
      loadMeusDesafios(false).catch(err => console.error('Erro ao recarregar:', err))
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
      console.log('🔐 Obtendo token para desistir do desafio...')
      let token = await getAuthToken()
      
      // Se não conseguiu token, tentar uma última vez com getSession direto
      if (!token) {
        console.log('🔄 Última tentativa: getSession() direto...')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          token = session?.access_token || null
          if (token) {
            console.log('✅ Token obtido na última tentativa')
          }
        } catch (e) {
          console.error('❌ Última tentativa falhou:', e)
        }
      }
      
      if (!token) {
        console.error('❌ Token não encontrado após todas as tentativas')
        setError('Não foi possível obter o token de autenticação. Por favor, faça logout e login novamente.')
        setIsDesistindo(false)
        return
      }

      const res = await fetch(`/api/desafios/${desafioParaDesistir.id}/desistir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })

      const json = await res.json()
      if (!res.ok) {
        // Log de debug no console do navegador
        console.error('❌ [DEBUG DESISTIR] Erro ao desistir do desafio:', {
          error: json.error,
          debug: json.debug,
        })
        if (json.debug) {
          console.error('🔍 [DEBUG DESISTIR] Detalhes do erro:', {
            message: json.debug.message,
            code: json.debug.code,
            details: json.debug.details,
            hint: json.debug.hint,
          })
          if (json.debug.code === '42501') {
            console.error('💡 Dica: Verifique se a política RLS para desistir foi criada no banco')
          }
        }
        throw new Error(json?.error || 'Erro ao desistir')
      }
      
      // Log de sucesso
      console.log('✅ [DEBUG DESISTIR] Desistência realizada com sucesso:', json)

      // Fechar modal e mostrar feedback imediatamente
      setSuccess('⚠️ Você desistiu do desafio e perdeu 20 XP.')
      setShowDesistirModal(false)
      
      // Update otimista: marcar desafio como desistiu
      if (desafioParaDesistir) {
        setMeusDesafios(prev => prev.map(d => 
          d.id === desafioParaDesistir.id 
            ? { ...d, status: 'desistiu' as const }
            : d
        ))
      }
      setDesafioParaDesistir(null)
      
      // Recarregar em background para garantir sincronização
      loadMeusDesafios(false).catch(err => console.error('Erro ao recarregar:', err))
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
      {/* Indicador de refresh sutil (não bloqueia UI) */}
      {refreshing && (
        <div className={cn(
          "flex items-center justify-center gap-2 text-sm py-2",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Atualizando...</span>
        </div>
      )}
      
      {/* Modal de Seleção de Tecnologia e Nível */}
      <Modal 
        isOpen={showSelectionModal} 
        onClose={() => {
          if (!isGerando) {
            setShowSelectionModal(false)
            setSelectionError('')
          }
        }} 
        title={isGerando ? "Gerando Desafio" : "Selecione Tecnologia e Nível"} 
        size="md"
      >
        {isGerando ? (
          // Loading interativo com mensagens dinâmicas
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500",
                theme === 'dark'
                  ? "bg-yellow-500/20"
                  : "bg-yellow-100"
              )}>
                <Sparkles className={cn(
                  "w-10 h-10 animate-pulse",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )} />
              </div>
              
              <h3 className={cn(
                "text-xl font-bold mb-2 text-center transition-all duration-300 flex items-center justify-center gap-2",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )} key={loadingMessageIndex}>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>
                  {loadingMessages[loadingMessageIndex]?.emoji || '✨'}
                </span>
                <span>{loadingMessages[loadingMessageIndex]?.title || 'Gerando desafio...'}</span>
              </h3>
              
              <p className={cn(
                "text-sm text-center max-w-md mb-4 transition-all duration-300",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )} key={`subtitle-${loadingMessageIndex}`}>
                {loadingMessages[loadingMessageIndex]?.subtitle || 'Aguarde um momento...'}
                {selectedTecnologia && (
                  <> de <strong className={cn(
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )}>{selectedTecnologia}</strong> no nível <strong className={cn(
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )}>{selectedNivel === 'iniciante' ? 'Iniciante' : selectedNivel === 'intermediario' ? 'Intermediário' : 'Avançado'}</strong></>
                )}
              </p>
              
              <div className={cn(
                "w-full max-w-xs h-2 rounded-full overflow-hidden",
                theme === 'dark' ? "bg-white/10" : "bg-gray-200"
              )}>
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    theme === 'dark' ? "bg-yellow-500" : "bg-yellow-600"
                  )} 
                  style={{
                    width: `${Math.min(50 + (loadingMessageIndex * 2.5), 95)}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }} 
                />
              </div>
              
              <p className={cn(
                "text-xs text-center mt-4 animate-pulse",
                theme === 'dark' ? "text-gray-500" : "text-gray-500"
              )}>
                {loadingMessageIndex < 6 
                  ? "Isso pode levar alguns segundos..." 
                  : loadingMessageIndex < 14
                  ? "Quase terminando..."
                  : "Finalizando..."}
              </p>
            </div>
          </div>
        ) : (
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
        )}
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
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-yellow-500/10 border-yellow-400/50"
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
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-yellow-500/10 border-yellow-400/50"
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

      {/* Abas - Só mostra se tiver desafios */}
      {meusDesafios.length > 0 && (
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-1 transition-colors duration-300",
          theme === 'dark'
            ? "bg-gray-800/30 border-white/10"
            : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
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
      )}

      {/* Conteúdo das Abas */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        {meusDesafios.length === 0 || activeTab === 'gerar' ? (
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
                  Cada desafio vale 50 XP
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
                ? "bg-gray-800/30 border-white/10"
                : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
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
                  ? "bg-gray-800/30 border-white/10 text-gray-400"
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
                      ? "bg-gray-800/30 border-white/10 hover:border-yellow-400/50"
                      : "bg-yellow-500/10 border-yellow-400/90 shadow-md hover:border-yellow-500 hover:shadow-lg"
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
                        <span className={cn(
                          "font-semibold",
                          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                        )}>
                          Vale {meuDesafio.desafio.xp} XP
                        </span>
                        {/* Data de conclusão e tentativas para desafios aprovados */}
                        {meuDesafio.status === 'aprovado' && meuDesafio.dataConclusao && (
                          <>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                              Concluído em: {new Date(meuDesafio.dataConclusao).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {meuDesafio.tentativas > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                Tentativas: {meuDesafio.tentativas}
                              </span>
                            )}
                          </>
                        )}
                        {/* Data de submissão para desafios rejeitados */}
                        {meuDesafio.status === 'rejeitado' && meuDesafio.dataConclusao && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            Submetido em: {new Date(meuDesafio.dataConclusao).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
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
