'use client'

import { mockUser } from '@/data/aluno/mockUser'
import { mockBadges } from '@/data/aluno/mockBadges'
import { mockStats } from '@/data/aluno/mockStats'
import { User, Trophy, Calendar, Edit2, Award } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

export default function PerfilPage() {
  const user = mockUser
  const badges = mockBadges
  const stats = mockStats
  const { theme } = useTheme()

  const badgesDesbloqueadas = badges.filter(b => b.desbloqueada)
  const badgesBloqueadas = badges.filter(b => !b.desbloqueada)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Meu Perfil
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Gerencie suas informações e veja suas conquistas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Informações do Usuário */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Card de Perfil */}
          <div className={cn(
            "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
            theme === 'dark'
              ? "bg-black/20 border-white/10"
              : "bg-white border-yellow-400/90 shadow-md"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 md:mb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-bold text-2xl md:text-3xl flex-shrink-0",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                    : "bg-gradient-to-br from-yellow-600 to-yellow-700 text-white"
                )}>
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={cn(
                    "text-xl md:text-2xl font-bold truncate",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {user.name}
                  </h2>
                  <p className={cn(
                    "text-sm md:text-base truncate",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {user.email}
                  </p>
                  <p className={cn(
                    "text-xs md:text-sm mt-1",
                    theme === 'dark' ? "text-gray-500" : "text-gray-500"
                  )}>
                    Membro desde {new Date(user.joinDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            </div>

            {user.bio && (
              <p className={cn(
                "mb-4",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                {user.bio}
              </p>
            )}

            <div className={cn(
              "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4 border-t",
              theme === 'dark' ? "border-white/10" : "border-yellow-400/90"
            )}>
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Nível
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {user.level}
                </p>
              </div>
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  XP
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {user.xp.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Moedas
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold",
                  theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                )}>
                  {user.coins}
                </p>
              </div>
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Streak
                </p>
                <p className="text-xl md:text-2xl font-bold text-orange-500">{user.streak} 🔥</p>
              </div>
            </div>
          </div>

          {/* Estatísticas Detalhadas */}
          <div className={cn(
            "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
            theme === 'dark'
              ? "bg-black/20 border-white/10"
              : "bg-white border-yellow-400/90 shadow-md"
          )}>
            <h3 className={cn(
              "text-lg md:text-xl font-bold mb-3 md:mb-4",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              Estatísticas
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className={cn(
                "p-3 md:p-4 backdrop-blur-sm rounded-lg border transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50 border-yellow-400/80"
              )}>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Aulas Completas
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {stats.aulasCompletas}/{stats.aulasTotais}
                </p>
              </div>
              <div className={cn(
                "p-3 md:p-4 backdrop-blur-sm rounded-lg border transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50 border-yellow-400/80"
              )}>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Quiz Completos
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {stats.quizCompletos}/{stats.quizTotais}
                </p>
              </div>
              <div className={cn(
                "p-3 md:p-4 backdrop-blur-sm rounded-lg border transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50 border-yellow-400/80"
              )}>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Desafios
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {stats.desafiosConcluidos}/{stats.desafiosTotais}
                </p>
              </div>
              <div className={cn(
                "p-3 md:p-4 backdrop-blur-sm rounded-lg border transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50 border-yellow-400/80"
              )}>
                <p className={cn(
                  "text-xs md:text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Taxa de Acerto
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {Math.round((stats.respostasCorretas / stats.questoesTotais) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-4 md:space-y-6">
          <div className={cn(
            "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-colors duration-300",
            theme === 'dark'
              ? "bg-black/20 border-white/10"
              : "bg-white border-yellow-400/90 shadow-md"
          )}>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Award className={cn(
                "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
              )} />
              <h3 className={cn(
                "text-lg md:text-xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Badges
              </h3>
            </div>
            <p className={cn(
              "text-xs md:text-sm mb-3 md:mb-4",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>
              {badgesDesbloqueadas.length} de {badges.length} desbloqueadas
            </p>

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all",
                    badge.desbloqueada
                      ? theme === 'dark'
                        ? "bg-yellow-400/10 backdrop-blur-sm border-yellow-400/30"
                        : "bg-yellow-100 border-yellow-300"
                      : theme === 'dark'
                        ? "bg-black/30 backdrop-blur-sm border-white/10 opacity-50"
                        : "bg-gray-100 border-gray-200 opacity-50"
                  )}
                  title={badge.nome}
                >
                  <div className="text-2xl mb-1">{badge.icone}</div>
                  {badge.desbloqueada && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

