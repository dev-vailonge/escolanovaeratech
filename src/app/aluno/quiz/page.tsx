'use client'

import { HelpCircle, Clock, CheckCircle2, Play, Trophy, Lock, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { hasFullAccess } from '@/lib/types/auth'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { getAllQuizzes } from '@/lib/database'
import type { DatabaseQuiz } from '@/types/database'
import type { QuizQuestion } from '@/types/quiz'
import QuizPlayer, { QuizResult } from '@/components/quiz/QuizPlayer'

// Interface para quiz na UI (com progresso do usuário)
interface QuizUI {
  id: string
  titulo: string
  descricao: string
  tecnologia: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  questoes: QuizQuestion[]
  numQuestoes: number
  tempoEstimado: number
  xpGanho: number
  completo: boolean
  pontuacao?: number
  tentativas: number
  melhorPontuacao?: number
  disponivel: boolean
}

export default function QuizPage() {
  const { theme } = useTheme()
  const { user: authUser } = useAuth()
  const canParticipate = hasFullAccess(authUser)

  const [quizes, setQuizes] = useState<QuizUI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState<QuizUI | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Carregar quizzes do Supabase
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true)
        
        // Buscar quizzes disponíveis
        const dbQuizzes = await getAllQuizzes()
        
        // Buscar progresso do usuário se logado
        let userProgress: Record<string, { tentativas: number; melhor_pontuacao: number | null; completo: boolean }> = {}
        
        if (authUser?.id) {
          console.log('📊 Buscando progresso do usuário:', authUser.id)
          
          const { data: progress, error: progressError } = await supabase
            .from('user_quiz_progress')
            .select('quiz_id, tentativas, melhor_pontuacao, completo')
            .eq('user_id', authUser.id)
          
          if (progressError) {
            console.error('❌ Erro ao buscar progresso:', progressError)
          }
          
          console.log('📊 Progresso encontrado:', progress)
          
          if (progress) {
            progress.forEach(p => {
              userProgress[p.quiz_id] = {
                tentativas: p.tentativas,
                melhor_pontuacao: p.melhor_pontuacao,
                completo: p.completo
              }
            })
          }
        }
        
        // Converter para formato UI
        const quizzesUI: QuizUI[] = dbQuizzes
          .filter(q => q.disponivel) // Só mostrar disponíveis
          .map(q => {
            const progress = userProgress[q.id]
            const questoesArray = Array.isArray(q.questoes) ? q.questoes as QuizQuestion[] : []
            const numQuestoes = questoesArray.length
            
            return {
              id: q.id,
              titulo: q.titulo,
              descricao: q.descricao,
              tecnologia: q.tecnologia,
              nivel: q.nivel,
              questoes: questoesArray,
              numQuestoes,
              tempoEstimado: Math.max(5, Math.ceil(numQuestoes * 1.5)), // ~1.5 min por questão
              xpGanho: q.xp,
              completo: progress?.completo || false,
              pontuacao: progress?.melhor_pontuacao ?? undefined,
              tentativas: progress?.tentativas || 0,
              melhorPontuacao: progress?.melhor_pontuacao ?? undefined,
              disponivel: q.disponivel
            }
          })
        
        setQuizes(quizzesUI)
      } catch (err) {
        console.error('Erro ao carregar quizzes:', err)
        setError('Erro ao carregar quizzes. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuizzes()
  }, [authUser?.id])

  const quizesCompletos = useMemo(() => quizes.filter(q => q.completo).length, [quizes])
  const quizesDisponiveis = useMemo(() => quizes.filter(q => q.disponivel && !q.completo).length, [quizes])
  const totalQuizesDisponiveis = useMemo(() => quizes.filter(q => q.disponivel).length, [quizes])

  // Iniciar quiz
  const handleStartQuiz = (quiz: QuizUI) => {
    if (!canParticipate) return
    if (quiz.numQuestoes === 0) {
      setError('Este quiz ainda não tem perguntas cadastradas.')
      return
    }
    setError('')
    setSuccess('')
    setSelectedQuiz(quiz)
    setIsPlaying(true)
  }

  // Completar quiz
  const handleCompleteQuiz = async (result: QuizResult) => {
    if (!selectedQuiz || !authUser?.id) return
    
    try {
      // Obter token
      const getToken = async () => {
        try {
          const { data } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: null } }>((resolve) => 
              setTimeout(() => resolve({ data: { session: null } }), 3000)
            )
          ])
          if (data?.session?.access_token) return data.session.access_token
        } catch {}
        
        // Fallback localStorage
        const key = 'sb-' + (process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token'
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            return JSON.parse(stored)?.access_token
          } catch {}
        }
        return null
      }
      
      const token = await getToken()
      if (!token) throw new Error('Não autenticado')

      const res = await fetch(`/api/quiz/${selectedQuiz.id}/completar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pontuacao: result.pontuacao }),
      })
      
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Falha ao registrar quiz')

      const xp = json?.result?.xp ?? Math.round((result.pontuacao / 100) * selectedQuiz.xpGanho)
      const tentativas = json?.result?.tentativas ?? (selectedQuiz.tentativas + 1)
      const melhorPontuacao = json?.result?.melhorPontuacao ?? Math.max(selectedQuiz.melhorPontuacao || 0, result.pontuacao)

      // Atualizar estado local
      setQuizes((prev) =>
        prev.map((q) =>
          q.id === selectedQuiz.id
            ? {
                ...q,
                completo: true,
                pontuacao: result.pontuacao,
                tentativas,
                melhorPontuacao,
              }
            : q
        )
      )

      setSuccess(`✅ Quiz concluído! Você ganhou ${xp} XP com ${result.acertos}/${result.total} acertos.`)
    } catch (e: any) {
      console.error('Erro ao registrar quiz:', e)
      setError(e?.message || 'Erro ao registrar resultado')
    }
  }

  // Fechar quiz
  const handleCloseQuiz = () => {
    setSelectedQuiz(null)
    setIsPlaying(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Quiz
          </h1>
          <p className={cn(
            "text-sm md:text-base",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Teste seus conhecimentos e ganhe XP
          </p>
        </div>
        <div className={cn(
          "flex items-center justify-center p-12",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando quizzes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Modal do Quiz Player */}
      <Modal 
        isOpen={isPlaying && !!selectedQuiz} 
        onClose={handleCloseQuiz} 
        title="" 
        size="lg"
      >
        {selectedQuiz && (
          <QuizPlayer
            quizId={selectedQuiz.id}
            titulo={selectedQuiz.titulo}
            questoes={selectedQuiz.questoes}
            xpTotal={selectedQuiz.xpGanho}
            onComplete={handleCompleteQuiz}
            onCancel={handleCloseQuiz}
          />
        )}
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
          Quiz
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Teste seus conhecimentos e ganhe XP
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
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
                {quizesCompletos}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Quiz Concluídos
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
          <div className="flex items-center gap-2 md:gap-3">
            <Play className={cn(
              "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )} />
            <div className="min-w-0">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {quizesDisponiveis}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Quiz Disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Quiz */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Todos os Quiz
          </h2>
          <p className={cn(
            "text-xs md:text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {totalQuizesDisponiveis} quiz disponíveis • {quizesCompletos} concluídos
          </p>
        </div>

        {quizes.length === 0 ? (
          <div className={cn(
            "p-8 text-center rounded-xl border",
            theme === 'dark'
              ? "bg-black/20 border-white/10 text-gray-400"
              : "bg-gray-50 border-gray-200 text-gray-600"
          )}>
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum quiz disponível</p>
            <p className="text-sm">Novos quizzes serão adicionados em breve!</p>
          </div>
        ) : (
          quizes.map((quiz) => (
            <div
              key={quiz.id}
              className={cn(
                "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300",
                quiz.disponivel
                  ? theme === 'dark'
                    ? "bg-black/20 border-white/10 hover:border-yellow-400/50"
                    : "bg-white border-yellow-400/90 shadow-md hover:border-yellow-500 hover:shadow-lg"
                  : theme === 'dark'
                    ? "bg-black/20 border-white/5 opacity-60"
                    : "bg-gray-50 border-gray-200 opacity-60"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                    <h3 className={cn(
                      "text-base md:text-lg font-semibold flex-1 min-w-0",
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
                    {quiz.completo && (
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full border flex items-center gap-1 whitespace-nowrap",
                        theme === 'dark'
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-green-100 text-green-700 border-green-300"
                      )}>
                        <Trophy className="w-3 h-3" />
                        {quiz.melhorPontuacao}%
                      </span>
                    )}
                    {quiz.numQuestoes === 0 && (
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full border whitespace-nowrap",
                        theme === 'dark'
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-orange-100 text-orange-600 border-orange-300"
                      )}>
                        Sem perguntas
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm md:text-base mb-3 md:mb-4 line-clamp-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {quiz.descricao}
                  </p>
                  
                  <div className={cn(
                    "flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-3",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
                      {quiz.numQuestoes} questões
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" />
                      {quiz.tempoEstimado} min
                    </span>
                    <span className="capitalize">{quiz.nivel}</span>
                    <span className={cn(
                      "font-semibold",
                      theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    )}>
                      +{quiz.xpGanho} XP
                    </span>
                  </div>

                  {quiz.completo && (
                    <div className={cn(
                      "text-xs md:text-sm",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      <p>
                        Melhor pontuação: <span className={cn(
                          "font-semibold",
                          theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                        )}>
                          {quiz.melhorPontuacao}%
                        </span>
                      </p>
                      <p>Tentativas: {quiz.tentativas}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {!canParticipate && (
                    <div className={cn(
                      "p-3 rounded-lg text-sm",
                      theme === 'dark'
                        ? "bg-yellow-400/10 border border-yellow-400/30 text-yellow-400"
                        : "bg-yellow-50 border border-yellow-300 text-yellow-700"
                    )}>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Upgrade para participar</span>
                      </div>
                    </div>
                  )}
                  <button 
                    className={cn(
                      "btn-primary w-full md:w-auto",
                      (!canParticipate || quiz.numQuestoes === 0) && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!quiz.disponivel || !canParticipate || quiz.numQuestoes === 0}
                    onClick={() => handleStartQuiz(quiz)}
                  >
                    {!canParticipate 
                      ? 'Acesso Limitado' 
                      : quiz.numQuestoes === 0
                        ? 'Sem perguntas'
                        : quiz.completo 
                          ? 'Refazer' 
                          : 'Iniciar Quiz'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
