'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, Sparkles, Loader2 } from 'lucide-react'
import CreateQuizModal from './CreateQuizModal'
import { getAllQuizzes } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import type { DatabaseQuiz } from '@/types/database'
import Pagination from '@/components/ui/Pagination'
import SafeLoading from '@/components/ui/SafeLoading'
import { safeFetch } from '@/lib/utils/safeSupabaseQuery'

export default function AdminQuizTab() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<DatabaseQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<DatabaseQuiz | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    carregarQuizzes()
  }, [])

  // Paginação - calcular itens da página atual
  const quizzesPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return quizzes.slice(startIndex, endIndex)
  }, [quizzes, currentPage, itemsPerPage])

  const carregarQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Usar Promise.race com timeout para getAllQuizzes
      const timeoutPromise = new Promise<DatabaseQuiz[]>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar quizzes')), 10000)
      })
      
      const dataPromise = getAllQuizzes()
      const dados = await Promise.race([dataPromise, timeoutPromise])
      
      setQuizzes(dados)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar quizzes. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (quizData: any) => {
    try {
      setError('')
      
      // Preparar dados no formato do banco
      const questoesArray = Array.isArray(quizData.perguntas) ? quizData.perguntas : (Array.isArray(quizData.questoes) ? quizData.questoes : [])

      // Obter token de autenticação com timeout
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
        token = sessionResult?.data?.session?.access_token
      } catch (sessionError: any) {
        // Tentar pegar do AuthContext como fallback
        if (user?.id) {
          const storedSession = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession)
              token = parsed?.access_token
            } catch (e) {
            }
          }
        }
      }
      
      if (!token) {
        throw new Error('Não autenticado. Faça login novamente.')
      }

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

      if (editingQuiz) {
        // Atualizar quiz existente via API
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
          throw new Error(json.error || 'Erro ao atualizar quiz')
        }
        
        await carregarQuizzes()
        setIsCreating(false)
        setEditingQuiz(null)
      } else {
        // Criar novo quiz via API
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
          throw new Error(json.error || 'Erro ao criar quiz')
        }
        
        await carregarQuizzes()
        setIsCreating(false)
      }
    } catch (err: any) {
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
      
      const res = await fetch(`/api/admin/quiz?id=${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const json = await res.json()
      
      if (!res.ok) {
        setError(json.error || 'Erro ao excluir quiz.')
        return
      }
      
      await carregarQuizzes()
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir quiz. Tente novamente.')
    }
  }

  if (loading || error) {
    return (
      <SafeLoading
        loading={loading}
        error={error}
        onRetry={carregarQuizzes}
        loadingMessage="Carregando quizzes..."
        errorMessage="Não foi possível carregar os quizzes. Tente novamente."
      />
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
        <>
          <div className="space-y-3">
            {quizzesPaginados.map((quiz) => (
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
          
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(quizzes.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={quizzes.length}
          />
        </>
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
