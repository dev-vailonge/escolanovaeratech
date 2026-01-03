'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { getAuthToken } from '@/lib/getAuthToken'
import { extractMentions } from '@/lib/mentionParser'
import BadgeDisplay from './BadgeDisplay'
import QuestionImageUpload from './QuestionImageUpload'
import { getUserBadges } from '@/lib/badges'

interface Comentario {
  id: string
  conteudo: string
  mencoes: string[]
  dataCriacao: string
  imagemUrl?: string | null
  autor: {
    id: string
    nome: string
    nivel: number
    avatar?: string | null
  } | null
}

interface CommentThreadProps {
  respostaId: string
  perguntaId: string
  canCreate?: boolean
  refreshTrigger?: number // Trigger para forçar atualização
}

export default function CommentThread({ respostaId, perguntaId, canCreate = true, refreshTrigger }: CommentThreadProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [comentariosCount, setComentariosCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [loadingCount, setLoadingCount] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [comentarioTexto, setComentarioTexto] = useState('')
  const [comentarioImagem, setComentarioImagem] = useState<File | null>(null)
  const [comentarioImagemResetTrigger, setComentarioImagemResetTrigger] = useState(0)
  const [error, setError] = useState<string>('')
  const [badgesMap, setBadgesMap] = useState<Map<string, string[]>>(new Map())
  
  // Estados para autocomplete de menções
  const [mentionUsers, setMentionUsers] = useState<Array<{ id: string; name: string; avatar_url?: string | null }>>([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1) // Índice do cursor onde está o @
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionDropdownRef = useRef<HTMLDivElement>(null)

  // Buscar contagem de comentários (inicial, sem expandir)
  const fetchComentariosCount = async () => {
    try {
      setLoadingCount(true)
      const res = await fetch(`/api/comunidade/respostas/${respostaId}/comentarios`)
      const json = await res.json()

      if (json.success && json.comentarios) {
        setComentariosCount(json.comentarios.length)
      }
    } catch (e: any) {
      console.error('Erro ao buscar contagem de comentários:', e)
    } finally {
      setLoadingCount(false)
    }
  }

  // Buscar comentários completos (quando expandido)
  const fetchComentarios = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/comunidade/respostas/${respostaId}/comentarios`)
      const json = await res.json()

      if (json.success && json.comentarios) {
        setComentarios(json.comentarios)
        setComentariosCount(json.comentarios.length)
        
        // Buscar badges dos autores
        const userIds = [...new Set(json.comentarios.map((c: Comentario) => c.autor?.id).filter(Boolean))] as string[]
        const badges = new Map<string, string[]>()
        
        for (const userId of userIds) {
          const userBadges = await getUserBadges(userId)
          badges.set(userId, userBadges.map((b) => b.type))
        }
        
        setBadgesMap(badges)
      }
    } catch (e: any) {
      console.error('Erro ao buscar comentários:', e)
    } finally {
      setLoading(false)
    }
  }

  // Buscar contagem inicial ao montar o componente
  useEffect(() => {
    fetchComentariosCount()
  }, [respostaId, refreshTrigger])

  // Buscar comentários completos quando expandir
  useEffect(() => {
    if (expanded) {
      fetchComentarios()
    }
  }, [expanded])

  // Buscar usuários para autocomplete de menções
  useEffect(() => {
    const fetchUsers = async () => {
      if (!mentionQuery.trim()) {
        setMentionUsers([])
        setShowMentionSuggestions(false)
        return
      }

      try {
        const token = await getAuthToken()
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const json = await res.json()

        if (json.success && json.users) {
          setMentionUsers(json.users)
          setShowMentionSuggestions(json.users.length > 0)
        }
      } catch (e) {
        console.error('Erro ao buscar usuários:', e)
        setMentionUsers([])
        setShowMentionSuggestions(false)
      }
    }

    // Debounce
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [mentionQuery])

  // Detectar @ e buscar usuários
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setComentarioTexto(text)

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

  // Selecionar usuário da lista
  const selectUser = (user: { id: string; name: string }) => {
    if (mentionIndex === -1) return

    const text = comentarioTexto
    const textBeforeAt = text.substring(0, mentionIndex)
    const textAfterCursor = text.substring(textareaRef.current?.selectionStart || text.length)
    
    const newText = textBeforeAt + `@${user.name} ` + textAfterCursor
    setComentarioTexto(newText)
    setShowMentionSuggestions(false)
    setMentionQuery('')
    setMentionIndex(-1)

    // Focar no textarea novamente e posicionar cursor após o nome
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = textBeforeAt.length + user.name.length + 2 // @nome + espaço
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node) &&
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMentionSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const submitComentario = async () => {
    if (!user?.id) {
      setError('Você precisa estar logado para comentar.')
      return
    }

    const texto = comentarioTexto.trim()
    if (texto.length < 3) {
      setError('Comentário muito curto (mínimo 3 caracteres).')
      return
    }

    setSubmitting(true)
    setError('')
    
    // Garantir que está expandido para ver o comentário após criar
    if (!expanded) {
      setExpanded(true)
    }

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação.')
        setSubmitting(false)
        return
      }

      // Primeiro, criar o comentário
      const res = await fetch(`/api/comunidade/respostas/${respostaId}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conteudo: texto }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao criar comentário')
      }

      // Se houver imagem, fazer upload
      if (comentarioImagem && json.comentario?.id) {
        try {
          const formData = new FormData()
          formData.append('imagem', comentarioImagem)

          const resImagem = await fetch(`/api/comunidade/respostas/${json.comentario.id}/imagem`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })

          const jsonImagem = await resImagem.json()

          if (resImagem.ok && jsonImagem.imagem_url) {
            // Atualizar o comentário com a URL da imagem
            json.comentario.imagemUrl = jsonImagem.imagem_url
          } else {
            console.error('Erro ao fazer upload de imagem do comentário:', jsonImagem)
          }
        } catch (imgError: any) {
          console.error('Erro ao fazer upload de imagem:', imgError)
        }
      }

      // Recarregar comentários para ter a versão completa com badges
      if (json.success && json.comentario) {
        await fetchComentarios()
        setComentarioTexto('')
        setComentarioImagem(null)
        setComentarioImagemResetTrigger((prev) => prev + 1) // Resetar componente de imagem
        setShowInput(false)
        
        // Atualizar badges se o autor do comentário não estiver no mapa
        if (json.comentario.autor && !badgesMap.has(json.comentario.autor.id)) {
          getUserBadges(json.comentario.autor.id).then((badges) => {
            setBadgesMap((prev) => {
              const newMap = new Map(prev)
              newMap.set(json.comentario.autor.id, badges.map((b) => b.type))
              return newMap
            })
          })
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar comentário')
    } finally {
      setSubmitting(false)
    }
  }

  // Usar a contagem atualizada (do estado ou dos comentários carregados)
  const displayCount = expanded ? comentarios.length : comentariosCount

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        {/* Botão para ver/comentar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center gap-2 text-xs transition-colors',
            theme === 'dark' ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-600 hover:text-yellow-600'
          )}
        >
          <MessageSquare className="w-3 h-3" />
          <span>
            {expanded 
              ? 'Ocultar comentários' 
              : displayCount > 0 
                ? `Ver ${displayCount} comentário${displayCount !== 1 ? 's' : ''}`
                : 'Comentar'}
          </span>
        </button>

        {/* Botão para adicionar comentário (separado, só aparece se houver comentários) */}
        {!expanded && canCreate && displayCount > 0 && (
          <button
            onClick={() => {
              setExpanded(true)
              setShowInput(true)
            }}
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors',
              theme === 'dark'
                ? 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-yellow-400 hover:border-yellow-400/30'
                : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-yellow-600 hover:border-yellow-400'
            )}
          >
            <span>Comentar</span>
          </button>
        )}
      </div>

      {expanded && (
        <div className={cn(
          'mt-3 space-y-3 pt-3 border-t',
          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
        )}>
          {loading ? (
            <p className={cn('text-xs text-center py-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              Carregando comentários...
            </p>
          ) : comentarios.length === 0 ? (
            <p className={cn('text-xs text-center py-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            comentarios.map((comentario) => (
              <div
                key={comentario.id}
                className={cn(
                  'p-2 rounded-lg border text-xs',
                  theme === 'dark'
                    ? 'bg-black/30 border-white/10'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-start gap-2">
                  {comentario.autor?.avatar ? (
                    <img
                      src={comentario.autor.avatar}
                      alt={comentario.autor.nome}
                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                        : 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white'
                    )}>
                      {comentario.autor?.nome.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                        {comentario.autor?.nome || 'Usuário'}
                      </span>
                      {comentario.autor && badgesMap.get(comentario.autor.id)?.includes('top_member') && (
                        <BadgeDisplay badgeType="top_member" className="text-[10px] px-1 py-0" />
                      )}
                      <span className={cn('text-[10px]', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                        Nível {comentario.autor?.nivel || 1}
                      </span>
                    </div>
                    <p className={cn('mt-1 whitespace-pre-wrap', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                      {comentario.conteudo}
                    </p>
                    {comentario.imagemUrl && (
                      <div className="mt-2">
                        <img
                          src={comentario.imagemUrl}
                          alt="Imagem do comentário"
                          className="w-full max-w-md rounded-lg border object-contain"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {canCreate && (
            <div>
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  className={cn(
                    'w-full text-xs py-2 rounded-lg border transition-colors',
                    theme === 'dark'
                      ? 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-yellow-400'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-yellow-600'
                  )}
                >
                  Adicionar comentário
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={comentarioTexto}
                      onChange={handleTextChange}
                      placeholder="Digite @username para mencionar alguém..."
                      rows={3}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-xs',
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
                          'absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg',
                          theme === 'dark'
                            ? 'bg-black/95 border-white/20 backdrop-blur-md'
                            : 'bg-white border-gray-200 shadow-xl'
                        )}
                      >
                      {mentionUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
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
                  <div className="text-xs">
                    <QuestionImageUpload
                      onImageChange={setComentarioImagem}
                      resetTrigger={comentarioImagemResetTrigger}
                    />
                  </div>
                  {error && (
                    <p className={cn('text-xs', theme === 'dark' ? 'text-red-400' : 'text-red-600')}>
                      {error}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowInput(false)
                        setComentarioTexto('')
                        setComentarioImagem(null)
                        setError('')
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs transition-colors',
                        theme === 'dark'
                          ? 'border-white/10 text-gray-300 hover:bg-white/5'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      )}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitComentario}
                      disabled={submitting || !comentarioTexto.trim()}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                        theme === 'dark'
                          ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600',
                        (submitting || !comentarioTexto.trim()) && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Send className="w-3 h-3" />
                      {submitting ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

