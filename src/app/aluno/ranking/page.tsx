'use client'

import { useState, useMemo } from 'react'
import { mockRanking } from '@/data/aluno/mockRanking'
import { mockUser } from '@/data/aluno/mockUser'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

type RankingType = 'mensal' | 'geral'

export default function RankingPage() {
  const { theme } = useTheme()
  const [rankingType, setRankingType] = useState<RankingType>('mensal')
  
  // Filtrar apenas alunos com accessLevel "full" e ordenar
  const filteredRanking = useMemo(() => {
    return mockRanking
      .filter(user => user.accessLevel === 'full')
      .sort((a, b) => {
        // Ordenar por XP mensal ou geral conforme o tipo selecionado
        const xpA = rankingType === 'mensal' ? a.xpMensal : a.xp
        const xpB = rankingType === 'mensal' ? b.xpMensal : b.xp
        return xpB - xpA
      })
      .map((user, index) => ({
        ...user,
        position: index + 1
      }))
  }, [rankingType])

  const top3 = filteredRanking.slice(0, 3)
  const currentUser = filteredRanking.find(u => u.id === mockUser.id)
  const currentUserPosition = currentUser?.position || 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Ranking
        </h1>
        <p className={cn(
          "text-sm md:text-base mb-4",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Ranking baseado em XP. Complete aulas, quizzes e desafios para subir de posição!
        </p>
        
        {/* Tabs Mensal/Geral */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setRankingType('mensal')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
              rankingType === 'mensal'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "bg-black/30 text-gray-400 border border-white/10 hover:bg-white/5"
                  : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setRankingType('geral')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
              rankingType === 'geral'
                ? theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
                : theme === 'dark'
                  ? "bg-black/30 text-gray-400 border border-white/10 hover:bg-white/5"
                  : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            )}
          >
            Geral
          </button>
        </div>
      </div>

      {/* Pódio */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        <h2 className={cn(
          "text-lg md:text-xl font-bold mb-4 md:mb-6 text-center",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Pódio
        </h2>
        <div className="flex items-end justify-center gap-2 md:gap-4 max-w-2xl mx-auto">
          {/* 2º Lugar */}
          {top3[1] && (
            <div className="flex-1 text-center min-w-0">
              <div className={cn(
                "backdrop-blur-sm border rounded-t-xl p-2 md:p-4 pb-6 md:pb-8 transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-gray-50 border-gray-200"
              )}>
                <Medal className={cn(
                  "w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2",
                  theme === 'dark' ? "text-gray-400" : "text-gray-500"
                )} />
                <div className={cn(
                  "w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-1 md:mb-2 flex items-center justify-center font-bold text-base md:text-xl",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-gray-400 to-gray-600 text-black"
                    : "bg-gradient-to-br from-gray-500 to-gray-600 text-white"
                )}>
                  {top3[1].name.charAt(0)}
                </div>
                <p className={cn(
                  "font-semibold text-sm md:text-base truncate px-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {top3[1].name}
                </p>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {top3[1].level}
                </p>
                <p className={cn(
                  "font-bold mt-1 md:mt-2 text-xs md:text-sm",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  {rankingType === 'mensal' ? top3[1].xpMensal : top3[1].xp} XP
                </p>
              </div>
              <div className={cn(
                "font-bold py-1 md:py-2 rounded-b-xl border text-xs md:text-sm transition-colors duration-300",
                theme === 'dark'
                  ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                  : "bg-yellow-100 text-yellow-700 border-yellow-300"
              )}>
                #2
              </div>
            </div>
          )}

          {/* 1º Lugar */}
          {top3[0] && (
            <div className="flex-1 text-center min-w-0">
              <div className={cn(
                "backdrop-blur-sm border rounded-t-xl p-2 md:p-4 pb-8 md:pb-12 transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-yellow-400/50"
                  : "bg-yellow-50 border-yellow-300"
              )}>
                <Trophy className={cn(
                  "w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )} />
                <div className={cn(
                  "w-14 h-14 md:w-20 md:h-20 rounded-full mx-auto mb-1 md:mb-2 flex items-center justify-center font-bold text-lg md:text-2xl",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                    : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
                )}>
                  {top3[0].name.charAt(0)}
                </div>
                <p className={cn(
                  "font-semibold text-sm md:text-base truncate px-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {top3[0].name}
                </p>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {top3[0].level}
                </p>
                <p className={cn(
                  "font-bold mt-1 md:mt-2 text-xs md:text-sm",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  {rankingType === 'mensal' ? top3[0].xpMensal : top3[0].xp} XP
                </p>
              </div>
              <div className={cn(
                "font-bold py-1 md:py-2 rounded-b-xl text-xs md:text-sm transition-colors duration-300",
                theme === 'dark'
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-500 text-white"
              )}>
                #1
              </div>
            </div>
          )}

          {/* 3º Lugar */}
          {top3[2] && (
            <div className="flex-1 text-center min-w-0">
              <div className={cn(
                "backdrop-blur-sm border rounded-t-xl p-2 md:p-4 pb-4 md:pb-6 transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-orange-50 border-orange-200"
              )}>
                <Award className="w-6 h-6 md:w-8 md:h-8 text-orange-500 mx-auto mb-1 md:mb-2" />
                <div className={cn(
                  "w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-1 md:mb-2 flex items-center justify-center font-bold text-base md:text-xl",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-orange-400 to-orange-600 text-black"
                    : "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                )}>
                  {top3[2].name.charAt(0)}
                </div>
                <p className={cn(
                  "font-semibold text-sm md:text-base truncate px-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {top3[2].name}
                </p>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {top3[2].level}
                </p>
                <p className={cn(
                  "font-bold mt-1 md:mt-2 text-xs md:text-sm",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  {rankingType === 'mensal' ? top3[2].xpMensal : top3[2].xp} XP
                </p>
              </div>
              <div className={cn(
                "font-bold py-1 md:py-2 rounded-b-xl border text-xs md:text-sm transition-colors duration-300",
                theme === 'dark'
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  : "bg-orange-100 text-orange-700 border-orange-300"
              )}>
                #3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ranking Completo */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
        theme === 'dark'
          ? "bg-black/20 border-white/10"
          : "bg-white border-yellow-400/90 shadow-md"
      )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 md:mb-4">
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Ranking Completo
          </h2>
          <div className={cn(
            "flex items-center gap-2 text-xs md:text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
            Atualizado hoje
          </div>
        </div>

        <div className="space-y-2">
          {filteredRanking.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg transition-all duration-300",
                user.id === mockUser.id
                  ? theme === 'dark'
                    ? "bg-yellow-400/10 backdrop-blur-sm border border-yellow-400/30"
                    : "bg-yellow-100 border border-yellow-300 shadow-sm"
                  : theme === 'dark'
                    ? "bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20"
                    : "bg-gray-50 border border-gray-200 hover:border-yellow-400 shadow-sm"
              )}
            >
              <div className={cn(
                "text-sm md:text-lg font-bold w-8 md:w-12 text-center flex-shrink-0",
                user.id === mockUser.id
                  ? theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  : theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                #{user.position}
              </div>
              
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0",
                theme === 'dark'
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                  : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
              )}>
                {user.name.charAt(0)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold text-sm md:text-base truncate",
                  user.id === mockUser.id
                    ? theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                    : theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {user.name}
                  {user.id === mockUser.id && ' (Você)'}
                </p>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {user.level}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "font-bold text-xs md:text-sm",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {(rankingType === 'mensal' ? user.xpMensal : user.xp).toLocaleString('pt-BR')} XP
                </p>
                <p className={cn(
                  "text-xs hidden md:block",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível {user.level}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

