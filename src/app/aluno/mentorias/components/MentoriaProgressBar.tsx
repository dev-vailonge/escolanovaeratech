'use client'

import { cn } from '@/lib/utils'

type MentoriaProgressBarProps = {
  percent: number
}

export function MentoriaProgressBar({ percent }: MentoriaProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Progresso da mentoria</span>
        <span className="font-semibold text-yellow-400">
          {clamped.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full bg-yellow-400 transition-all duration-500 ease-out'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

