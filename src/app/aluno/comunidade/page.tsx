'use client'

import { mockPerguntas, mockRespostas } from '@/data/aluno/mockComunidade'
import { MessageSquare, ThumbsUp, Eye, CheckCircle2, Tag, Search, Plus, Filter } from 'lucide-react'
import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'

type FilterOwner = 'all' | 'mine'
type FilterStatus = 'all' | 'answered' | 'unanswered'
type FilterTechnology = 'all' | 'HTML' | 'CSS' | 'JavaScript' | 'React' | 'Android' | 'Web Development'

export default function ComunidadePage() {
  const [perguntas] = useState(mockPerguntas)
  const [respostas, setRespostas] = useState(mockRespostas)
  const { theme } = useTheme()
  const { user } = useAuth()

  // Estados de filtro
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOwner, setFilterOwner] = useState<FilterOwner>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterTechnology, setFilterTechnology] = useState<FilterTechnology>('all')
  
  // Ref para preservar a posição do scroll
  const scrollPositionRef = useRef<number>(0)

  // ID do usuário atual (fallback para modo mockado)
  // TODO: Substituir por user?.id quando autenticação estiver totalmente implementada
  const currentUserId = user?.id || 'user1' // user1 é um ID mockado para demonstração

  const [selectedPerguntaId, setSelectedPerguntaId] = useState<string | null>(null)
  const [respostaConteudo, setRespostaConteudo] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const selectedPergunta = useMemo(
    () => perguntas.find((p) => p.id === selectedPerguntaId) || null,
    [perguntas, selectedPerguntaId]
  )

  const openResponder = (perguntaId: string) => {
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

    const conteudo = respostaConteudo.trim()
    if (conteudo.length < 3) {
      setError('Sua resposta está muito curta.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      const res = await fetch(`/api/comunidade/perguntas/${selectedPergunta.id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conteudo }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Falha ao enviar resposta')

      // Atualiza lista local (UI ainda é mockada)
      setRespostas((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          perguntaId: selectedPergunta.id,
          autor: {
            id: user.id,
            nome: user.name,
            nivel: 1,
          },
          conteudo,
          votos: 0,
          melhorResposta: false,
          data: new Date().toISOString(),
        } as any,
      ])

      const xp = json?.result?.xp ?? 20
      setSuccess(`✅ Resposta enviada! Você ganhou ${xp} XP.`)
      setSelectedPerguntaId(null)
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar resposta')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função utilitária para filtrar perguntas
  const filteredPerguntas = useMemo(() => {
    return perguntas.filter((pergunta) => {
      // Filtro por owner
      if (filterOwner === 'mine' && pergunta.autor.id !== currentUserId) {
        return false
      }

      // Filtro por status
      if (filterStatus === 'answered' && pergunta.respostas === 0) {
        return false
      }
      if (filterStatus === 'unanswered' && pergunta.respostas > 0) {
        return false
      }

      // Filtro por tecnologia
      if (filterTechnology !== 'all') {
        const techLower = filterTechnology.toLowerCase()
        const categoriaMatch = pergunta.categoria.toLowerCase().includes(techLower)
        const tagsMatch = pergunta.tags.some(tag => 
          tag.toLowerCase().includes(techLower) ||
          (techLower === 'javascript' && tag.toLowerCase().includes('js'))
        )
        
        if (!categoriaMatch && !tagsMatch) {
          return false
        }
      }

      // Filtro por busca (título + descrição)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = pergunta.titulo.toLowerCase().includes(query)
        const matchesDescription = pergunta.descricao.toLowerCase().includes(query)
        const matchesTags = pergunta.tags.some(tag => tag.toLowerCase().includes(query))
        
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false
        }
      }

      return true
    })
  }, [perguntas, filterOwner, filterStatus, filterTechnology, searchQuery, currentUserId])

  // Restaura a posição do scroll após a renderização (antes da pintura)
  useLayoutEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
    }
  }, [filteredPerguntas])

  const perguntasResolvidas = filteredPerguntas.filter(p => p.resolvida).length
  const perguntasAbertas = filteredPerguntas.filter(p => !p.resolvida).length

  return (
    <div className="space-y-4 md:space-y-6">
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
            className={cn(
              'w-full min-h-[120px] px-3 py-2 rounded-lg border text-sm',
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
              {isSubmitting ? 'Enviando...' : 'Enviar e ganhar XP'}
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
        <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base">Fazer Pergunta</span>
        </button>
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
          const respostasDaPergunta = respostas.filter(r => r.perguntaId === pergunta.id)
          const melhorResposta = respostasDaPergunta.find(r => r.melhorResposta)

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
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={cn(
                      "text-base md:text-lg font-semibold cursor-pointer line-clamp-2 transition-colors",
                      theme === 'dark'
                        ? "text-white hover:text-yellow-400"
                        : "text-gray-900 hover:text-yellow-600"
                    )}>
                      {pergunta.titulo}
                    </h3>
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

                  <div className="flex items-center gap-2 flex-wrap">
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

                  <div className="mt-4 flex items-center gap-2">
                    <button className="btn-primary" onClick={() => openResponder(pergunta.id)}>
                      Responder
                    </button>
                  </div>
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

