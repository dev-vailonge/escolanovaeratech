'use client'

import { Baby, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProjetoRealPhonePreview({
  variant,
  isDark,
  compact = false,
}: {
  variant: 'lake' | 'ai-shopping'
  isDark: boolean
  /** Versão menor para listas horizontais (hub de projetos) */
  compact?: boolean
}) {
  if (variant === 'lake') {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center',
          compact
            ? 'min-h-[148px] p-3 sm:min-h-[168px] sm:p-4'
            : 'min-h-[220px] p-6 md:min-h-[280px] md:p-8',
          isDark
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-[#0a0a0a]'
            : 'bg-gradient-to-br from-emerald-100/90 via-white to-slate-100'
        )}
      >
        <div
          className={cn(
            'relative shrink-0 overflow-hidden rounded-[1.65rem] shadow-2xl',
            compact ? 'w-[6.5rem] rounded-[1.2rem] border-[4px]' : 'w-[9.25rem] border-[6px]',
            isDark ? 'border-zinc-600 bg-white' : 'border-gray-400 bg-white'
          )}
        >
          <div
            className={cn(
              'flex aspect-[9/17] flex-col items-center bg-gradient-to-b from-emerald-50 to-white px-3',
              compact ? 'pb-4 pt-5' : 'pb-6 pt-7'
            )}
          >
            <span
              className={cn(
                'text-center font-serif font-bold leading-tight text-emerald-900',
                compact ? 'text-sm' : 'text-lg'
              )}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Baby tracking
            </span>
            <Baby
              className={cn('text-emerald-600/90', compact ? 'mt-2 h-7 w-7' : 'mt-3 h-10 w-10')}
              aria-hidden
            />
            <div className={cn('flex gap-2', compact ? 'mt-2' : 'mt-4')}>
              <div
                className={cn(
                  'rounded-full bg-emerald-100 ring-1 ring-emerald-200/80',
                  compact ? 'h-6 w-6' : 'h-8 w-8'
                )}
              />
              <div
                className={cn(
                  'rounded-full bg-emerald-100 ring-1 ring-emerald-200/80',
                  compact ? 'h-6 w-6' : 'h-8 w-8'
                )}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full items-center justify-center',
        compact
          ? 'min-h-[148px] p-3 sm:min-h-[168px] sm:p-4'
          : 'min-h-[220px] p-6 md:min-h-[280px] md:p-8',
        isDark
          ? 'bg-gradient-to-br from-violet-950/60 via-zinc-900 to-[#050508]'
          : 'bg-gradient-to-br from-violet-200/40 via-slate-200 to-zinc-300/80'
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-[1.65rem] shadow-2xl',
          compact ? 'w-[6.5rem] rounded-[1.2rem] border-[4px]' : 'w-[9.25rem] border-[6px]',
          'border-zinc-600 bg-zinc-900'
        )}
      >
        <div
          className={cn(
            'flex aspect-[9/17] flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 px-3',
            compact ? 'pb-6 pt-8' : 'pb-8 pt-10'
          )}
        >
          <Bot className={cn('text-cyan-400', compact ? 'mb-2 h-8 w-8' : 'mb-3 h-12 w-12')} aria-hidden />
          <span
            className={cn(
              'text-center font-extrabold tracking-[0.18em] text-white',
              compact ? 'text-[8px]' : 'text-[10px]'
            )}
          >
            COMPRAS IA
          </span>
        </div>
      </div>
    </div>
  )
}
