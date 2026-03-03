'use client'

import { useState, useEffect } from 'react'
import type { DatabaseMentoriaStep, DatabaseMentoriaTarefa } from '@/types/database'
import { cn } from '@/lib/utils'
import { markdownToSafeHtml } from '@/lib/markdown'
import { MentoriaTarefas } from './MentoriaTarefas'

type MentoriaStepProps = {
  step: DatabaseMentoriaStep
  tarefas: DatabaseMentoriaTarefa[]
  isCurrent: boolean
  isBlocked: boolean
  onRefetch?: () => void
}

export function MentoriaStep({
  step,
  tarefas,
  isCurrent,
  isBlocked,
  onRefetch,
}: MentoriaStepProps) {
  const isDone = step.status === 'concluido'
  const [safeHtml, setSafeHtml] = useState<string | null>(null)
  useEffect(() => {
    setSafeHtml(markdownToSafeHtml(step.descricao || ''))
  }, [step.descricao])

  return (
    <div
      className={cn(
        'rounded-xl border p-5 md:p-6 space-y-4 transition-colors bg-black/40 border-white/10',
        isDone && 'border-green-400/50',
        isCurrent && !isDone && 'border-yellow-400/60',
        isBlocked && 'opacity-60'
      )}
    >
      <h3 className="text-base md:text-lg font-semibold text-white">
        {step.ordem}. {step.titulo}
      </h3>

      {safeHtml !== null ? (
        <div
          className={cn(
            'text-sm md:text-base text-gray-300',
            '[&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside',
            '[&_p]:my-1 [&_li]:my-0.5',
            '[&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold',
            '[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-[15px] [&_h3]:font-semibold',
            '[&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold',
            '[&_hr]:my-3 [&_hr]:border-white/10'
          )}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className="text-sm md:text-base text-gray-300">{step.descricao}</p>
      )}

      {tarefas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Tarefas
          </p>
          <MentoriaTarefas
            tarefas={tarefas}
            canToggle={!isBlocked}
            onToggleSuccess={onRefetch}
          />
        </div>
      )}
    </div>
  )
}

