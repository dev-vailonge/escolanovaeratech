'use client'

import { mockAulas } from '@/data/aluno/mockAulas'
import { BookOpen, Clock, CheckCircle2, Circle, Play } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

export default function AulasPage() {
  const aulas = mockAulas
  const { theme } = useTheme()

  const aulasCompletas = aulas.filter(a => a.completa).length
  const aulasEmProgresso = aulas.filter(a => a.progresso > 0 && !a.completa).length
  const aulasPendentes = aulas.filter(a => a.progresso === 0).length

  // Agrupar aulas por módulo
  const aulasPorModulo = aulas.reduce((acc, aula) => {
    const modulo = aula.modulo || 'Outros'
    if (!acc[modulo]) {
      acc[modulo] = []
    }
    acc[modulo].push(aula)
    return acc
  }, {} as Record<string, typeof aulas>)

  return (
    <div className="space-y-4 md:space-y-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
      {/* Header */}
      <div>
        <h1 className={cn(
          "text-2xl md:text-3xl font-bold mb-2",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Aulas
        </h1>
        <p className={cn(
          "text-sm md:text-base",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Construa a tua carreira em tecnologia com cursos modernos, práticos e orientados ao mercado
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className={cn(
          "backdrop-blur-md border rounded-xl p-3 md:p-4 transition-colors duration-300",
          theme === 'dark'
            ? "bg-black/20 border-white/10"
            : "bg-white border-yellow-400/90 shadow-md"
        )}>
          <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
            <div className="text-center md:text-left">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {aulasCompletas}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Completas
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
          <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3">
            <Play className={cn(
              "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
              theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
            )} />
            <div className="text-center md:text-left">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {aulasEmProgresso}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Em Progresso
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
          <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3">
            <Circle className={cn(
              "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
              theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )} />
            <div className="text-center md:text-left">
              <p className={cn(
                "text-xl md:text-2xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {aulasPendentes}
              </p>
              <p className={cn(
                "text-xs md:text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Pendentes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Aulas Agrupadas por Módulo */}
      <div className="space-y-6 md:space-y-8">
        <h2 className={cn(
          "text-lg md:text-xl font-bold",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          Todos os Cursos — Escola Nova Era Tech
        </h2>
        
        {Object.entries(aulasPorModulo).map(([modulo, aulasDoModulo]) => (
          <div key={modulo} className="space-y-3 md:space-y-4">
            <h3 className={cn(
              "text-base md:text-lg font-semibold pb-2 border-b",
              theme === 'dark' 
                ? "text-yellow-400 border-white/10" 
                : "text-yellow-600 border-yellow-400/30"
            )}>
              {modulo}
            </h3>
            {aulasDoModulo.map((aula) => (
              <div
                key={aula.id}
                className={cn(
                  "backdrop-blur-md border rounded-xl p-4 md:p-6 transition-all duration-300",
                  theme === 'dark'
                    ? "bg-black/20 border-white/10 hover:border-yellow-400/50"
                    : "bg-white border-yellow-400/90 shadow-md hover:border-yellow-500 hover:shadow-lg"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <BookOpen className={cn(
                        "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                        theme === 'dark' ? "text-yellow-400" : "text-yellow-600"
                      )} />
                      <h3 className={cn(
                        "text-base md:text-lg font-semibold flex-1 min-w-0",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                      )}>
                        {aula.titulo}
                      </h3>
                      {aula.completa && (
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full border whitespace-nowrap",
                          theme === 'dark'
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-green-100 text-green-700 border-green-300"
                        )}>
                          Completa
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm md:text-base mb-3 md:mb-4 line-clamp-2",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      {aula.descricao}
                    </p>
                    
                    <div className={cn(
                      "flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-3",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        {aula.duracao} min
                      </span>
                      <span className="capitalize">{aula.nivel}</span>
                      <span className="truncate">{aula.categoria}</span>
                    </div>

                    {/* Progress Bar */}
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
                        style={{ width: `${aula.progresso}%` }}
                      />
                    </div>
                    <div className={cn(
                      "flex items-center justify-between mt-2 text-xs",
                      theme === 'dark' ? "text-gray-400" : "text-gray-600"
                    )}>
                      <span>{aula.progresso}% completo</span>
                      {aula.xpGanho && <span>+{aula.xpGanho} XP</span>}
                    </div>
                  </div>

                  <button className="btn-primary w-full md:w-auto mt-2 md:mt-0">
                    {aula.completa ? 'Revisar' : aula.progresso > 0 ? 'Continuar' : 'Começar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

