'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import { Plus, Edit, Trash2, Sparkles, Loader2 } from 'lucide-react'
import CreateQuizModal from './CreateQuizModal'
import { getAllQuizzes, createQuiz, updateQuiz, deleteQuiz } from '@/lib/database'
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
      const dadosQuiz: Omit<DatabaseQuiz, 'id' | 'created_at' | 'updated_at'> = {
        titulo: quizData.titulo,
        descricao: quizData.descricao,
        tecnologia: quizData.tecnologia,
        nivel: quizData.nivel as 'iniciante' | 'intermediario' | 'avancado',
        questoes: Array.isArray(quizData.perguntas) ? quizData.perguntas : (Array.isArray(quizData.questoes) ? quizData.questoes : []),
        xp: quizData.xp,
        disponivel: true,
        created_by: user?.id || null
      }

      if (editingQuiz) {
        // Atualizar quiz existente
        const sucesso = await updateQuiz(editingQuiz.id, dadosQuiz)
        if (sucesso) {
          await carregarQuizzes()
          setIsCreating(false)
          setEditingQuiz(null)
        } else {
          setError('Erro ao atualizar quiz. Tente novamente.')
        }
      } else {
        // Criar novo quiz
        const novoQuiz = await createQuiz(dadosQuiz)
        if (novoQuiz) {
          await carregarQuizzes()
          setIsCreating(false)
        } else {
          setError('Erro ao criar quiz. Tente novamente.')
        }
      }
    } catch (err) {
      console.error('Erro ao salvar quiz:', err)
      setError('Erro ao salvar quiz. Tente novamente.')
    }
  }

  const handleDelete = async (quizId: string) => {
    if (!confirm('Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setError('')
      const sucesso = await deleteQuiz(quizId)
      if (sucesso) {
        await carregarQuizzes()
      } else {
        setError('Erro ao excluir quiz. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro ao excluir quiz:', err)
      setError('Erro ao excluir quiz. Tente novamente.')
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
