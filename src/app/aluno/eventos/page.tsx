'use client'

import { useMemo, useState } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import {
  ALUNO_EVENTO_TIPOS,
  ALUNO_EVENTO_TIPO_LABELS,
  type AlunoEventoTipo,
} from '@/data/aluno-eventos'
import { EventCard } from '@/components/aluno/eventos/EventCard'
import { useAlunoEventosList } from '@/lib/hooks/useAlunoEventosList'

export default function AlunoEventosPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { eventos: allEventos, loading, error } = useAlunoEventosList()
  const [filterOpen, setFilterOpen] = useState(false)
  const [tipoFilter, setTipoFilter] = useState<AlunoEventoTipo | null>(null)

  const filtered = useMemo(
    () => (tipoFilter ? allEventos.filter((e) => e.tipo === tipoFilter) : allEventos),
    [allEventos, tipoFilter]
  )

  const emptyMessage =
    tipoFilter != null
      ? 'Nenhum evento deste tipo. Escolha outro filtro.'
      : 'Nenhum evento agendado no momento.'

  return (
    <div
      className={cn(
        'min-h-[70vh] pb-20 md:pb-28',
        isDark ? 'bg-[#0e0e0e]' : 'bg-[#f2ede4]'
      )}
    >
      <div className="mx-auto max-w-3xl px-4 pt-6 md:max-w-4xl md:px-6 md:pt-10">
        <header className="mt-0 md:mt-1">
          <h1
            className={cn(
              'font-serif text-[2.25rem] font-semibold leading-[1.08] tracking-tight md:text-5xl',
              isDark ? 'text-white' : 'text-stone-900'
            )}
          >
            Eventos
          </h1>
          <p
            className={cn(
              'mt-4 max-w-2xl text-base leading-relaxed md:text-lg',
              isDark ? 'text-gray-400' : 'text-stone-600'
            )}
          >
            Participe dos eventos da Escola Nova Era Tech, ganhe XP por participar e melhore seu ranking.
          </p>
        </header>

        <div className="relative mt-10 flex flex-wrap items-center justify-between gap-3 md:mt-14">
          <h2
            className={cn(
              'font-serif text-xl font-semibold md:text-2xl',
              isDark ? 'text-white' : 'text-stone-900'
            )}
          >
            Todos os eventos
          </h2>
          <div className="relative">
            <button
              type="button"
              disabled={loading || !!error}
              onClick={() => setFilterOpen((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50',
                isDark
                  ? 'border-white/15 bg-white/5 text-gray-200 hover:bg-white/10'
                  : 'border-stone-300 bg-white/70 text-stone-800 hover:bg-white'
              )}
              aria-expanded={filterOpen}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filtrar
            </button>
            {filterOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default bg-transparent"
                  aria-label="Fechar filtro"
                  onClick={() => setFilterOpen(false)}
                />
                <div
                  className={cn(
                    'absolute right-0 top-full z-20 mt-2 min-w-[220px] rounded-xl border py-2 shadow-lg',
                    isDark
                      ? 'border-white/10 bg-[#1a1a1a]'
                      : 'border-stone-200 bg-white shadow-stone-300/50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTipoFilter(null)
                      setFilterOpen(false)
                    }}
                    className={cn(
                      'flex w-full px-4 py-2.5 text-left text-sm font-medium',
                      tipoFilter === null
                        ? isDark
                          ? 'bg-white/10 text-[#F2C94C]'
                          : 'bg-yellow-50 text-yellow-900'
                        : isDark
                          ? 'text-gray-300 hover:bg-white/5'
                          : 'text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    Todos os tipos
                  </button>
                  {ALUNO_EVENTO_TIPOS.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => {
                        setTipoFilter(tipo)
                        setFilterOpen(false)
                      }}
                      className={cn(
                        'flex w-full px-4 py-2.5 text-left text-sm',
                        tipoFilter === tipo
                          ? isDark
                            ? 'bg-white/10 font-semibold text-[#F2C94C]'
                            : 'bg-yellow-50 font-semibold text-yellow-900'
                          : isDark
                            ? 'text-gray-300 hover:bg-white/5'
                            : 'text-stone-700 hover:bg-stone-50'
                      )}
                    >
                      {ALUNO_EVENTO_TIPO_LABELS[tipo]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {error ? (
          <div
            className={cn(
              'mt-8 rounded-2xl border p-6 text-sm md:text-base',
              isDark
                ? 'border-red-500/30 bg-red-950/20 text-red-200'
                : 'border-red-200 bg-red-50 text-red-900'
            )}
          >
            {error}
          </div>
        ) : loading ? (
          <div
            className={cn(
              'mt-12 flex items-center justify-center gap-2 text-sm',
              isDark ? 'text-gray-400' : 'text-stone-600'
            )}
          >
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            Carregando eventos…
          </div>
        ) : (
          <ul className="mt-8 flex list-none flex-col gap-4 md:mt-10 md:gap-5">
            {filtered.length === 0 ? (
              <li
                className={cn(
                  'rounded-2xl border p-8 text-center text-sm',
                  isDark ? 'border-white/10 text-gray-500' : 'border-stone-200 text-stone-600'
                )}
              >
                {emptyMessage}
              </li>
            ) : (
              filtered.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} isDark={isDark} />
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
