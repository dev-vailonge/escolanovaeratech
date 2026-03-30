'use client'

import { ExternalLink } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useTheme } from '@/lib/ThemeContext'
import { CUPOM_DESCONTO_NORTE_TECH } from '@/lib/constants/formacoes'
import { cn } from '@/lib/utils'

type Props = {
  isOpen: boolean
  onClose: () => void
  /** Link de checkout (já com cupom, se aplicável). */
  checkoutHref: string
}

export default function FormacaoNaoMatriculadoModal({ isOpen, onClose, checkoutHref }: Props) {
  const { theme } = useTheme()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acesso à formação"
      size="md"
    >
      <div className="space-y-5">
        <p
          className={cn(
            'text-base font-semibold leading-snug',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}
        >
          Você não faz parte dessa formação.
        </p>

        <p
          className={cn(
            'text-sm leading-relaxed',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          Para adquirir com desconto do{' '}
          <span className="font-semibold text-[#F2C94C]">Norte Tech</span>, utilize o cupom{' '}
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-sm font-bold',
              theme === 'dark' ? 'bg-white/10 text-[#F2C94C]' : 'bg-yellow-100 text-yellow-900'
            )}
          >
            {CUPOM_DESCONTO_NORTE_TECH}
          </span>
          . Entre agora mesmo através do botão abaixo.
        </p>

        <a
          href={checkoutHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold uppercase tracking-wide transition-colors',
            'bg-[#F2C94C] text-black hover:bg-[#f5d35c] border border-[#F2C94C]'
          )}
        >
          Quero entrar na formação
          <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        </a>

        <button
          type="button"
          onClick={onClose}
          className={cn(
            'w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
            theme === 'dark'
              ? 'bg-white/10 text-gray-200 hover:bg-white/15'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          )}
        >
          Fechar
        </button>
      </div>
    </Modal>
  )
}
