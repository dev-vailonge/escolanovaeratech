'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, Sparkles, Loader2 } from 'lucide-react'
import CreateQuizModal from './CreateQuizModal'
import { getAllQuizzes } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import type { DatabaseQuiz } from '@/types/database'

export default function AdminQuizTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<DatabaseQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<DatabaseQuiz | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    carregarQuizzes()
  }, [])

  const carregarQuizzes = async () => {
    try {
      setLoading(true)
      setError('')
      const dados = await getAllQuizzes()
      setQuizzes(dados)
    } catch (err) {
      console.error('Erro ao carregar quizzes:', err)
      setError('Erro ao carregar quizzes. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (quizData: any) => {
    try {
      setError('')
      
      // Preparar dados no formato do banco
      const questoesArray = Array.isArray(quizData.perguntas) ? quizData.perguntas : (Array.isArray(quizData.questoes) ? quizData.questoes : [])
      
      console.log('📝 AdminQuizTab: Preparando para salvar quiz')
      console.log('📊 Número de perguntas:', questoesArray.length)
      
      // Obter token de autenticação com timeout
      console.log('🔑 Obtendo sessão...')
      
      const getSessionWithTimeout = () => {
        return Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao obter sessão')), 5000)
          )
        ]) as Promise<{ data: { session: any } }>
      }
      
      let token: string | undefined
      try {
        const sessionResult = await getSessionWithTimeout()
        console.log('🔑 Sessão obtida:', !!sessionResult?.data?.session)
        token = sessionResult?.data?.session?.access_token
      } catch (sessionError: any) {
        console.error('❌ Erro ao obter sessão:', sessionError?.message)
        // Tentar pegar do AuthContext como fallback
        if (user?.id) {
          console.log('🔄 Tentando fallback via localStorage...')
          const storedSession = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession)
              token = parsed?.access_token
              console.log('🔑 Token obtido do localStorage')
            } catch (e) {
              console.error('❌ Falha ao parsear sessão do localStorage')
            }
          }
        }
      }
      
      if (!token) {
        console.error('❌ Token não encontrado')
        throw new Error('Não autenticado. Faça login novamente.')
      }
      console.log('🔑 Token obtido (primeiros 20 chars):', token.substring(0, 20) + '...')

      const payload = {
        id: editingQuiz?.id,
        titulo: quizData.titulo,
        descricao: quizData.descricao,
        tecnologia: quizData.tecnologia,
        nivel: quizData.nivel,
        questoes: questoesArray,
        xp: quizData.xp,
        disponivel: true
      }

      console.log('📦 Payload preparado:', { titulo: payload.titulo, numQuestoes: payload.questoes?.length })

      if (editingQuiz) {
        // Atualizar quiz existente via API
        console.log('🔄 Atualizando quiz existente:', editingQuiz.id)
        console.log('📡 Chamando PUT /api/admin/quiz...')
        
        const res = await fetch('/api/admin/quiz', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        
        const json = await res.json()
        
        if (!res.ok) {
          console.error('❌ Falha ao atualizar quiz:', json.error)
          throw new Error(json.error || 'Erro ao atualizar quiz')
        }
        
        console.log('✅ Quiz atualizado com sucesso')
        await carregarQuizzes()
        setIsCreating(false)
        setEditingQuiz(null)
      } else {
        // Criar novo quiz via API
        console.log('🆕 Criando novo quiz via API...')
        console.log('📡 Chamando POST /api/admin/quiz...')
        
        const res = await fetch('/api/admin/quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        
        const json = await res.json()
        
        if (!res.ok) {
          console.error('❌ Falha ao criar quiz:', json.error)
          throw new Error(json.error || 'Erro ao criar quiz')
        }
        
        console.log('✅ Quiz criado com sucesso:', json.quiz?.id)
        await carregarQuizzes()
        setIsCreating(false)
      }
    } catch (err: any) {
      console.error('❌ Erro ao salvar quiz:', err)
      setError(err?.message || 'Erro ao salvar quiz. Tente novamente.')
      throw err // Re-throw para o modal saber que falhou
    }
  }

  const handleDelete = async (quizId: string) => {
    if (!confirm('Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setError('')
      console.log('🗑️ Excluindo quiz:', quizId)
      
      // Obter token de autenticação com timeout e fallback
      let token: string | undefined
      
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) => 
            setTimeout(() => resolve({ data: { session: null } }), 3000)
          )
        ])
        token = sessionResult?.data?.session?.access_token
      } catch {}
      
      // Fallback localStorage
      if (!token) {
        const key = 'sb-' + (process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token'
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            token = JSON.parse(stored)?.access_token
          } catch {}
        }
      }
      
      if (!token) {
        setError('Não autenticado. Faça login novamente.')
        return
      }
      
      console.log('📡 Chamando DELETE /api/admin/quiz...')
      const res = await fetch(`/api/admin/quiz?id=${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const json = await res.json()
      
      if (!res.ok) {
        console.error('❌ Erro ao excluir:', json.error)
        setError(json.error || 'Erro ao excluir quiz.')
        return
      }
      
      console.log('✅ Quiz excluído com sucesso')
      await carregarQuizzes()
    } catch (err: any) {
      console.error('❌ Erro ao excluir quiz:', err)
      setError(err?.message || 'Erro ao excluir quiz. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        theme === 'dark' ? "text-gray-400" : "text-gray-600"
      )}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando quizzes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com botão criar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Gerenciar Quiz
          </h2>
          <p className={cn(
            "text-xs md:text-sm mt-1",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} cadastrado{quizzes.length !== 1 ? 's' : ''}
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
          Criar Quiz
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

      {/* Modal Criar/Editar Quiz */}
      <CreateQuizModal
        isOpen={isCreating || !!editingQuiz}
        onClose={() => {
          setIsCreating(false)
          setEditingQuiz(null)
          setError('')
        }}
        onSave={handleSave}
        quiz={editingQuiz ? {
          ...editingQuiz,
          questoes: Array.isArray(editingQuiz.questoes) ? editingQuiz.questoes.length : 0,
          perguntas: Array.isArray(editingQuiz.questoes) ? editingQuiz.questoes : []
        } : undefined}
      />

      {/* Lista de Quizzes */}
      {quizzes.length === 0 ? (
        <div className={cn(
          "p-8 text-center rounded-lg border",
          theme === 'dark'
            ? "bg-black/20 border-white/10 text-gray-400"
            : "bg-gray-50 border-gray-200 text-gray-600"
        )}>
          Nenhum quiz cadastrado ainda. Clique em "Criar Quiz" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
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
                      {quiz.titulo}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border",
                      theme === 'dark'
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-blue-100 text-blue-700 border-blue-300"
                    )}>
                      {quiz.tecnologia}
                    </span>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border capitalize",
                      theme === 'dark'
                        ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                    )}>
                      {quiz.nivel}
                    </span>
                    {/* Badge de IA */}
                    {!quiz.created_by && (
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
                    {!quiz.disponivel && (
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full border",
                        theme === 'dark'
                          ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          : "bg-gray-100 text-gray-600 border-gray-300"
                      )}>
                        Indisponível
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm mb-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {quiz.descricao}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
                      {Array.isArray(quiz.questoes) ? quiz.questoes.length : 0} questão{Array.isArray(quiz.questoes) && quiz.questoes.length !== 1 ? 'ões' : ''}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    )}>
                      +{quiz.xp} XP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingQuiz(quiz)}
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
                    onClick={() => handleDelete(quiz.id)}
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

      {/* Botão Gerar com IA (placeholder) */}
      <div className={cn(
        "p-4 rounded-lg border border-dashed",
        theme === 'dark'
          ? "border-white/20 bg-black/10"
          : "border-gray-300 bg-gray-50"
      )}>
        <button
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}
          disabled
        >
          <Sparkles className="w-4 h-4" />
          <span>Gerar Quiz com IA (Em breve)</span>
        </button>
      </div>
    </div>
  )
}
