'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { getAuthToken } from '@/lib/getAuthToken'
import { extractMentions } from '@/lib/mentionParser'
import BadgeDisplay from './BadgeDisplay'
import { getUserBadges } from '@/lib/badges'

interface Comentario {
  id: string
  conteudo: string
  mencoes: string[]
  dataCriacao: string
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
}

export default function CommentThread({ respostaId, perguntaId, canCreate = true }: CommentThreadProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [comentarioTexto, setComentarioTexto] = useState('')
  const [error, setError] = useState<string>('')
  const [badgesMap, setBadgesMap] = useState<Map<string, string[]>>(new Map())

  // Buscar comentários
  const fetchComentarios = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/comunidade/respostas/${respostaId}/comentarios`)
      const json = await res.json()

      if (json.success && json.comentarios) {
        setComentarios(json.comentarios)
        
        // Buscar badges dos autores
        const userIds = [...new Set(json.comentarios.map((c: Comentario) => c.autor?.id).filter(Boolean))]
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

  useEffect(() => {
    if (expanded) {
      fetchComentarios()
    }
  }, [expanded, respostaId])

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

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Não foi possível obter o token de autenticação.')
        setSubmitting(false)
        return
      }

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

      // Adicionar comentário à lista
      if (json.success && json.comentario) {
        setComentarios((prev) => [...prev, json.comentario])
        setComentarioTexto('')
        setShowInput(false)
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar comentário')
    } finally {
      setSubmitting(false)
    }
  }

  const comentariosCount = comentarios.length

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 text-xs transition-colors',
          theme === 'dark' ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-600 hover:text-yellow-600'
        )}
      >
        <MessageSquare className="w-3 h-3" />
        <span>
          {comentariosCount > 0 ? `${comentariosCount} comentário${comentariosCount !== 1 ? 's' : ''}` : 'Comentar'}
        </span>
      </button>

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
                  <textarea
                    value={comentarioTexto}
                    onChange={(e) => setComentarioTexto(e.target.value)}
                    placeholder="Digite @username para mencionar alguém..."
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-xs',
                      theme === 'dark'
                        ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    )}
                  />
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

