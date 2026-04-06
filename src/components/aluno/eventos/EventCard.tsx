import { BookOpen, FolderKanban, GraduationCap, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ALUNO_EVENTO_TIPO_LABELS, type AlunoEvento, type AlunoEventoTipo } from '@/data/aluno-eventos'

const TIPO_ICONS: Record<AlunoEventoTipo, typeof Users> = {
  meetup: Users,
  clube_livro: BookOpen,
  projetos_reais: FolderKanban,
  mentoria: GraduationCap,
}

function formatEventDateParts(iso: string): { day: string; month: string } {
  const d = new Date(iso)
  const day = String(d.getDate())
  const monthRaw = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const month = monthRaw.slice(0, 3).toUpperCase()
  return { day, month }
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

type EventCardProps = {
  event: AlunoEvento
  isDark: boolean
}

export function EventCard({ event, isDark }: EventCardProps) {
  const { day, month } = formatEventDateParts(event.startAt)
  const timeRange = formatTimeRange(event.startAt, event.endAt)
  const tipoLabel = ALUNO_EVENTO_TIPO_LABELS[event.tipo]
  const TipoIcon = TIPO_ICONS[event.tipo]

  return (
    <article
      className={cn(
        'relative flex flex-col gap-4 rounded-2xl border p-4 transition-shadow sm:flex-row sm:gap-6 sm:p-5 md:rounded-3xl',
        isDark
          ? 'border-white/10 bg-[#161616]/90 shadow-sm shadow-black/20'
          : 'border-stone-200/90 bg-white/80 shadow-sm shadow-stone-200/40'
      )}
    >
      <div
        className={cn(
          'flex h-[5.5rem] w-full shrink-0 flex-col items-center justify-center rounded-xl border sm:h-auto sm:w-[5.75rem]',
          isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-stone-200 bg-[#ebe6dc]'
        )}
      >
        <span
          className={cn(
            'font-serif text-3xl font-bold leading-none tabular-nums md:text-[2rem]',
            isDark ? 'text-white' : 'text-stone-900'
          )}
        >
          {day}
        </span>
        <span
          className={cn(
            'mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
            isDark ? 'text-gray-500' : 'text-stone-600'
          )}
        >
          {month}
        </span>
      </div>

      <div className="min-w-0 flex-1 pr-0">
        <h3
          className={cn(
            'font-serif text-lg font-semibold leading-snug tracking-tight md:text-xl',
            isDark ? 'text-white' : 'text-stone-900'
          )}
        >
          {event.title}
        </h3>
        <div
          className={cn(
            'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm',
            isDark ? 'text-gray-500' : 'text-stone-600'
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <TipoIcon
              className={cn('h-3.5 w-3.5 shrink-0', isDark ? 'text-[#F2C94C]' : 'text-yellow-800')}
              aria-hidden
            />
            <span className={cn('font-medium', isDark ? 'text-gray-400' : 'text-stone-700')}>
              {tipoLabel}
            </span>
          </span>
          {event.seriesLabel ? (
            <>
              <span className="text-gray-500 dark:text-gray-500" aria-hidden>
                ·
              </span>
              <span className={cn('font-medium', isDark ? 'text-gray-400' : 'text-stone-700')}>
                {event.seriesLabel}
              </span>
            </>
          ) : null}
          <span className="text-gray-500 dark:text-gray-500" aria-hidden>
            ·
          </span>
          <time dateTime={event.startAt}>{timeRange}</time>
        </div>
        <p
          className={cn(
            'mt-3 text-sm leading-relaxed md:text-[0.95rem]',
            isDark ? 'text-gray-400' : 'text-stone-600'
          )}
        >
          {event.description}
        </p>
      </div>
    </article>
  )
}
