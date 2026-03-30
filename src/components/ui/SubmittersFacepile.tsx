'use client'

import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FacepilePerson = {
  id: string
  name?: string | null
  avatarUrl?: string | null
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[10px] border-2',
  md: 'w-9 h-9 text-xs border-2',
} as const

export function SubmittersFacepile({
  people,
  maxVisible = 5,
  size = 'sm',
  className,
  isDark,
  emptyLabel,
  showOverflowCircle = true,
  /** Quando false, a borda dos círculos fica transparente (ex.: facepile em fundo escuro) */
  showRing = true,
}: {
  people: FacepilePerson[]
  maxVisible?: number
  size?: keyof typeof sizeClasses
  className?: string
  isDark: boolean
  /** Quando count > 0 mas lista vazia (loading) */
  emptyLabel?: string
  /** Quando false, não renderiza o círculo +N (ex.: legenda ao lado com outro texto) */
  showOverflowCircle?: boolean
  showRing?: boolean
}) {
  const sc = sizeClasses[size]
  const visible = people.slice(0, maxVisible)
  const extra = Math.max(0, people.length - maxVisible)

  if (people.length === 0) {
    if (!emptyLabel) return null
    return (
      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500', className)}>{emptyLabel}</span>
    )
  }

  const ring = !showRing ? 'border-transparent' : isDark ? 'border-gray-900' : 'border-white'

  return (
    <div className={cn('flex items-center', className)} title={people.map((p) => p.name || 'Aluno').join(', ')}>
      <div className="flex items-center">
        {visible.map((p, idx) => (
          <div
            key={p.id}
            className={cn('rounded-full overflow-hidden shrink-0 relative', ring, sc, idx > 0 && '-ml-2')}
            style={{ zIndex: idx }}
          >
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center',
                  isDark ? 'bg-white/10' : 'bg-gray-300'
                )}
              >
                <User className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-600')} />
              </div>
            )}
          </div>
        ))}
        {showOverflowCircle && extra > 0 && (
          <div
            className={cn(
              'rounded-full flex items-center justify-center font-semibold shrink-0 -ml-2 relative',
              sc,
              ring,
              isDark ? 'bg-white/15 text-gray-200' : 'bg-gray-200 text-gray-700'
            )}
            style={{ zIndex: visible.length }}
            aria-label={`Mais ${extra} pessoas`}
          >
            +{extra}
          </div>
        )}
      </div>
    </div>
  )
}
