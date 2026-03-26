'use client'

import { Mail } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

interface ValidarFormacaoModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onEmailChange: (value: string) => void
  onValidate: () => void
  isValidating?: boolean
  errorMessage?: string
}

export default function ValidarFormacaoModal({
  isOpen,
  onClose,
  email,
  onEmailChange,
  onValidate,
  isValidating = false,
  errorMessage,
}: ValidarFormacaoModalProps) {
  const { theme } = useTheme()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Validar formação" size="md">
      <div className="space-y-4">
        <div
          className={cn(
            'rounded-lg border p-3 text-sm',
            theme === 'dark'
              ? 'bg-white/5 border-white/10 text-gray-300'
              : 'bg-yellow-500/10 border-yellow-400/40 text-gray-800'
          )}
        >
          Para enviar seu projeto, valide sua formação informando o e-mail que você usou na Hotmart.
        </div>

        {errorMessage ? (
          <div
            className={cn(
              'rounded-lg border p-3 text-sm',
              theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            )}
          >
            {errorMessage}
          </div>
        ) : null}

        <div>
          <label
            className={cn(
              'block text-sm font-medium mb-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}
          >
            E-mail usado na Hotmart
          </label>
          <div className="relative">
            <Mail
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}
              aria-hidden
            />
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className={cn(
                'w-full pl-10 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400',
                theme === 'dark'
                  ? 'bg-black/30 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>
          <p className={cn('text-xs mt-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
            Esse e-mail pode ser diferente do seu e-mail de login no app.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isValidating}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
              isValidating && 'opacity-50 cursor-not-allowed',
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            )}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onValidate}
            disabled={isValidating || !email.trim()}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
              (isValidating || !email.trim()) && 'opacity-50 cursor-not-allowed',
              theme === 'dark'
                ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            )}
          >
            {isValidating ? 'Validando...' : 'Validar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

