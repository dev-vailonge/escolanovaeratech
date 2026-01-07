'use client'

import { BookOpen } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

export default function AulasPage() {
  const { theme } = useTheme()

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

      {/* Mensagem "Em breve" */}
      <div className={cn(
        "backdrop-blur-md border rounded-xl p-8 md:p-12 text-center transition-colors duration-300",
        theme === 'dark'
          ? "bg-gray-800/30 border-white/10"
          : "bg-yellow-500/10 border-yellow-400/90 shadow-md"
      )}>
        <div className="max-w-md mx-auto">
          <div className={cn(
            "w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-4 md:mb-6 flex items-center justify-center",
            theme === 'dark'
              ? "bg-yellow-400/20 text-yellow-400"
              : "bg-yellow-100 text-yellow-600"
          )}>
            <BookOpen className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className={cn(
            "text-xl md:text-2xl font-bold mb-3 md:mb-4",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Em breve
          </h2>
          <p className={cn(
            "text-sm md:text-base leading-relaxed",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Estamos preparando um plano de estudos personalizado com inteligência artificial. 
            Em breve você terá acesso a um plano completo e adaptado ao seu ritmo de aprendizado.
          </p>
        </div>
      </div>
    </div>
  )
}
