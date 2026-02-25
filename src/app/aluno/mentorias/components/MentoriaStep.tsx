'use client'

import { useState, useEffect } from 'react'
import type { DatabaseMentoriaStep, DatabaseMentoriaTarefa } from '@/types/database'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitizeHtml'
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
    setSafeHtml(sanitizeHtml(step.descricao || ''))
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
          className="text-sm md:text-base text-gray-300 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside [&_p]:my-1 [&_li]:my-0.5"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className="text-sm md:text-base text-gray-300">{step.descricao}</p>
      )}

      {/* Layout minimalista específico para o Step 01 */}
      {step.ordem === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Objetivo
            </p>
            <p className="text-sm md:text-base text-gray-100">
              Conseguir primeiro emprego
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Informações
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm md:text-base text-gray-100">
              <li>
                Vem de experiência em call center e conheceu programação através
                de um amigo.
              </li>
              <li>
                Estudou pela Rocketseat (HTML, CSS, JavaScript, React e Banco
                de Dados) e é formado em Administração.
              </li>
              <li>
                Já fez várias entrevistas (principalmente para Web), participou
                de processos com RH e já teve contato com projetos reais na
                Accenture.
              </li>
              <li>Inglês: sim. Disponibilidade de estudo: ~10h por semana.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Tarefas
            </p>
            <MentoriaTarefas tarefas={tarefas} canToggle={!isBlocked} onToggleSuccess={onRefetch} />
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Próxima etapa
            </p>
            <p className="text-sm md:text-base text-gray-200">
              Talles irá marcar um próximo encontro após me entregar um desafio
              de código; vamos alinhar o nível técnico dele para elevar os
              pontos durante os próximos 3 encontros.
            </p>
          </div>
        </div>
      )}

      {step.ordem !== 1 && (
        <MentoriaTarefas tarefas={tarefas} canToggle={!isBlocked} onToggleSuccess={onRefetch} />
      )}
    </div>
  )
}

