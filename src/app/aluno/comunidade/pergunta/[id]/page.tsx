'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ThumbsUp, CheckCircle2, Eye, MessageSquare, Tag, Send, Trash2, Folder, ArrowUpDown } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { getAuthToken } from '@/lib/getAuthToken'
import { hasFullAccess } from '@/lib/types/auth'
import BadgeDisplay from '@/components/comunidade/BadgeDisplay'
import CommentThread from '@/components/comunidade/CommentThread'
import QuestionImageUpload from '@/components/comunidade/QuestionImageUpload'
import { getUserBadges } from '@/lib/badges'

interface Autor {
  id: string
  nome: string
  nivel: number
  avatar?: string | null
}

interface Comentario {
  id: string
  conteudo: string
  mencoes: string[]
  dataCriacao: string
  imagemUrl?: string | null
  autor: Autor | null
}

interface Resposta {
  id: string
  perguntaId: string
  conteudo: string
  votos: number
  melhorResposta: boolean
  dataCriacao: string
  imagemUrl?: string | null
  comentarios: Comentario[]
  autor: Autor | null
}

interface Pergunta {
  id: string
  titulo: string
  descricao: string
  autor: Autor | null
  tags: string[]
  votos: number
  visualizacoes: number
  resolvida: boolean
  melhorRespostaId?: string | null
  categoria: string | null
  imagemUrl?: string | null
  created_at: string
  respostas: Resposta[]
  curtida?: boolean
}

