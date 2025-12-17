'use client'

import { useState, useMemo } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  Clock,
  HelpCircle,
  Loader2
} from 'lucide-react'
import type { QuizQuestion } from '@/types/quiz'

interface QuizPlayerProps {
  quizId: string
  titulo: string
  questoes: QuizQuestion[]
  xpTotal: number
  onComplete: (resultado: QuizResult) => Promise<void>
  onCancel: () => void
}

export interface QuizResult {
  pontuacao: number // 0-100
  acertos: number
  total: number
  tempoSegundos: number
  respostas: {
    questionId: string
    selectedOptionId: string
    correct: boolean
    points: number
  }[]
}

type QuizState = 'playing' | 'reviewing' | 'finished'

export default function QuizPlayer({ 
  quizId, 
  titulo, 
  questoes, 
  xpTotal, 
  onComplete, 
  onCancel 
}: QuizPlayerProps) {
  const { theme } = useTheme()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId -> selectedOptionId
  const [quizState, setQuizState] = useState<QuizState>('playing')
  const [showExplanation, setShowExplanation] = useState(false)
  const [startTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

  const currentQuestion = questoes[currentIndex]
  const totalQuestions = questoes.length
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / totalQuestions) * 100

  // Calcular resultado
  const calculateResult = (): QuizResult => {
    let acertos = 0
    let totalPoints = 0
    let maxPoints = 0
    
    const respostas = questoes.map(q => {
      const selected = answers[q.id] || ''
      const correct = selected === q.correctOptionId
      const points = correct ? (q.points || 10) : -(q.penalty || 0)
      
      if (correct) acertos++
      totalPoints += Math.max(0, points)
      maxPoints += q.points || 10
      
      return {
        questionId: q.id,
        selectedOptionId: selected,
        correct,
        points: correct ? (q.points || 10) : 0
      }
    })
    
    const pontuacao = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0
    const tempoSegundos = Math.round((Date.now() - startTime) / 1000)
    
    return {
      pontuacao,
      acertos,
      total: totalQuestions,
      tempoSegundos,
      respostas
    }
  }

  // Selecionar resposta
  const handleSelectOption = (optionId: string) => {
    if (quizState !== 'playing') return
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }))
  }

  // Navegação
  const goToNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowExplanation(false)
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowExplanation(false)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentIndex(index)
    setShowExplanation(false)
  }

  // Finalizar quiz
  const handleFinish = async () => {
    const res = calculateResult()
    setResult(res)
    setQuizState('finished')
    
    setIsSubmitting(true)
    try {
      await onComplete(res)
    } catch (err) {
      console.error('Erro ao registrar resultado:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Revisar respostas
  const handleReview = () => {
    setQuizState('reviewing')
    setCurrentIndex(0)
  }

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Tela de resultado
  if (quizState === 'finished' && result) {
    const passed = result.pontuacao >= 60
    
    return (
      <div className="space-y-6">
        {/* Header resultado */}
        <div className={cn(
          "text-center p-6 rounded-xl border",
          passed
            ? theme === 'dark' 
              ? "bg-green-500/10 border-green-500/30"
              : "bg-green-50 border-green-200"
            : theme === 'dark'
              ? "bg-red-500/10 border-red-500/30"
              : "bg-red-50 border-red-200"
        )}>
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
            passed
              ? theme === 'dark' ? "bg-green-500/20" : "bg-green-100"
              : theme === 'dark' ? "bg-red-500/20" : "bg-red-100"
          )}>
            {passed ? (
              <Trophy className={cn("w-8 h-8", theme === 'dark' ? "text-green-400" : "text-green-600")} />
            ) : (
              <XCircle className={cn("w-8 h-8", theme === 'dark' ? "text-red-400" : "text-red-600")} />
            )}
          </div>
          
          <h2 className={cn(
            "text-2xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {passed ? 'Parabéns!' : 'Continue tentando!'}
          </h2>
          
          <p className={cn(
            "text-4xl font-bold mb-2",
            passed
              ? theme === 'dark' ? "text-green-400" : "text-green-600"
              : theme === 'dark' ? "text-red-400" : "text-red-600"
          )}>
            {result.pontuacao}%
          </p>
          
          <p className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
            {result.acertos} de {result.total} corretas • Tempo: {formatTime(result.tempoSegundos)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className={cn(
            "p-4 rounded-lg border text-center",
            theme === 'dark' ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            <p className={cn("text-2xl font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
              {result.acertos}
            </p>
            <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
              Acertos
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-lg border text-center",
            theme === 'dark' ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            <p className={cn("text-2xl font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
              {result.total - result.acertos}
            </p>
            <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
              Erros
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-lg border text-center",
            theme === 'dark' ? "bg-yellow-400/10 border-yellow-400/30" : "bg-yellow-50 border-yellow-200"
          )}>
            <p className={cn(
              "text-2xl font-bold",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )}>
              +{Math.round((result.pontuacao / 100) * xpTotal)}
            </p>
            <p className={cn("text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
              XP ganho
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={handleReview}
            className={cn(
              "flex-1 py-3 rounded-lg font-medium border transition-colors",
              theme === 'dark'
                ? "border-white/10 text-gray-300 hover:bg-white/5"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            Revisar Respostas
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className={cn(
              "flex-1 py-3 rounded-lg font-medium transition-colors",
              theme === 'dark'
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "bg-yellow-500 text-white hover:bg-yellow-600"
            )}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Concluir'}
          </button>
        </div>
      </div>
    )
  }

  // Tela principal (playing / reviewing)
  const selectedAnswer = answers[currentQuestion?.id]
  const isReviewing = quizState === 'reviewing'
  const isCorrect = isReviewing && selectedAnswer === currentQuestion?.correctOptionId

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={cn(
            "font-semibold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {titulo}
          </h3>
          <p className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>
            Pergunta {currentIndex + 1} de {totalQuestions}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isReviewing && (
            <span className={cn(
              "px-2 py-1 text-xs rounded-full",
              theme === 'dark' ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
            )}>
              Revisando
            </span>
          )}
          <span className={cn(
            "text-sm font-medium",
            theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
          )}>
            +{xpTotal} XP
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className={cn(
        "h-2 rounded-full overflow-hidden",
        theme === 'dark' ? "bg-white/10" : "bg-gray-200"
      )}>
        <div
          className={cn(
            "h-full transition-all duration-300",
            theme === 'dark' ? "bg-yellow-400" : "bg-yellow-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Indicadores de questões */}
      <div className="flex flex-wrap gap-1.5">
        {questoes.map((q, idx) => {
          const answered = !!answers[q.id]
          const isCurrent = idx === currentIndex
          const wasCorrect = isReviewing && answers[q.id] === q.correctOptionId
          const wasWrong = isReviewing && answers[q.id] && answers[q.id] !== q.correctOptionId
          
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                isCurrent
                  ? theme === 'dark'
                    ? "bg-yellow-400 text-black"
                    : "bg-yellow-500 text-white"
                  : wasCorrect
                    ? theme === 'dark'
                      ? "bg-green-500/30 text-green-400 border border-green-500/50"
                      : "bg-green-100 text-green-700 border border-green-300"
                    : wasWrong
                      ? theme === 'dark'
                        ? "bg-red-500/30 text-red-400 border border-red-500/50"
                        : "bg-red-100 text-red-700 border border-red-300"
                      : answered
                        ? theme === 'dark'
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-700"
                        : theme === 'dark'
                          ? "bg-white/5 text-gray-500 border border-white/10"
                          : "bg-gray-50 text-gray-400 border border-gray-200"
              )}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {/* Pergunta */}
      {currentQuestion && (
        <div className={cn(
          "p-4 rounded-xl border",
          theme === 'dark' ? "bg-black/20 border-white/10" : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex items-start gap-3 mb-4">
            <HelpCircle className={cn(
              "w-5 h-5 flex-shrink-0 mt-0.5",
              theme === 'dark' ? "text-blue-400" : "text-blue-600"
            )} />
            <p className={cn(
              "font-medium",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              {currentQuestion.prompt}
            </p>
          </div>

          {/* Opções */}
          <div className="space-y-2">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option.id
              const isCorrectOption = option.id === currentQuestion.correctOptionId
              const showCorrect = isReviewing && isCorrectOption
              const showWrong = isReviewing && isSelected && !isCorrectOption
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={isReviewing}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    showCorrect
                      ? theme === 'dark'
                        ? "bg-green-500/20 border-green-500/50 text-green-300"
                        : "bg-green-100 border-green-300 text-green-800"
                      : showWrong
                        ? theme === 'dark'
                          ? "bg-red-500/20 border-red-500/50 text-red-300"
                          : "bg-red-100 border-red-300 text-red-800"
                        : isSelected
                          ? theme === 'dark'
                            ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-300"
                            : "bg-yellow-100 border-yellow-300 text-yellow-800"
                          : theme === 'dark'
                            ? "bg-black/30 border-white/10 text-gray-300 hover:border-white/30"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  <span className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    showCorrect
                      ? theme === 'dark' ? "bg-green-500/30" : "bg-green-200"
                      : showWrong
                        ? theme === 'dark' ? "bg-red-500/30" : "bg-red-200"
                        : isSelected
                          ? theme === 'dark' ? "bg-yellow-400/30" : "bg-yellow-200"
                          : theme === 'dark' ? "bg-white/10" : "bg-gray-100"
                  )}>
                    {option.label}
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {showWrong && <XCircle className="w-5 h-5 text-red-500" />}
                </button>
              )
            })}
          </div>

          {/* Explicação (em revisão) */}
          {isReviewing && currentQuestion.explanation && (
            <div className={cn(
              "mt-4 p-3 rounded-lg border",
              theme === 'dark' 
                ? "bg-blue-500/10 border-blue-500/30" 
                : "bg-blue-50 border-blue-200"
            )}>
              <p className={cn(
                "text-sm font-medium mb-1",
                theme === 'dark' ? "text-blue-400" : "text-blue-700"
              )}>
                Explicação:
              </p>
              <p className={cn(
                "text-sm",
                theme === 'dark' ? "text-blue-300" : "text-blue-600"
              )}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Pontos da questão */}
          <div className={cn(
            "mt-3 text-xs",
            theme === 'dark' ? "text-gray-500" : "text-gray-400"
          )}>
            Vale {currentQuestion.points || 10} pontos
            {currentQuestion.penalty ? ` • Penalidade: -${currentQuestion.penalty}` : ''}
          </div>
        </div>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors",
            currentIndex === 0
              ? "opacity-50 cursor-not-allowed"
              : theme === 'dark'
                ? "bg-white/10 text-gray-300 hover:bg-white/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex-1 text-center">
          {!isReviewing && (
            <span className={cn(
              "text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              {answeredCount}/{totalQuestions} respondidas
            </span>
          )}
        </div>

        {currentIndex === totalQuestions - 1 ? (
          isReviewing ? (
            <button
              onClick={onCancel}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-colors",
                theme === 'dark'
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              )}
            >
              Fechar
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={answeredCount < totalQuestions}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-colors",
                answeredCount < totalQuestions
                  ? "opacity-50 cursor-not-allowed bg-gray-500 text-white"
                  : theme === 'dark'
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "bg-yellow-500 text-white hover:bg-yellow-600"
              )}
            >
              Finalizar
            </button>
          )
        ) : (
          <button
            onClick={goToNext}
            className={cn(
              "flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors",
              theme === 'dark'
                ? "bg-white/10 text-gray-300 hover:bg-white/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botão cancelar */}
      {!isReviewing && (
        <button
          onClick={onCancel}
          className={cn(
            "w-full py-2 text-sm rounded-lg transition-colors",
            theme === 'dark'
              ? "text-gray-500 hover:text-gray-300"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          Cancelar quiz
        </button>
      )}
    </div>
  )
}


