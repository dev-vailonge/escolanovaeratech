'use client'

import { mockUser } from '@/data/aluno/mockUser'
import { mockStats } from '@/data/aluno/mockStats'
import { mockRanking } from '@/data/aluno/mockRanking'
import ProgressCard from '@/components/aluno/ProgressCard'
import { BookOpen, Trophy, HelpCircle, Target, Clock, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

export default function AlunoDashboard() {
  const user = mockUser
  const stats = mockStats
  const topRanking = mockRanking.slice(0, 3)
  const { theme } = useTheme()

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className={cn(
        "backdrop-blur-md bg-gradient-to-r rounded-xl p-4 md:p-6 border transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 from-yellow-400/10 to-transparent border-yellow-400/20"
          : "bg-yellow-50/80 from-yellow-100/50 to-transparent border-yellow-400/90 shadow-md"
      )}>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Olá, {user.name}! 👋
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-700"
        )}>
          Continue sua jornada de aprendizado e suba no ranking!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProgressCard
          title="Aulas"
          current={stats.aulasCompletas}
          total={stats.aulasTotais}
          icon={<BookOpen className="w-6 h-6 text-yellow-500" />}
          color="yellow"
        />
        <ProgressCard
          title="Quiz"
          current={stats.quizCompletos}
          total={stats.quizTotais}
          icon={<HelpCircle className="w-6 h-6 text-blue-500" />}
          color="blue"
        />
        <ProgressCard
          title="Desafios"
          current={stats.desafiosConcluidos}
          total={stats.desafiosTotais}
          icon={<Target className="w-6 h-6 text-green-500" />}
          color="green"
        />
      </div>

      {/* Quick Actions & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions */}
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <h2 className={cn(
            "text-lg md:text-xl font-bold mb-3 md:mb-4",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Ações Rápidas
          </h2>
          <div className="space-y-2 md:space-y-3">
            <Link
              href="/aluno/aulas"
              className={cn(
                "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg hover:border-yellow-400/50 transition-all active:scale-[0.98] min-h-[72px]",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50/50 border-yellow-400/70 hover:border-yellow-500/80"
              )}
            >
              <BookOpen className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm md:text-base truncate",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Continuar Assistindo
                </p>
                <p className={cn(
                  "text-xs md:text-sm truncate",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  CSS Avançado com Flexbox
                </p>
              </div>
            </Link>
            <Link
              href="/aluno/quiz"
              className={cn(
                "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg hover:border-yellow-400/50 transition-all active:scale-[0.98] min-h-[72px]",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50/50 border-yellow-400/70 hover:border-yellow-500/80"
              )}
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm md:text-base truncate",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Novo Quiz Disponível
                </p>
                <p className={cn(
                  "text-xs md:text-sm truncate",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  JavaScript Fundamentos
                </p>
              </div>
            </Link>
            <Link
              href="/aluno/desafios"
              className={cn(
                "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg hover:border-yellow-400/50 transition-all active:scale-[0.98] min-h-[72px]",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50/50 border-yellow-400/70 hover:border-yellow-500/80"
              )}
            >
              <Target className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm md:text-base truncate",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  Desafio da Semana
                </p>
                <p className={cn(
                  "text-xs md:text-sm truncate",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Crie um Card Interativo
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Top Ranking */}
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className={cn(
              "text-lg md:text-xl font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Top Ranking
            </h2>
            <Link
              href="/aluno/ranking"
              className={cn(
                "text-xs md:text-sm hover:opacity-80 transition-opacity",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
              )}
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2 md:space-y-3">
            {topRanking.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-2 md:gap-3 p-3 md:p-4 backdrop-blur-sm border rounded-lg transition-colors duration-300 min-h-[72px]",
                  theme === 'dark'
                    ? "bg-black/30 border-white/10"
                    : "bg-yellow-50/80 border-yellow-400/70"
                )}
              >
                <div className={cn(
                  "text-lg md:text-2xl font-bold w-6 md:w-8 text-center",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  #{user.position}
                </div>
                <div className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                    : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
                )}>
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm md:text-base truncate",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {user.name}
                  </p>
                  <p className={cn(
                    "text-xs md:text-sm truncate",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Nível {user.level} • {user.xp} XP
                  </p>
                </div>
                {index === 0 && (
                  <Trophy className={cn(
                    "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-700"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-400 flex-shrink-0" />
            <h3 className={cn(
              "text-base md:text-lg font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Tempo de Estudo
            </h3>
          </div>
          <p className={cn(
            "text-2xl md:text-3xl font-bold mb-1",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {Math.floor(stats.tempoEstudo / 60)}h {stats.tempoEstudo % 60}m
          </p>
          <p className={cn(
            "text-xs md:text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Total acumulado este mês
          </p>
        </div>

        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400 flex-shrink-0" />
            <h3 className={cn(
              "text-base md:text-lg font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Comunidade
            </h3>
          </div>
          <p className={cn(
            "text-2xl md:text-3xl font-bold mb-1",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {stats.participacaoComunidade}
          </p>
          <p className={cn(
            "text-xs md:text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Contribuições este mês
          </p>
        </div>
      </div>
    </div>
  )
}

