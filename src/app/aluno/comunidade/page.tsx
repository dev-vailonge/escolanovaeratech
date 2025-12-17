'use client'

import { MessageSquare, ThumbsUp, Eye, CheckCircle2, Tag, Search, Plus, Filter, Edit, Trash2 } from 'lucide-react'
import { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { hasFullAccess } from '@/lib/types/auth'
import { getAuthToken } from '@/lib/getAuthToken'

type FilterOwner = 'all' | 'mine'
type FilterStatus = 'all' | 'answered' | 'unanswered'
type FilterTechnology = 'all' | 'HTML' | 'CSS' | 'JavaScript' | 'React' | 'Android' | 'Web Development'

interface Pergunta {
  id: string
  titulo: string
  descricao: string
  autor: {
    id: string
    nome: string
    nivel: number
    avatar?: string | null
  }
  tags: string[]
  votos: number
  respostas: number
  visualizacoes: number
  resolvida: boolean
  melhorRespostaId?: string | null
  categoria: string | null
  created_at: string
}

interface Resposta {
  id: string
  perguntaId: string
  conteudo: string
  autor: {
    id: string
    nome: string
    nivel: number
    avatar?: string | null
  }
  votos: number
  melhorResposta: boolean
  dataCriacao: string
}

export default function ComunidadePage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [respostas, setRespostas] = useState<Map<string, Resposta[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const { user } = useAuth()

  // Estados de filtro
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOwner, setFilterOwner] = useState<FilterOwner>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterTechnology, setFilterTechnology] = useState<FilterTechnology>('all')
  
  // Ref para preservar a posição do scroll
  const scrollPositionRef = useRef<number>(0)

  const currentUserId = user?.id

  // Estados para modais
  const [selectedPerguntaId, setSelectedPerguntaId] = useState<string | null>(null)
  const [showCriarPergunta, setShowCriarPergunta] = useState(false)
  const [showRespostas, setShowRespostas] = useState<string | null>(null)
  const [editingPerguntaId, setEditingPerguntaId] = useState<string | null>(null)
  
  // Estados para formulários
  const [respostaConteudo, setRespostaConteudo] = useState<string>('')
  const [perguntaTitulo, setPerguntaTitulo] = useState<string>('')
  const [perguntaDescricao, setPerguntaDescricao] = useState<string>('')
  const [perguntaTags, setPerguntaTags] = useState<string>('')
  const [perguntaCategoria, setPerguntaCategoria] = useState<string>('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [respostaMensagem, setRespostaMensagem] = useState<Map<string, string>>(new Map())

  // Buscar perguntas do banco
  const fetchPerguntas = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const params = new URLSearchParams()
      if (filterOwner === 'mine' && currentUserId) {
        params.append('autor_id', currentUserId)
      }
      if (filterStatus === 'answered') {
        params.append('resolvida', 'true')
      } else if (filterStatus === 'unanswered') {
        params.append('resolvida', 'false')
      }
      if (filterTechnology !== 'all') {
        params.append('categoria', filterTechnology)
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const res = await fetch(`/api/comunidade/perguntas?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()

      if (json.success && json.perguntas) {
        setPerguntas(json.perguntas)
      }
    } catch (e: any) {
      console.error('Erro ao buscar perguntas:', e)
    } finally {
      setLoading(false)
    }
  }

  // Buscar respostas de uma pergunta
  const fetchRespostas = async (perguntaId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`/api/comunidade/perguntas/${perguntaId}/respostas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()

      if (json.success && json.respostas) {
        setRespostas((prev) => {
          const newMap = new Map(prev)
          newMap.set(perguntaId, json.respostas)
          return newMap
        })
      }
    } catch (e: any) {
      console.error('Erro ao buscar respostas:', e)
    }
  }

  useEffect(() => {
    fetchPerguntas()
  }, [filterOwner, filterStatus, filterTechnology, searchQuery, currentUserId])

  const selectedPergunta = useMemo(
    () => perguntas.find((p) => p.id === selectedPerguntaId) || null,
    [perguntas, selectedPerguntaId]
  )

  const canCreate = hasFullAccess(user)

  const openResponder = (perguntaId: string) => {
    if (!canCreate) {
      setError('Apenas alunos com acesso completo podem responder perguntas.')
      return
    }
    setError('')
    setSuccess('')
    setRespostaConteudo('')
    setSelectedPerguntaId(perguntaId)
  }

  const submitResposta = async () => {
    if (!selectedPergunta) return
    setError('')
    setSuccess('')

    if (!user?.id) {
      setError('Você precisa estar logado para responder na comunidade.')
      return
    }

    if (!canCreate) {
      setError('Apenas alunos com acesso completo podem responder perguntas.')
      return
    }

    const conteudo = respostaConteudo.trim()
    if (conteudo.length < 3) {
      setError('Sua resposta está muito curta (mínimo 3 caracteres).')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('🔐 Obtendo token para responder...')
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
        setError('Não foi possível obter o token de autenticação. Por favor, faça logout e login novamente.')
        setIsSubmitting(false)
        return
      }

      console.log('📤 Enviando resposta para pergunta:', selectedPergunta.id)
      const res = await fetch(`/api/comunidade/perguntas/${selectedPergunta.id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conteudo }),
      })
      
      console.log('📥 Resposta recebida:', res.status, res.statusText)
      const json = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        console.error('❌ Erro na resposta:', json)
        throw new Error(json?.error || `Erro ${res.status}: Falha ao enviar resposta`)
      }

      setSuccess('✅ Resposta enviada! O autor da pergunta pode marcar como válida para você ganhar XP.')
      setRespostaConteudo('')
      setSelectedPerguntaId(null)
      await fetchPerguntas()
      await fetchRespostas(selectedPergunta.id)
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar resposta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitPergunta = async () => {
    console.log('🎯 [FRONTEND] submitPergunta chamada!')
    setError('')
    setSuccess('')

    if (!user?.id) {
      console.warn('⚠️ [FRONTEND] Usuário não logado')
      setError('Você precisa estar logado para criar perguntas.')
      return
    }

    if (!canCreate) {
      console.warn('⚠️ [FRONTEND] Usuário sem acesso full')
      setError('Apenas alunos com acesso completo podem criar perguntas.')
      return
    }
    
    console.log('✅ [FRONTEND] Validações passadas, usuário:', { id: user.id, canCreate })

    const titulo = perguntaTitulo.trim()
    const descricao = perguntaDescricao.trim()
    const tags = perguntaTags.split(',').map((t) => t.trim()).filter(Boolean)
    const categoria = perguntaCategoria.trim() || null

    if (titulo.length < 3) {
      setError('Título muito curto (mínimo 3 caracteres).')
      return
    }

    if (descricao.length < 10) {
      setError('Descrição muito curta (mínimo 10 caracteres).')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      console.log('🚀 Iniciando criação de pergunta...')
      console.log('📝 Dados:', { titulo, descricao, tags, categoria })
      
      console.log('🔐 Obtendo token de autenticação...')
      const token = await getAuthToken()
      
      if (!token) {
        console.error('❌ Token não encontrado')
        setError('Não foi possível obter o token de autenticação. Por favor, recarregue a página e tente novamente.')
        setIsSubmitting(false)
        return
      }
      
      console.log('✅ Token obtido:', `${token.substring(0, 20)}...`)

      console.log('✅ Token obtido, preparando requisição...')
      console.log('📤 Payload:', JSON.stringify({ titulo, descricao, tags, categoria }))

      // Adicionar timeout para evitar travamento
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Timeout após 30 segundos')
        controller.abort()
      }, 30000) // 30 segundos

      let res: Response
      try {
        console.log('🌐 Fazendo fetch para /api/comunidade/perguntas...')
        res = await fetch('/api/comunidade/perguntas', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ titulo, descricao, tags, categoria }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        console.log('📥 Fetch concluído, status:', res.status)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        console.error('❌ Erro no fetch:', fetchError)
        if (fetchError.name === 'AbortError') {
          console.error('❌ Requisição timeout (30s)')
          setError('A requisição demorou muito. Tente novamente.')
          setIsSubmitting(false)
          return
        }
        throw fetchError
      }
      
      console.log('📥 Resposta recebida:', { status: res.status, statusText: res.statusText, ok: res.ok })
      
      let json: any = {}
      try {
        const text = await res.text()
        console.log('📄 Texto da resposta:', text)
        json = text ? JSON.parse(text) : {}
        console.log('📦 JSON parseado:', json)
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta:', parseError)
        setError('Erro ao processar resposta do servidor.')
        setIsSubmitting(false)
        return
      }

      if (!res.ok) {
        const errorMsg = json?.error || json?.details || `Erro ${res.status}: ${res.statusText}`
        console.error('❌ Erro na resposta:', { status: res.status, error: errorMsg, json })
        setError(errorMsg)
        setIsSubmitting(false)
        return
      }

      if (!json.success) {
        const errorMsg = json?.error || 'Falha ao criar pergunta'
        console.error('❌ Resposta sem sucesso:', json)
        setError(errorMsg)
        setIsSubmitting(false)
        return
      }

      console.log('✅ Pergunta criada com sucesso!', json.pergunta)
      setSuccess('✅ Pergunta criada com sucesso!')
      setPerguntaTitulo('')
      setPerguntaDescricao('')
      setPerguntaTags('')
      setPerguntaCategoria('')
      setShowCriarPergunta(false)
      await fetchPerguntas()
    } catch (e: any) {
      console.error('❌ Exceção ao criar pergunta:', e)
      console.error('Stack:', e.stack)
      setError(e?.message || 'Erro inesperado ao criar pergunta. Tente novamente.')
    } finally {
      console.log('🏁 Finalizando (setIsSubmitting(false))')
      setIsSubmitting(false)
    }
  }

  const votarResposta = async (respostaId: string, perguntaId: string) => {
    if (!user?.id) {
      setError('Você precisa estar logado para votar.')
      return
    }

    setError('')
    setSuccess('')

    try {
      console.log('🔐 Obtendo token para votar...')
      let token = await getAuthToken()
      
      // Se não conseguiu token, tentar uma última vez
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
        setError('Não foi possível obter o token de autenticação. Por favor, recarregue a página e tente novamente.')
        return
      }

      console.log('📤 Enviando voto para resposta:', respostaId)
      const res = await fetch(`/api/comunidade/respostas/${respostaId}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      
      const json = await res.json().catch(() => ({}))
      console.log('📥 Resposta do voto:', json)
      
      if (!res.ok) {
        // Se a resposta já está marcada, mostrar mensagem apenas no card da resposta
        if (res.status === 400 && json.error) {
          // Limpar qualquer erro/sucesso anterior do banner
          setError('')
          setSuccess('')
          // Mostrar mensagem apenas no card da resposta
          setRespostaMensagem((prev) => {
            const newMap = new Map(prev)
            newMap.set(respostaId, json.error)
            return newMap
          })
          // Limpar mensagem após 5 segundos
          setTimeout(() => {
            setRespostaMensagem((prev) => {
              const newMap = new Map(prev)
              newMap.delete(respostaId)
              return newMap
            })
          }, 5000)
        } else {
          setError(json?.error || 'Falha ao votar')
          setSuccess('')
        }
        return
      }

      if (json.marcada) {
        // Usar a mensagem da API se disponível, senão usar a padrão
        const mensagem = json.mensagem || `✅ Resposta marcada como válida! O autor ganhou ${json.xp || 0} XP.`
        setSuccess(mensagem)
        // Limpar mensagem do card quando marcar com sucesso
        setRespostaMensagem((prev) => {
          const newMap = new Map(prev)
          newMap.delete(respostaId)
          return newMap
        })
      } else {
        setSuccess('Resposta marcada como válida.')
      }

      await fetchPerguntas()
      await fetchRespostas(perguntaId)
    } catch (e: any) {
      console.error('❌ Erro ao votar:', e)
      setError(e?.message || 'Erro ao votar')
    }
  }

  const toggleRespostas = async (perguntaId: string) => {
    if (showRespostas === perguntaId) {
      setShowRespostas(null)
    } else {
      setShowRespostas(perguntaId)
      if (!respostas.has(perguntaId)) {
        await fetchRespostas(perguntaId)
      }
    }
  }

  const iniciarEdicao = (pergunta: Pergunta) => {
    setEditingPerguntaId(pergunta.id)
    setPerguntaTitulo(pergunta.titulo)
    setPerguntaDescricao(pergunta.descricao)
    setPerguntaTags(pergunta.tags.join(', '))
    setPerguntaCategoria(pergunta.categoria || '')
    setError('')
    setSuccess('')
  }

  const cancelarEdicao = () => {
    setEditingPerguntaId(null)
    setPerguntaTitulo('')
    setPerguntaDescricao('')
    setPerguntaTags('')
    setPerguntaCategoria('')
    setError('')
    setSuccess('')
  }

  const salvarEdicao = async () => {
    if (!editingPerguntaId) return

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')

      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação. Por favor, recarregue a página e tente novamente.')
        return
      }

      const tagsArray = perguntaTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const res = await fetch(`/api/comunidade/perguntas/${editingPerguntaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: perguntaTitulo,
          descricao: perguntaDescricao,
          tags: tagsArray,
          categoria: perguntaCategoria || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao editar pergunta')
      }

      setSuccess('Pergunta editada com sucesso!')
      cancelarEdicao()
      await fetchPerguntas()
    } catch (e: any) {
      console.error('❌ Erro ao editar pergunta:', e)
      setError(e?.message || 'Erro ao editar pergunta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const excluirPergunta = async (perguntaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')

      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação. Por favor, recarregue a página e tente novamente.')
        return
      }

      const res = await fetch(`/api/comunidade/perguntas/${perguntaId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao excluir pergunta')
      }

      setSuccess('Pergunta excluída com sucesso!')
      await fetchPerguntas()
    } catch (e: any) {
      console.error('❌ Erro ao excluir pergunta:', e)
      setError(e?.message || 'Erro ao excluir pergunta')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função utilitária para filtrar perguntas (filtros adicionais no frontend)
  const filteredPerguntas = useMemo(() => {
    return perguntas.filter((pergunta) => {
      // Filtro por tecnologia (tags)
      if (filterTechnology !== 'all') {
        const techLower = filterTechnology.toLowerCase()
        const categoriaMatch = pergunta.categoria?.toLowerCase().includes(techLower)
        const tagsMatch = pergunta.tags.some(tag => 
          tag.toLowerCase().includes(techLower) ||
          (techLower === 'javascript' && tag.toLowerCase().includes('js'))
        )
        
        if (!categoriaMatch && !tagsMatch) {
          return false
        }
      }

      return true
    })
  }, [perguntas, filterTechnology])

  // Restaura a posição do scroll após a renderização
  useLayoutEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
    }
  }, [filteredPerguntas])

  const perguntasResolvidas = filteredPerguntas.filter(p => p.resolvida).length
  const perguntasAbertas = filteredPerguntas.filter(p => !p.resolvida).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className={cn(
            "animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4",
            theme === 'dark' ? "border-yellow-400" : "border-yellow-600"
          )} />
          <p className={cn(
            "text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Carregando perguntas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Modal de Criar Pergunta */}
      <Modal
        isOpen={showCriarPergunta}
        onClose={() => {
          setShowCriarPergunta(false)
          setError('')
          setSuccess('')
        }}
        title="Fazer Pergunta"
        size="md"
      >
        <div className="space-y-4">
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
          
          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Título *
            </label>
            <input
              type="text"
              value={perguntaTitulo}
              onChange={(e) => setPerguntaTitulo(e.target.value)}
              placeholder="Ex: Como centralizar um div com CSS?"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Descrição *
            </label>
            <textarea
              value={perguntaDescricao}
              onChange={(e) => setPerguntaDescricao(e.target.value)}
              placeholder="Descreva sua pergunta em detalhes..."
              rows={5}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={perguntaTags}
              onChange={(e) => setPerguntaTags(e.target.value)}
              placeholder="css, html, layout"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Categoria
            </label>
            <select
              value={perguntaCategoria}
              onChange={(e) => setPerguntaCategoria(e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              )}
            >
              <option value="">Selecione uma categoria</option>
              <option value="HTML">HTML</option>
              <option value="CSS">CSS</option>
              <option value="JavaScript">JavaScript</option>
              <option value="React">React</option>
              <option value="Android">Android</option>
              <option value="Web Development">Web Development</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium',
                theme === 'dark'
                  ? 'border-white/10 text-gray-300 hover:bg-white/5'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
              onClick={() => setShowCriarPergunta(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={submitPergunta} disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Pergunta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Editar Pergunta */}
      <Modal
        isOpen={!!editingPerguntaId}
        onClose={cancelarEdicao}
        title="Editar Pergunta"
        size="md"
      >
        <div className="space-y-4">
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
          
          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Título *
            </label>
            <input
              type="text"
              value={perguntaTitulo}
              onChange={(e) => setPerguntaTitulo(e.target.value)}
              placeholder="Ex: Como centralizar um div com CSS?"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Descrição *
            </label>
            <textarea
              value={perguntaDescricao}
              onChange={(e) => setPerguntaDescricao(e.target.value)}
              placeholder="Descreva sua pergunta em detalhes..."
              rows={6}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={perguntaTags}
              onChange={(e) => setPerguntaTags(e.target.value)}
              placeholder="Ex: css, html, layout"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1 block', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Categoria
            </label>
            <select
              value={perguntaCategoria}
              onChange={(e) => setPerguntaCategoria(e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              )}
            >
              <option value="">Selecione uma categoria</option>
              <option value="HTML">HTML</option>
              <option value="CSS">CSS</option>
              <option value="JavaScript">JavaScript</option>
              <option value="React">React</option>
              <option value="Android">Android</option>
              <option value="Web Development">Web Development</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={cancelarEdicao}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'border-white/10 text-gray-300 hover:bg-white/5'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={salvarEdicao}
              className="btn-primary flex-1"
              disabled={isSubmitting || !perguntaTitulo.trim() || !perguntaDescricao.trim()}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Responder */}
      <Modal
        isOpen={!!selectedPergunta}
        onClose={() => setSelectedPerguntaId(null)}
        title="Responder na comunidade"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>Pergunta</p>
            <p className={cn('font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              {selectedPergunta?.titulo}
            </p>
          </div>

          <textarea
            value={respostaConteudo}
            onChange={(e) => setRespostaConteudo(e.target.value)}
            placeholder="Escreva sua resposta..."
            rows={6}
            className={cn(
              'w-full px-3 py-2 rounded-lg border text-sm',
              theme === 'dark'
                ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            )}
          />

          <div className="flex items-center justify-between gap-3">
            <button
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium',
                theme === 'dark'
                  ? 'border-white/10 text-gray-300 hover:bg-white/5'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
              onClick={() => setSelectedPerguntaId(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={submitResposta} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Comunidade
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Faça perguntas e ajude outros alunos
          </p>
        </div>
        {canCreate && (
          <button 
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={() => setShowCriarPergunta(true)}
          >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base">Fazer Pergunta</span>
        </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
            <div className="text-center md:text-left">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {filteredPerguntas.length}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Perguntas
              </p>
            </div>
          </div>
        </div>
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
            <div className="text-center md:text-left">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {perguntasResolvidas}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Resolvidas
              </p>
            </div>
          </div>
        </div>
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3">
            <MessageSquare className={cn(
              "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )} />
            <div className="text-center md:text-left">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {perguntasAbertas}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Abertas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Campo de Busca */}
        <div className="flex-1 relative">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5",
            theme === 'dark' ? "text-gray-400" : "text-gray-500"
          )} />
          <input
            type="text"
            placeholder="Buscar perguntas..."
            value={searchQuery}
            onChange={(e) => {
              scrollPositionRef.current = window.scrollY
              setSearchQuery(e.target.value)
            }}
            className={cn(
              "w-full pl-9 md:pl-10 pr-4 py-2 text-sm md:text-base backdrop-blur-md border rounded-lg focus:outline-none transition-colors duration-300",
              theme === 'dark'
                ? "bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-yellow-400/50"
                : "bg-white border-yellow-400/90 text-gray-900 placeholder-gray-400 focus:border-yellow-500 shadow-sm"
            )}
          />
        </div>

        {/* Filtro por Tecnologia */}
        <select
          value={filterTechnology}
          onChange={(e) => {
            scrollPositionRef.current = window.scrollY
            setFilterTechnology(e.target.value as FilterTechnology)
          }}
          className={cn(
            "px-3 md:px-4 py-2 text-sm md:text-base backdrop-blur-md border rounded-lg focus:outline-none transition-colors duration-300",
            theme === 'dark'
              ? "bg-black/20 border-white/10 text-white focus:border-yellow-400/50"
              : "bg-white border-yellow-400/90 text-gray-900 focus:border-yellow-500 shadow-sm"
          )}
        >
          <option value="all">Todas as tecnologias</option>
          <option value="HTML">HTML</option>
          <option value="CSS">CSS</option>
          <option value="JavaScript">JavaScript</option>
          <option value="React">React</option>
          <option value="Android">Android</option>
          <option value="Web Development">Web Development</option>
        </select>

        {/* Filtro por Owner */}
        <select
          value={filterOwner}
          onChange={(e) => {
            scrollPositionRef.current = window.scrollY
            setFilterOwner(e.target.value as FilterOwner)
          }}
          className={cn(
            "px-3 md:px-4 py-2 text-sm md:text-base backdrop-blur-md border rounded-lg focus:outline-none transition-colors duration-300",
            theme === 'dark'
              ? "bg-black/20 border-white/10 text-white focus:border-yellow-400/50"
              : "bg-white border-yellow-400/90 text-gray-900 focus:border-yellow-500 shadow-sm"
          )}
        >
          <option value="all">Todas</option>
          <option value="mine">Minhas perguntas</option>
        </select>

        {/* Filtro por Status */}
        <select
          value={filterStatus}
          onChange={(e) => {
            scrollPositionRef.current = window.scrollY
            setFilterStatus(e.target.value as FilterStatus)
          }}
          className={cn(
            "px-3 md:px-4 py-2 text-sm md:text-base backdrop-blur-md border rounded-lg focus:outline-none transition-colors duration-300",
            theme === 'dark'
              ? "bg-black/20 border-white/10 text-white focus:border-yellow-400/50"
              : "bg-white border-yellow-400/90 text-gray-900 focus:border-yellow-500 shadow-sm"
          )}
        >
          <option value="all">Todas</option>
          <option value="answered">Respondidas</option>
          <option value="unanswered">Sem resposta</option>
        </select>
      </div>

      {/* Lista de Perguntas */}
      <div className="space-y-3 md:space-y-4">
        {filteredPerguntas.length === 0 ? (
          <div className={cn(
            "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center",
            theme === 'dark'
              ? "bg-black/20 border-white/10"
              : "bg-white border-yellow-400/90 shadow-md"
          )}>
            <Filter className={cn(
              "w-12 h-12 md:w-16 md:h-16 mx-auto mb-4",
              theme === 'dark' ? "text-gray-500" : "text-gray-400"
            )} />
            <h3 className={cn(
              "text-lg md:text-xl font-semibold mb-2",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Nenhuma pergunta encontrada
            </h3>
            <p className={cn(
              "text-sm md:text-base",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              {searchQuery || filterOwner !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros ou a busca para encontrar mais perguntas.'
                : 'Ainda não há perguntas na comunidade. Seja o primeiro a fazer uma pergunta!'}
            </p>
          </div>
        ) : (
          filteredPerguntas.map((pergunta) => {
            const respostasDaPergunta = respostas.get(pergunta.id) || []
          const melhorResposta = respostasDaPergunta.find(r => r.melhorResposta)
            const isOwner = pergunta.autor.id === currentUserId

          return (
            <div
              key={pergunta.id}
              className={cn(
                "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300",
                pergunta.resolvida
                  ? theme === 'dark'
                    ? "bg-black/20 border-green-500/30 hover:border-green-400/50"
                    : "bg-green-50 border-green-400/90 shadow-md hover:shadow-lg"
                  : theme === 'dark'
                    ? "bg-black/20 border-white/10 hover:border-yellow-400/50"
                    : "bg-white border-yellow-400/90 shadow-md hover:border-yellow-500 hover:shadow-lg"
              )}
            >
              <div className="flex gap-3 md:gap-4">
                {/* Votes */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className={cn(
                    "flex flex-col items-center p-2 md:p-3 backdrop-blur-sm rounded-lg border",
                    theme === 'dark'
                      ? "bg-black/30 border-white/10"
                      : "bg-gray-50 border-gray-200"
                  )}>
                    <ThumbsUp className={cn(
                      "w-4 h-4 md:w-5 md:h-5",
                      theme === 'dark' ? "text-gray-400" : "text-gray-500"
                    )} />
                    <span className={cn(
                      "font-semibold mt-1 text-xs md:text-sm",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      {pergunta.votos}
                    </span>
                  </div>
                  {pergunta.resolvida && (
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className={cn(
                      "text-base md:text-lg font-semibold cursor-pointer line-clamp-2 transition-colors flex-1",
                      theme === 'dark'
                        ? "text-white hover:text-yellow-400"
                        : "text-gray-900 hover:text-yellow-600"
                    )}>
                      {pergunta.titulo}
                    </h3>
                    {/* Botões de editar/excluir - apenas se for o dono e não tiver respostas */}
                    {isOwner && pergunta.respostas === 0 && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => iniciarEdicao(pergunta)}
                          className={cn(
                            "p-1.5 rounded border transition-colors",
                            theme === 'dark'
                              ? "border-white/20 text-gray-300 hover:bg-white/10 hover:text-yellow-400"
                              : "border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-yellow-600"
                          )}
                          title="Editar pergunta"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => excluirPergunta(pergunta.id)}
                          className={cn(
                            "p-1.5 rounded border transition-colors",
                            theme === 'dark'
                              ? "border-white/20 text-gray-300 hover:bg-red-500/20 hover:text-red-400"
                              : "border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600"
                          )}
                          title="Excluir pergunta"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className={cn(
                    "text-sm md:text-base mb-3 md:mb-4 line-clamp-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {pergunta.descricao}
                  </p>
                  
                  <div className={cn(
                    "flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-3",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="whitespace-nowrap">{pergunta.visualizacoes} visualizações</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="whitespace-nowrap">{pergunta.respostas} respostas</span>
                    </div>
                    <span className="flex items-center gap-1 truncate">
                      <div className={cn(
                        "w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        theme === 'dark'
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                          : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
                      )}>
                        {pergunta.autor.nome.charAt(0)}
                      </div>
                      <span className="truncate">{pergunta.autor.nome} • Nível {pergunta.autor.nivel}</span>
                    </span>
                  </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                    {pergunta.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 text-xs rounded border",
                          theme === 'dark'
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        )}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                    <div className="flex items-center gap-2">
                      {canCreate && (
                    <button className="btn-primary" onClick={() => openResponder(pergunta.id)}>
                      Responder
                    </button>
                      )}
                      <button
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm border",
                          theme === 'dark'
                            ? "border-white/10 text-gray-300 hover:bg-white/5"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                        onClick={() => toggleRespostas(pergunta.id)}
                      >
                        {showRespostas === pergunta.id ? 'Ocultar' : 'Ver'} Respostas ({pergunta.respostas})
                    </button>
                  </div>

                    {/* Lista de Respostas */}
                    {showRespostas === pergunta.id && (
                      <div className="mt-4 space-y-3 pt-4 border-t border-white/10">
                        {respostasDaPergunta.length === 0 ? (
                          <p className={cn(
                            "text-sm text-center py-4",
                            theme === 'dark' ? "text-gray-400" : "text-gray-600"
                          )}>
                            Ainda não há respostas para esta pergunta.
                          </p>
                        ) : (
                          respostasDaPergunta.map((resposta) => (
                            <div
                              key={resposta.id}
                              className={cn(
                                "p-3 rounded-lg border",
                                resposta.melhorResposta
                                  ? theme === 'dark'
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-green-50 border-green-300"
                                  : theme === 'dark'
                                    ? "bg-black/30 border-white/10"
                                    : "bg-gray-50 border-gray-200"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                  <ThumbsUp className={cn(
                                    "w-4 h-4",
                                    resposta.melhorResposta
                                      ? "text-green-500"
                                      : theme === 'dark' ? "text-gray-400" : "text-gray-500"
                                  )} />
                                  {resposta.melhorResposta && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  )}
                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        theme === 'dark'
                                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                                          : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
                                      )}>
                                        {resposta.autor.nome.charAt(0)}
                                      </div>
                                      <span className={cn(
                                        "text-xs font-medium",
                                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                                      )}>
                                        {resposta.autor.nome} • Nível {resposta.autor.nivel}
                                      </span>
                                    </div>
                                    {isOwner && !resposta.melhorResposta && canCreate && (
                                      <button
                                        className={cn(
                                          "px-2 py-1 text-xs rounded border flex items-center gap-1",
                                          theme === 'dark'
                                            ? "border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                                            : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                                        )}
                                        onClick={() => votarResposta(resposta.id, pergunta.id)}
                                      >
                                        <ThumbsUp className="w-3 h-3" />
                                        Marcar como válida
                                      </button>
                                    )}
                                    {isOwner && resposta.melhorResposta && (
                                      <span
                                        className={cn(
                                          "px-2 py-1 text-xs rounded border flex items-center gap-1",
                                          theme === 'dark'
                                            ? "border-green-500/50 text-green-400 bg-green-500/10"
                                            : "border-green-300 text-green-700 bg-green-50"
                                        )}
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Resposta válida
                                      </span>
                                    )}
                                  </div>
                                  {respostaMensagem.has(resposta.id) && (
                                    <div
                                      className={cn(
                                        "mb-2 p-2 rounded text-xs border",
                                        theme === 'dark'
                                          ? "bg-green-500/10 border-green-500/30 text-green-300"
                                          : "bg-green-50 border-green-200 text-green-700"
                                      )}
                                    >
                                      {respostaMensagem.get(resposta.id)}
                                    </div>
                                  )}
                                  <p className={cn(
                                    "text-sm whitespace-pre-wrap",
                                    theme === 'dark' ? "text-gray-300" : "text-gray-700"
                                  )}>
                                    {resposta.conteudo}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                  </div>
                    )}
                </div>
              </div>
            </div>
          )
          })
        )}
      </div>
    </div>
  )
}
