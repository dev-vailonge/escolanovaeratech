'use client'

import type { MentoriaWithSteps } from '@/types/database'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MentoriaStep } from './MentoriaStep'

type MentoriaTimelineProps = {
  mentoria: MentoriaWithSteps
  onRefetch?: () => void
  /** Admin: visualização do aluno sem permitir marcar tarefas */
  readOnly?: boolean
}

export function MentoriaTimeline({ mentoria, onRefetch, readOnly }: MentoriaTimelineProps) {
  const stepsOrdenados = [...mentoria.steps].sort((a, b) => a.ordem - b.ordem)

  // Step atual: primeiro habilitado não concluído
  const currentStepId =
    stepsOrdenados.find(
      (s) => s.habilitado && s.status !== 'concluido'
    )?.id ?? stepsOrdenados[0]?.id ?? null

  const currentIndex = currentStepId
    ? stepsOrdenados.findIndex((s) => s.id === currentStepId)
    : 0

  const [activeStepId, setActiveStepId] = useState<string | null>(currentStepId)

  const activeStep =
    stepsOrdenados.find((s) => s.id === activeStepId) ?? stepsOrdenados[0]

  return (
    <div className="space-y-6">
      {/* Header com objetivo principal + progresso */}
      <div className="rounded-2xl border p-5 md:p-6 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/40 shadow-lg shadow-yellow-500/10">
        <p className="text-xs md:text-sm uppercase tracking-wide text-yellow-400 mb-1">
          🎯 Mentoria individual
        </p>
        <h2 className="text-xl md:text-2xl font-bold text-white">
          {mentoria.objetivo_principal}
        </h2>
      </div>

      {/* Timeline horizontal (tabs) */}
      <div className="space-y-6">
        <div className="pb-3 pt-2">
          <div className="relative flex items-center w-full justify-between">
            {/* Linha base */}
            <div className="absolute left-0 right-0 h-0.5 rounded-full bg-gray-700 top-[68%]" />

            {stepsOrdenados.map((step, index) => {
              const isBlocked = !step.habilitado
              const isDone = step.status === 'concluido'
              const isCurrent = step.id === currentStepId
              const isFuture = index > currentIndex || isBlocked
              const isActive = step.id === activeStep?.id
              const canClick = !isFuture

              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center gap-3 flex-1"
                >
                  <button
                    type="button"
                    disabled={!canClick}
                    onClick={() => {
                      if (!canClick) return
                      setActiveStepId(step.id)
                    }}
                    className={cn('flex flex-col items-center gap-3', !canClick && 'cursor-not-allowed')}
                  >
                    <div
                      className={cn(
                        'h-9 w-9 md:h-10 md:w-10 rounded-full border-2 flex items-center justify-center text-xs md:text-sm font-semibold transition-colors',
                        isDone || isCurrent
                          ? 'border-yellow-400 bg-yellow-500 text-black'
                          : isFuture
                          ? 'border-gray-700 bg-gray-900 text-gray-500'
                          : 'border-gray-500 bg-gray-800 text-gray-200',
                        isActive && !isFuture && 'ring-2 ring-yellow-400/60'
                      )}
                    >
                      {index + 1}
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detalhe do step selecionado */}
        {activeStep && (
          <MentoriaStep
            step={activeStep}
            tarefas={activeStep.tarefas ?? []}
            isCurrent={activeStep.id === currentStepId}
            isBlocked={!activeStep.habilitado}
            onRefetch={onRefetch}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  )
}
