'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Play,
  ChevronDown,
  ChevronUp,
  Target,
  GraduationCap
} from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { 
  mockCourseProgress, 
  generateStudyPlanFromCourses,
  getBlockTypeLabel,
  getBlockTypeIcon,
  type StudyPlan,
  type StudyBlock
} from '@/data/aluno/studyPlan'

export default function PlanoDeEstudosPage() {
  const { theme } = useTheme()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['day-1']))
  
  // Gerar plano de estudos a partir dos cursos
  const studyPlan: StudyPlan = generateStudyPlanFromCourses(mockCourseProgress)
  
  // Calcular estatísticas
  const totalCourses = mockCourseProgress.length
  const totalCompletedLessons = mockCourseProgress.reduce(
    (sum, course) => sum + course.completedLessons, 
    0
  )
  const totalDays = studyPlan.days.length
  
  // Contar blocos completados
  const totalBlocks = studyPlan.days.reduce((sum, day) => sum + day.blocks.length, 0)
  const completedBlocks = studyPlan.days.reduce(
    (sum, day) => sum + day.blocks.filter(b => b.isCompleted).length, 
    0
  )

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dayId)) {
        newSet.delete(dayId)
      } else {
        newSet.add(dayId)
      }
      return newSet
    })
  }

  const toggleBlock = (dayId: string, blockId: string) => {
    // TODO: no futuro, isso persistirá no backend
    // Por enquanto, apenas altera o estado local
    const day = studyPlan.days.find(d => d.id === dayId)
    if (day) {
      const block = day.blocks.find(b => b.id === blockId)
      if (block) {
        block.isCompleted = !block.isCompleted
        // Forçar re-render
        setExpandedDays(new Set(expandedDays))
      }
    }
  }

  return (
    <div className="space-y-4 md:space-y-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Plano de Estudos
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Acompanha o teu plano de estudo, organizado por dias e cursos.
        </p>
      </div>

      {/* Resumo do Aluno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-5 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              theme === 'dark' 
                ? "bg-yellow-400/20 text-yellow-400" 
                : "bg-yellow-100 text-yellow-600"
            )}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className={cn(
                "text-2xl md:text-3xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {totalCourses}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Cursos Ativos
              </p>
            </div>
          </div>
        </div>

        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-5 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              theme === 'dark' 
                ? "bg-green-500/20 text-green-400" 
                : "bg-green-100 text-green-600"
            )}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className={cn(
                "text-2xl md:text-3xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {totalCompletedLessons}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Aulas Concluídas
              </p>
            </div>
          </div>
        </div>

        <div className={cn(
          "backdrop-blur-md border rounded-xl p-4 md:p-5 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              theme === 'dark' 
                ? "bg-blue-500/20 text-blue-400" 
                : "bg-blue-100 text-blue-600"
            )}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className={cn(
                "text-2xl md:text-3xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {totalDays}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Dias do Plano
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cursos com Progresso */}
      <div className="space-y-4">
        <h2 className={cn(
          "text-lg md:text-xl font-bold",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Cursos Ativos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockCourseProgress.map((course) => {
            const progressPercentage = (course.completedLessons / course.totalLessons) * 100
            
            return (
              <div
                key={course.id}
                className={cn(
                  "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300",
                  theme === 'dark'
                    ? "bg-black/20 border-white/10 hover:border-yellow-400/50"
                    : "bg-white border-yellow-400/90 shadow-md hover:border-yellow-500 hover:shadow-lg"
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className={cn(
                        "w-5 h-5 flex-shrink-0",
                        theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                      )} />
                      <h3 className={cn(
                        "text-base md:text-lg font-semibold",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {course.name}
                      </h3>
                    </div>
                    {course.description && (
                      <p className={cn(
                        "text-sm mb-3 line-clamp-2",
                        theme === 'dark' ? "text-gray-400" : "text-gray-600"
                      )}>
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className={cn(
                    "flex items-center justify-between text-xs mb-2",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    <span>
                      {course.completedLessons} de {course.totalLessons} aulas
                    </span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className={cn(
                    "w-full h-2 backdrop-blur-sm rounded-full overflow-hidden",
                    theme === 'dark' ? "bg-black/30" : "bg-yellow-100"
                  )}>
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        theme === 'dark'
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                          : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                      )}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <button className={cn(
                  "w-full py-2 px-4 rounded-lg font-medium transition-all text-sm",
                  theme === 'dark'
                    ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/30"
                    : "bg-yellow-500 text-white hover:bg-yellow-600"
                )}>
                  {course.completedLessons > 0 ? 'Continuar Curso' : 'Ver Curso'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de Dias do Plano */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={cn(
            "text-lg md:text-xl font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Dias do Plano
          </h2>
          <div className={cn(
            "text-sm px-3 py-1 rounded-full border",
            theme === 'dark'
              ? "bg-black/30 border-white/10 text-gray-300"
              : "bg-yellow-50 border-yellow-400/70 text-gray-700"
          )}>
            {completedBlocks} de {totalBlocks} blocos concluídos
          </div>
        </div>

        {/* TODO: estes dias e blocos serão gerados automaticamente por um modelo/IA com base nos cursos do aluno. */}
        
        <div className="space-y-3">
          {studyPlan.days.map((day) => {
            const isExpanded = expandedDays.has(day.id)
            const completedBlocksInDay = day.blocks.filter(b => b.isCompleted).length
            const totalBlocksInDay = day.blocks.length
            
            return (
              <div
                key={day.id}
                className={cn(
                  "backdrop-blur-md border rounded-xl overflow-hidden transition-all duration-300",
                  theme === 'dark'
                    ? "bg-black/20 border-white/10"
                    : "bg-white border-yellow-400/90 shadow-md"
                )}
              >
                {/* Cabeçalho do Dia */}
                <button
                  onClick={() => toggleDay(day.id)}
                  className={cn(
                    "w-full p-4 md:p-5 flex items-center justify-between transition-colors",
                    isExpanded && "pb-4",
                    theme === 'dark'
                      ? "hover:bg-white/5"
                      : "hover:bg-yellow-50/50"
                  )}
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0",
                      theme === 'dark'
                        ? "bg-yellow-400/20 text-yellow-400"
                        : "bg-yellow-100 text-yellow-600"
                    )}>
                      {day.dayNumber}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className={cn(
                        "text-base md:text-lg font-semibold mb-1",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        Dia {day.dayNumber}
                      </h3>
                      {day.date && (
                        <p className={cn(
                          "text-xs md:text-sm",
                          theme === 'dark' ? "text-gray-400" : "text-gray-600"
                        )}>
                          {new Date(day.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      )}
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-1 rounded-full border flex-shrink-0",
                      theme === 'dark'
                        ? "bg-black/30 border-white/10 text-gray-300"
                        : "bg-yellow-50 border-yellow-400/70 text-gray-700"
                    )}>
                      {completedBlocksInDay}/{totalBlocksInDay} blocos
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className={cn(
                      "w-5 h-5 flex-shrink-0 ml-2",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )} />
                  ) : (
                    <ChevronDown className={cn(
                      "w-5 h-5 flex-shrink-0 ml-2",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )} />
                  )}
                </button>

                {/* Blocos do Dia */}
                {isExpanded && (
                  <div className={cn(
                    "px-4 md:px-6 pt-4 md:pt-5 pb-5 md:pb-6 space-y-4 border-t",
                    theme === 'dark' ? "border-white/10" : "border-yellow-400/30"
                  )}>
                    {day.blocks.map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "p-4 md:p-5 rounded-lg border transition-all",
                          block.isCompleted
                            ? theme === 'dark'
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-green-50 border-green-300"
                            : theme === 'dark'
                              ? "bg-black/30 border-white/10 hover:border-yellow-400/50"
                              : "bg-yellow-50/50 border-yellow-400/70 hover:border-yellow-500/80"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleBlock(day.id, block.id)}
                            className={cn(
                              "w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                              block.isCompleted
                                ? theme === 'dark'
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "bg-green-500 border-green-500 text-white"
                                : theme === 'dark'
                                  ? "border-white/30 hover:border-yellow-400"
                                  : "border-gray-300 hover:border-yellow-500"
                            )}
                          >
                            {block.isCompleted && (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-lg">{getBlockTypeIcon(block.type)}</span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full border",
                                theme === 'dark'
                                  ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-300"
                              )}>
                                {getBlockTypeLabel(block.type)}
                              </span>
                              {block.courseId && (
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full border truncate",
                                  theme === 'dark'
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-blue-100 text-blue-700 border-blue-300"
                                )}>
                                  {mockCourseProgress.find(c => c.id === block.courseId)?.name || block.courseId}
                                </span>
                              )}
                            </div>
                            
                            <h4 className={cn(
                              "font-semibold text-base",
                              theme === 'dark' ? "text-white" : "text-gray-900"
                            )}>
                              {block.title}
                            </h4>
                            
                            {block.description && (
                              <p className={cn(
                                "text-sm leading-relaxed",
                                theme === 'dark' ? "text-gray-400" : "text-gray-600"
                              )}>
                                {block.description}
                              </p>
                            )}
                            
                            {block.estimatedMinutes && (
                              <div className="flex items-center gap-1.5 text-xs pt-1">
                                <Clock className={cn(
                                  "w-3.5 h-3.5",
                                  theme === 'dark' ? "text-gray-500" : "text-gray-500"
                                )} />
                                <span className={cn(
                                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                                )}>
                                  ~{block.estimatedMinutes} min
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
