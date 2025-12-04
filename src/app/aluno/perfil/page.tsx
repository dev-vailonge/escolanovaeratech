'use client'

import { mockUser } from '@/data/aluno/mockUser'
import { mockStats } from '@/data/aluno/mockStats'
import { mockCourseProgress } from '@/data/aluno/studyPlan'
import { Edit2, BookOpen, GraduationCap } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

export default function PerfilPage() {
  const user = mockUser
  const stats = mockStats
  const courses = mockCourseProgress
  const { theme } = useTheme()

  // Calcular progresso de estudo
  const completedLessons = stats.aulasCompletas
  const activeCourses = courses.length
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0)

  // TODO: Futuramente exibir badges conquistados pelo aluno.
  // A API ainda não está definida.

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

      <div className="space-y-4 md:space-y-6">
        {/* Informações do Usuário */}
        <div className="space-y-4 md:space-y-6">
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
                  Nível Atual
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

          {/* Progresso de Estudo */}
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
              Progresso de Estudo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className={cn(
                "p-3 md:p-4 backdrop-blur-sm rounded-lg border transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50 border-yellow-400/80"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className={cn(
                    "w-4 h-4",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )} />
                  <p className={cn(
                    "text-xs md:text-sm font-medium",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Aulas concluídas
                  </p>
                </div>
                <p className={cn(
                  "text-2xl md:text-3xl font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {completedLessons}
                </p>
              </div>
              <div className={cn(
                "p-3 md:p-4 backdrop-blur-sm rounded-lg border transition-colors duration-300",
                theme === 'dark'
                  ? "bg-black/30 border-white/10"
                  : "bg-yellow-50 border-yellow-400/80"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className={cn(
                    "w-4 h-4",
                    theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                  )} />
                  <p className={cn(
                    "text-xs md:text-sm font-medium",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Cursos ativos
                  </p>
                </div>
                <p className={cn(
                  "text-2xl md:text-3xl font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {activeCourses}
                </p>
              </div>
              {totalLessons > 0 && (
                <div className={cn(
                  "p-3 md:p-4 backdrop-blur-sm rounded-lg border transition-colors duration-300",
                  theme === 'dark'
                    ? "bg-black/30 border-white/10"
                    : "bg-yellow-50 border-yellow-400/80"
                )}>
                  <p className={cn(
                    "text-xs md:text-sm font-medium mb-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Progresso geral
                  </p>
                  <p className={cn(
                    "text-2xl md:text-3xl font-bold",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {completedLessons}/{totalLessons}
                  </p>
                </div>
              )}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
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
                  Quiz completos
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {stats.quizCompletos}
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
                  Desafios concluídos
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {stats.desafiosConcluidos}
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
                  Taxa de acerto
                </p>
                <p className={cn(
                  "text-xl md:text-2xl font-bold mt-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {Math.round((stats.respostasCorretas / stats.questoesTotais) * 100)}%
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  theme === 'dark' ? "text-gray-500" : "text-gray-500"
                )}>
                  {stats.respostasCorretas} de {stats.questoesTotais} questões
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