export default function PerguntaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const [pergunta, setPergunta] = useState<Pergunta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [respostaConteudo, setRespostaConteudo] = useState('')
  const [respostaImagem, setRespostaImagem] = useState<File | null>(null)
  const [respostaImagemResetTrigger, setRespostaImagemResetTrigger] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set())
  const [badgesMap, setBadgesMap] = useState<Map<string, string[]>>(new Map())
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const visualizacaoRegistrada = useRef(false)
  const [ordenacaoRespostas, setOrdenacaoRespostas] = useState<'mais_nova' | 'mais_antiga'>('mais_nova')

  // Estados para autocomplete de menções
  const [mentionUsers, setMentionUsers] = useState<Array<{ id: string; name: string; avatar_url?: string | null }>>([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const respostaTextareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionDropdownRef = useRef<HTMLDivElement>(null)

  const canCreate = hasFullAccess(user)
  const currentUserId = user?.id

  // Buscar pergunta
  useEffect(() => {
    const fetchPergunta = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/comunidade/perguntas/${params.id}`)
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.error || 'Erro ao buscar pergunta')
        }

        if (json.success && json.pergunta) {
          setPergunta(json.pergunta)

          // Buscar badges dos autores
          const userIds = new Set<string>()
          if (json.pergunta.autor?.id) userIds.add(json.pergunta.autor.id)
          json.pergunta.respostas?.forEach((r: Resposta) => {
            if (r.autor?.id) userIds.add(r.autor.id)
            r.comentarios?.forEach((c: Comentario) => {
              if (c.autor?.id) userIds.add(c.autor.id)
            })
          })

          const badges = new Map<string, string[]>()
          const token = await getAuthToken()
          for (const userId of userIds) {
            const userBadges = await getUserBadges(userId, token || undefined)
            badges.set(userId, userBadges.map((b) => b.type))
          }
          setBadgesMap(badges)
        }
      } catch (e: any) {
        console.error('Erro ao buscar pergunta:', e)
        setError(e?.message || 'Erro ao carregar pergunta')
      } finally {
        setLoading(false)
      }
    }

    fetchPergunta()
  }, [params.id])

  // Registrar visualização apenas uma vez por carregamento da página
  useEffect(() => {
    if (pergunta && !visualizacaoRegistrada.current) {
      visualizacaoRegistrada.current = true
      fetch(`/api/comunidade/perguntas/${pergunta.id}/visualizar`, { method: 'POST' })
        .then((res) => {
          if (res.ok) {
            return res.json()
          }
        })
        .then((json) => {
          if (json?.success && json?.visualizacoes !== undefined) {
            setPergunta((prev) => prev ? { ...prev, visualizacoes: json.visualizacoes } : null)
          }
        })
        .catch(() => {})
    }
  }, [pergunta])

  const handleVoltar = () => {
    // Preservar query params se houver
    const queryString = searchParams.toString()
    const url = queryString ? `/aluno/comunidade?${queryString}` : '/aluno/comunidade'
    router.push(url)
  }

  const curtirPergunta = async () => {
    if (!user?.id || !pergunta) return

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação.')
        return
      }

      const res = await fetch(`/api/comunidade/perguntas/${pergunta.id}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json?.error || 'Erro ao curtir pergunta')
        return
      }

      setPergunta((prev) =>
        prev
          ? {
              ...prev,
              votos: json.votos,
              curtida: json.curtida,
            }
          : null
      )
    } catch (e: any) {
      console.error('Erro ao curtir pergunta:', e)
      setError(e?.message || 'Erro ao curtir pergunta')
    }
  }

  // Detectar @ e buscar usuários para resposta
  const handleRespostaTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setRespostaConteudo(text)

    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = text.substring(0, cursorPosition)
    
    // Encontrar o último @ antes do cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      // Verificar se há espaço após o @ (se sim, não é uma menção ativa)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      const hasSpace = textAfterAt.includes(' ') || textAfterAt.includes('\n')
      
      if (!hasSpace) {
        const query = textAfterAt.trim()
        setMentionQuery(query)
        setMentionIndex(lastAtIndex)
        return
      }
    }

    // Se não encontrou @ válido, esconder sugestões
    setShowMentionSuggestions(false)
    setMentionQuery('')
    setMentionIndex(-1)
  }

  // Selecionar usuário da lista (resposta)
  const selectRespostaUser = (user: { id: string; name: string }) => {
    if (mentionIndex === -1) return

    const text = respostaConteudo
    const textBeforeAt = text.substring(0, mentionIndex)
    const textAfterCursor = text.substring(respostaTextareaRef.current?.selectionStart || text.length)
    
    const newText = textBeforeAt + `@${user.name} ` + textAfterCursor
    setRespostaConteudo(newText)
    setShowMentionSuggestions(false)
    setMentionQuery('')
    setMentionIndex(-1)

    // Focar no textarea novamente e posicionar cursor após o nome
    setTimeout(() => {
      if (respostaTextareaRef.current) {
        const newCursorPos = textBeforeAt.length + user.name.length + 2 // @nome + espaço
        respostaTextareaRef.current.focus()
        respostaTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Buscar sugestões de usuários para resposta
  useEffect(() => {
    const fetchMentionSuggestions = async () => {
      if (mentionQuery.length > 0) {
        try {
          const token = await getAuthToken()
          const res = await fetch(`/api/users/search?q=${mentionQuery}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          const json = await res.json()
          if (json.success && json.users) {
            setMentionUsers(json.users)
          } else {
            setMentionUsers([])
          }
        } catch (e) {
          console.error('Erro ao buscar sugestões de menção:', e)
          setMentionUsers([])
        }
      } else {
        setMentionUsers([])
      }
    }

    const handler = setTimeout(() => {
      if (showMentionSuggestions) {
        fetchMentionSuggestions()
      }
    }, 200) // Debounce para sugestões

    return () => clearTimeout(handler)
  }, [mentionQuery, showMentionSuggestions])

  // Fechar sugestões ao clicar fora (resposta)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target as Node) &&
        respostaTextareaRef.current &&
        !respostaTextareaRef.current.contains(event.target as Node)
      ) {
        setShowMentionSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Atualizar showMentionSuggestions quando mentionQuery mudar
  useEffect(() => {
    setShowMentionSuggestions(mentionQuery.length > 0)
  }, [mentionQuery])

  const submitResposta = async () => {
    if (!pergunta || !user?.id) return

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
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação.')
        setIsSubmitting(false)
        return
      }

      // Primeiro, criar a resposta
      const res = await fetch(`/api/comunidade/perguntas/${pergunta.id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conteudo }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao enviar resposta')
      }

      // Se houver imagem, fazer upload
      if (respostaImagem && json.result?.respostaId) {
        try {
          const formData = new FormData()
          formData.append('imagem', respostaImagem)

          const resImagem = await fetch(`/api/comunidade/respostas/${json.result.respostaId}/imagem`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })

          const jsonImagem = await resImagem.json()

          if (!resImagem.ok) {
            console.error('Erro ao fazer upload de imagem:', jsonImagem)
            setError(`Resposta criada, mas houve erro ao fazer upload da imagem: ${jsonImagem.error || 'Erro desconhecido'}`)
          }
        } catch (imgError: any) {
          console.error('Erro ao fazer upload de imagem:', imgError)
          setError(`Resposta criada, mas houve erro ao fazer upload da imagem: ${imgError.message || 'Erro desconhecido'}`)
        }
      }

      // Recarregar pergunta para atualizar lista de respostas e threads
      const resPergunta = await fetch(`/api/comunidade/perguntas/${params.id}`)
      const jsonPergunta = await resPergunta.json()

      if (jsonPergunta.success && jsonPergunta.pergunta) {
        setPergunta(jsonPergunta.pergunta)
        setRespostaConteudo('')
        setRespostaImagem(null)
        setRespostaImagemResetTrigger((prev) => prev + 1) // Resetar componente de imagem
        setError('') // Limpar erros anteriores
        
        // Disparar evento de XP ganho para atualizar AuthContext
        if (typeof window !== 'undefined' && user?.id) {
          window.dispatchEvent(
            new CustomEvent('xpGained', {
              detail: { userId: user.id, amount: 1 },
            })
          )
        }
        
        // Forçar atualização dos threads de comentários
        setRefreshTrigger((prev) => prev + 1)
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar resposta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const votarResposta = async (respostaId: string) => {
    if (!user?.id || !pergunta) return

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação.')
        return
      }

      const res = await fetch(`/api/comunidade/respostas/${respostaId}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json?.error || 'Erro ao votar')
        return
      }

      // Recarregar pergunta
      const resPergunta = await fetch(`/api/comunidade/perguntas/${params.id}`)
      const jsonPergunta = await resPergunta.json()

      if (jsonPergunta.success && jsonPergunta.pergunta) {
        setPergunta(jsonPergunta.pergunta)
      }
    } catch (e: any) {
      console.error('Erro ao votar:', e)
      setError(e?.message || 'Erro ao votar')
    }
  }

  const deletarPergunta = async () => {
    if (!user?.id || !pergunta) return

    const confirmar = window.confirm(
      '⚠️ ATENÇÃO: Esta ação irá deletar a pergunta e REMOVER TODO O XP de todos os usuários envolvidos (autor, respostas, melhor resposta). Deseja continuar?'
    )

    if (!confirmar) return

    try {
      setIsDeleting(true)
      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação.')
        setIsDeleting(false)
        return
      }

      const res = await fetch(`/api/comunidade/perguntas/${pergunta.id}/delete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao deletar pergunta')
      }

      // Mostrar mensagem de sucesso
      alert(
        `✅ Pergunta deletada com sucesso!\n\n` +
        `${json.usuariosAfetados} usuário(s) tiveram seu XP revertido.\n\n` +
        (json.detalhes && json.detalhes.length > 0
          ? `Detalhes:\n${json.detalhes.map((d: any) => 
              `• ${d.nome}: ${d.xpAnterior} XP → ${d.novoXp} XP (perdeu ${d.xpPerdido} XP)`
            ).join('\n')}`
          : '')
      )

      // Voltar para a lista de perguntas
      router.push('/aluno/comunidade')
    } catch (e: any) {
      console.error('Erro ao deletar pergunta:', e)
      setError(e?.message || 'Erro ao deletar pergunta')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className={cn(
            'animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4',
            theme === 'dark' ? 'border-yellow-400' : 'border-yellow-600'
          )} />
          <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
            Carregando pergunta...
          </p>
        </div>
      </div>
    )
  }

  if (error && !pergunta) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleVoltar}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
            theme === 'dark'
              ? 'bg-black/20 border-white/10 text-gray-300 hover:bg-black/40 hover:border-yellow-400/50'
              : 'bg-white border-yellow-400/90 text-gray-700 hover:bg-gray-50 hover:border-yellow-500'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className={cn(
          'border rounded-lg p-4 text-center',
          theme === 'dark'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        )}>
          {error}
        </div>
      </div>
    )
  }

  if (!pergunta) {
    return null
  }

  const isOwner = pergunta.autor?.id === currentUserId

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Botões de Ação */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleVoltar}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
            theme === 'dark'
              ? 'bg-black/20 border-white/10 text-gray-300 hover:bg-black/40 hover:border-yellow-400/50'
              : 'bg-white border-yellow-400/90 text-gray-700 hover:bg-gray-50 hover:border-yellow-500'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Botão de Deletar (apenas para admins) */}
        {user?.role === 'admin' && (
          <button
            onClick={deletarPergunta}
            disabled={isDeleting}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50'
                : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400',
              isDeleting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deletando...' : 'Deletar Pergunta'}
          </button>
        )}
      </div>

      {error && (
        <div className={cn(
          'border rounded-lg p-3 text-sm',
          theme === 'dark'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        )}>
          {error}
        </div>
      )}

      {/* Pergunta */}
      <div className={cn(
        'backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300',
        pergunta.resolvida
          ? theme === 'dark'
            ? 'bg-black/20 border-green-500/30'
            : 'bg-green-50 border-green-400/90 shadow-md'
          : theme === 'dark'
            ? 'bg-black/20 border-white/10'
            : 'bg-white border-yellow-400/90 shadow-md'
      )}>
        <div className="flex gap-3 md:gap-4">
          {/* Votes */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={curtirPergunta}
              className={cn(
                'flex flex-col items-center p-2 md:p-3 backdrop-blur-sm rounded-lg border transition-all duration-200 cursor-pointer',
                pergunta.curtida
                  ? theme === 'dark'
                    ? 'bg-yellow-500/20 border-yellow-400/50 hover:bg-yellow-500/30'
                    : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'
                  : theme === 'dark'
                    ? 'bg-black/30 border-white/10 hover:bg-black/50 hover:border-yellow-400/30'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-yellow-400'
              )}
            >
              <ThumbsUp className={cn(
                'w-4 h-4 md:w-5 md:h-5 transition-colors',
                pergunta.curtida
                  ? 'text-yellow-400'
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )} />
              <span className={cn(
                'font-semibold mt-1 text-xs md:text-sm transition-colors',
                pergunta.curtida
                  ? 'text-yellow-400'
                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {pergunta.votos}
              </span>
            </button>
            {pergunta.resolvida && (
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              'text-xl md:text-2xl font-bold mb-3',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {pergunta.titulo}
            </h1>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {pergunta.autor?.avatar && !avatarErrors.has(`pergunta-${pergunta.autor.id}`) ? (
                <img
                  src={pergunta.autor.avatar}
                  alt={pergunta.autor.nome}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white/10"
                  onError={() => {
                    setAvatarErrors((prev) => new Set(prev).add(`pergunta-${pergunta.autor?.id}`))
                  }}
                />
              ) : (
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                    : 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white'
                )}>
                  {pergunta.autor?.nome.charAt(0) || 'U'}
                </div>
              )}
              <span className={cn('text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                {pergunta.autor?.nome || 'Usuário'}
              </span>
              {pergunta.autor && badgesMap.get(pergunta.autor.id)?.includes('top_member') && (
                <BadgeDisplay badgeType="top_member" />
              )}
              <span className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                • Nível {pergunta.autor?.nivel || 1}
              </span>
            </div>

            <p className={cn(
              'text-sm md:text-base mb-4 whitespace-pre-wrap',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              {pergunta.descricao}
            </p>

            {pergunta.imagemUrl && (
              <div className="mb-4">
                <img
                  src={pergunta.imagemUrl}
                  alt="Imagem da pergunta"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            <div className="flex items-center gap-4 text-xs md:text-sm mb-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span className={cn(theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                  {pergunta.visualizacoes} visualizações
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span className={cn(theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                  {pergunta.respostas.length} resposta{pergunta.respostas.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {pergunta.categoria && (
              <div className="mb-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full',
                    theme === 'dark'
                      ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                      : 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/30'
                  )}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Categoria:</span>
                  <span>{pergunta.categoria}</span>
                </span>
              </div>
            )}
            {pergunta.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className={cn(
                  "text-xs font-medium",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Tags:
                </span>
                {pergunta.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border',
                      theme === 'dark'
                        ? 'bg-transparent text-blue-400 border-blue-500/40'
                        : 'bg-transparent text-blue-600 border-blue-300'
                    )}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulário de Resposta */}
      {canCreate && (
        <div className={cn(
          'backdrop-blur-md border rounded-xl p-4 md:p-6',
          theme === 'dark'
            ? 'bg-black/20 border-white/10'
            : 'bg-white border-yellow-400/90 shadow-md'
        )}>
          <h2 className={cn(
            'text-lg font-bold mb-3',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Sua Resposta
          </h2>
          <div className="mb-3">
            <textarea
              ref={respostaTextareaRef}
              value={respostaConteudo}
              onChange={handleRespostaTextChange}
              placeholder="Digite @username para mencionar alguém..."
              rows={6}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
            {/* Dropdown de sugestões de menções */}
            {showMentionSuggestions && mentionUsers.length > 0 && (
              <div
                ref={mentionDropdownRef}
                className={cn(
                  'z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg',
                  theme === 'dark'
                    ? 'bg-black/95 border-white/20 backdrop-blur-md'
                    : 'bg-white border-gray-200 shadow-xl'
                )}
              >
                {mentionUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectRespostaUser(user)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs hover:bg-opacity-50 transition-colors border-b last:border-b-0 flex items-center gap-2',
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-white border-white/5'
                        : 'hover:bg-yellow-50 text-gray-900 border-gray-100'
                    )}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                          : 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white'
                      )}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{user.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mb-3">
            <QuestionImageUpload
              onImageChange={setRespostaImagem}
              resetTrigger={respostaImagemResetTrigger}
            />
          </div>
          <button
            onClick={submitResposta}
            disabled={isSubmitting || !respostaConteudo.trim()}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              theme === 'dark'
                ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                : 'bg-yellow-500 text-white hover:bg-yellow-600',
              (isSubmitting || !respostaConteudo.trim()) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
          </button>
        </div>
      )}

      {/* Respostas */}
      <div className="space-y-4">
        <h2 className={cn(
          'text-lg font-bold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Respostas ({pergunta.respostas.length})
        </h2>

        {pergunta.respostas.length === 0 ? (
          <div className={cn(
            'backdrop-blur-md border rounded-xl p-8 text-center',
            theme === 'dark'
              ? 'bg-black/20 border-white/10'
              : 'bg-white border-yellow-400/90 shadow-md'
          )}>
            <p className={cn(theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              Ainda não há respostas para esta pergunta. Seja o primeiro a responder!
            </p>
          </div>
        ) : (
          (() => {
            // Ordenar respostas: melhor resposta sempre primeiro, depois pela ordenação escolhida
            const respostasOrdenadas = [...pergunta.respostas].sort((a, b) => {
              // Melhor resposta sempre primeiro
              if (a.melhorResposta && !b.melhorResposta) return -1
              if (!a.melhorResposta && b.melhorResposta) return 1
              
              // Depois ordenar por data
              const dataA = new Date(a.dataCriacao).getTime()
              const dataB = new Date(b.dataCriacao).getTime()
              
              if (ordenacaoRespostas === 'mais_nova') {
                return dataB - dataA // Mais recente primeiro
              } else {
                return dataA - dataB // Mais antiga primeiro
              }
            })
            
            return respostasOrdenadas.map((resposta) => (
            <div
              key={resposta.id}
              className={cn(
                'backdrop-blur-md border rounded-xl p-4 md:p-6',
                resposta.melhorResposta
                  ? theme === 'dark'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-green-50 border-green-300'
                  : theme === 'dark'
                    ? 'bg-black/20 border-white/10'
                    : 'bg-white border-yellow-400/90 shadow-md'
              )}
            >
              <div className="flex gap-3 md:gap-4">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <ThumbsUp className={cn(
                    'w-4 h-4',
                    resposta.melhorResposta
                      ? 'text-green-500'
                      : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )} />
                  {resposta.melhorResposta && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {resposta.autor?.avatar && !avatarErrors.has(`resposta-${resposta.autor.id}`) ? (
                        <img
                          src={resposta.autor.avatar}
                          alt={resposta.autor.nome}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white/10"
                          onError={() => {
                            setAvatarErrors((prev) => new Set(prev).add(`resposta-${resposta.autor?.id}`))
                          }}
                        />
                      ) : (
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          theme === 'dark'
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                            : 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white'
                        )}>
                          {resposta.autor?.nome.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className={cn('text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                        {resposta.autor?.nome || 'Usuário'}
                      </span>
                      {resposta.autor && badgesMap.get(resposta.autor.id)?.includes('top_member') && (
                        <BadgeDisplay badgeType="top_member" />
                      )}
                      <span className={cn('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                        • Nível {resposta.autor?.nivel || 1}
                      </span>
                    </div>
                    {isOwner && !resposta.melhorResposta && canCreate && (
                      <button
                        className={cn(
                          'px-2 py-1 text-xs rounded border flex items-center gap-1',
                          theme === 'dark'
                            ? 'border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10'
                            : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'
                        )}
                        onClick={() => {
                          if (window.confirm(
                            '⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\n' +
                            'Ao marcar esta resposta como certa:\n' +
                            '• Apenas uma resposta pode ser marcada como certa por pergunta\n' +
                            '• O autor desta resposta receberá XP\n' +
                            '• Esta ação não poderá ser revertida\n\n' +
                            'Deseja continuar?'
                          )) {
                            votarResposta(resposta.id)
                          }
                        }}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Marcar como resposta certa
                      </button>
                    )}
                    {isOwner && resposta.melhorResposta && (
                      <span className={cn(
                        'px-2 py-1 text-xs rounded border flex items-center gap-1',
                        theme === 'dark'
                          ? 'border-green-500/50 text-green-400 bg-green-500/10'
                          : 'border-green-300 text-green-700 bg-green-50'
                      )}>
                        <CheckCircle2 className="w-3 h-3" />
                        Resposta certa
                      </span>
                    )}
                  </div>

                  <p className={cn(
                    'text-sm whitespace-pre-wrap mb-3',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {resposta.conteudo}
                  </p>

                  {resposta.imagemUrl && (
                    <div className="mb-3">
                      <img
                        src={resposta.imagemUrl}
                        alt="Imagem da resposta"
                        className="w-full max-w-2xl rounded-lg border object-contain"
                        style={{ maxHeight: '500px' }}
                      />
                    </div>
                  )}

                  {/* Thread de comentários */}
                  <CommentThread
                    respostaId={resposta.id}
                    perguntaId={pergunta.id}
                    canCreate={canCreate}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            </div>
            ))
          })()
        )}
      </div>
    </div>
  )
}

