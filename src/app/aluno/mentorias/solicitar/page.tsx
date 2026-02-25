'use client'

import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

export default function SolicitarMentoriaPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <section className="max-w-xl mx-auto space-y-6">
      <div>
        <h1
          className={cn(
            'text-xl md:text-2xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          Solicitar mentoria individual
        </h1>
        <p
          className={cn(
            'text-sm md:text-base',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          Nesta versão estamos apenas simulando a interface. Em breve, este
          formulário vai enviar seu interesse para o time da escola.
        </p>
      </div>

      <div
        className={cn(
          'rounded-2xl border p-4 md:p-6 space-y-3',
          isDark
            ? 'bg-black/40 border-white/10'
            : 'bg-yellow-500/10 border-yellow-400/50'
        )}
      >
        <p
          className={cn(
            'text-sm',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          Aqui você poderá contar um pouco sobre seu momento, sua rotina e o
          que espera da mentoria. Usaremos essas informações para entender se a
          mentoria individual com o Rock faz sentido para você agora.
        </p>
      </div>
    </section>
  )
}

