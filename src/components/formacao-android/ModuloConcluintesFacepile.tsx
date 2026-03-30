'use client'

import { cn } from '@/lib/utils'
import { SubmittersFacepile, type FacepilePerson } from '@/components/ui/SubmittersFacepile'
import type { CursoModuloSubmitter } from '@/lib/hooks/useCursoModulosSubmittersSummary'

const MAX_VISIBLE = 5

export function ModuloConcluintesFacepile({
  submitters,
  totalCount,
  isDark,
  className,
  maxVisible = MAX_VISIBLE,
  /** Fundo sempre escuro (ex.: card 10D): avatares sem borda clara + legenda legível */
  variant = 'default',
  label = 'Concluídos',
  labelVariant = 'eyebrow',
}: {
  submitters: CursoModuloSubmitter[]
  totalCount: number
  isDark: boolean
  className?: string
  maxVisible?: number
  variant?: 'default' | 'onDarkSurface'
  label?: string
  /** `eyebrow`: caixa alta pequena nos cards; `sentence`: frase normal (ex.: página de detalhe) */
  labelVariant?: 'eyebrow' | 'sentence'
}) {
  if (totalCount <= 0) return null

  const people: FacepilePerson[] = submitters.map((s) => ({
    id: s.userId,
    name: s.name,
    avatarUrl: s.avatarUrl,
  }))

  const extra = Math.max(0, totalCount - maxVisible)
  const pileIsDark = variant === 'onDarkSurface' ? true : isDark
  const extraTextClass =
    variant === 'onDarkSurface'
      ? 'text-gray-400'
      : isDark
        ? 'text-gray-400'
        : 'text-gray-600'
  const labelClassEyebrow = variant === 'onDarkSurface' ? 'text-[#9ca3af]' : 'text-[#828282]'
  const labelClassSentence =
    variant === 'onDarkSurface'
      ? 'text-gray-400'
      : isDark
        ? 'text-gray-400'
        : 'text-gray-600'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span
        className={cn(
          labelVariant === 'sentence'
            ? cn('text-sm font-medium leading-snug', labelClassSentence)
            : cn('text-[10px] font-bold uppercase tracking-wider', labelClassEyebrow)
        )}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 min-h-[1.75rem]">
        <SubmittersFacepile
          people={people}
          maxVisible={maxVisible}
          showOverflowCircle={false}
          isDark={pileIsDark}
          showRing={variant !== 'onDarkSurface'}
        />
        {extra > 0 && (
          <span className={cn('text-[11px] font-semibold leading-tight', extraTextClass)}>
            +{extra} {extra === 1 ? 'pessoa concluiu' : 'pessoas concluíram'}
          </span>
        )}
      </div>
    </div>
  )
}
