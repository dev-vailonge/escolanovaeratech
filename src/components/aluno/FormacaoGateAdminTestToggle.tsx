'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import {
  clearFormacaoAdminTestHotmartOk,
  readFormacaoGateAdminTestFlag,
  writeFormacaoGateAdminTestFlag,
} from '@/lib/formacao/formacaoGateAdminTest'

type Props = { isDark: boolean; className?: string }

/**
 * UI do modo teste — não renderiza nada a menos que `user.role === 'admin'` (dados da sessão).
 */
export function FormacaoGateAdminTestToggle({ isDark, className }: Props) {
  const { user } = useAuth()
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      setOn(readFormacaoGateAdminTestFlag())
    } else {
      setOn(false)
    }
  }, [user?.role])

  if (user?.role !== 'admin') return null

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 text-left text-xs leading-snug',
        isDark ? 'border-amber-500/35 bg-amber-500/10 text-amber-100/95' : 'border-amber-200 bg-amber-50 text-amber-950',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">Fluxo de validação (admin)</p>
          <p className="mt-0.5 text-[11px] opacity-90">
            {on
              ? 'Resultado do fluxo: sucesso simulado.'
              : 'Resultado do fluxo: falha simulada.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Alternar fluxo de validação para admin"
          onClick={() => {
            const next = !on
            writeFormacaoGateAdminTestFlag(next)
            clearFormacaoAdminTestHotmartOk()
            setOn(next)
          }}
          className={cn(
            'relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
            on ? 'bg-[#F2C94C]' : isDark ? 'bg-white/20' : 'bg-gray-300'
          )}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
              on ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>
      <p className="mt-2 text-[11px] opacity-90">
        O fluxo sempre roda ao iniciar desafio; o toggle só define sucesso/falha para teste.
      </p>
    </div>
  )
}
