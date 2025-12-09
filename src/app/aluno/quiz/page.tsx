'use client'

import { mockQuiz } from '@/data/aluno/mockQuiz'
import { mockUser } from '@/data/aluno/mockUser'
import { HelpCircle, Clock, CheckCircle2, Circle, Play, Trophy, Lock } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { hasFullAccess } from '@/lib/types/auth'

export default function QuizPage() {
  const quizes = mockQuiz
  const { theme } = useTheme()
  const user = mockUser
  const canParticipate = hasFullAccess({ ...user, role: user.role as 'aluno' | 'admin', accessLevel: user.accessLevel })

  const quizesCompletos = quizes.filter(q => q.completo).length
  const quizesDisponiveis = quizes.filter(q => q.disponivel && !q.completo).length
  const totalQuizesDisponiveis = quizes.filter(q => q.disponivel).length

  return (
    <div className="space-y-4 md:space-y-6">
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
        {quizes.map((quiz) => (
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
                  {!quiz.disponivel && (
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border whitespace-nowrap",
                      theme === 'dark'
                        ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    )}>
                      Em breve
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
                    {quiz.questoes} questões
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

              {!canParticipate && (
                <div className={cn(
                  "mb-3 p-3 rounded-lg text-sm",
                  theme === 'dark'
                    ? "bg-yellow-400/10 border border-yellow-400/30 text-yellow-400"
                    : "bg-yellow-50 border border-yellow-300 text-yellow-700"
                )}>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Upgrade sua conta para participar de quizzes e ganhar XP</span>
                  </div>
                </div>
              )}
              <button 
                className={cn(
                  "btn-primary w-full md:w-auto mt-2 md:mt-0",
                  !canParticipate && "opacity-50 cursor-not-allowed"
                )}
                disabled={!quiz.disponivel || !canParticipate}
              >
                {!canParticipate 
                  ? 'Acesso Limitado' 
                  : quiz.completo 
                    ? 'Refazer' 
                    : quiz.disponivel 
                      ? 'Iniciar Quiz' 
                      : 'Em breve'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

