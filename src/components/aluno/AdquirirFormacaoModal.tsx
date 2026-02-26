'use client'

import { ExternalLink, MessageCircle } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { LINK_WHATSAPP_COMERCIAL, LINKS_FORMACOES, LABELS_FORMACOES, type FormacaoKey } from '@/lib/constants/formacoes'

const MODAL_TITLE = 'Não sou aluno da formação. O que posso fazer?'

interface AdquirirFormacaoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdquirirFormacaoModal({ isOpen, onClose }: AdquirirFormacaoModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={MODAL_TITLE} size="md">
      <div className="space-y-4">
        <p className={cn('text-sm md:text-base', isDark ? 'text-gray-300' : 'text-gray-700')}>
          Quem já faz o Norte Tech pode dar o próximo passo: entrar em uma formação do zero ao avançado na área em que mais se identificou. Assim você passa a concorrer à viagem e aprofunda no caminho que escolheu. Escolha uma das formações abaixo:
        </p>
        <ul className="flex flex-wrap gap-2">
          {(Object.keys(LINKS_FORMACOES) as FormacaoKey[]).map((key) => (
            <li key={key}>
              <a
                href={LINKS_FORMACOES[key]}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-500/30 text-yellow-800 hover:bg-yellow-500/50'
                )}
              >
                {LABELS_FORMACOES[key]}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </li>
          ))}
        </ul>
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Ou, se tiver dúvidas, fale com nosso time comercial:
        </p>
        <a
          href={LINK_WHATSAPP_COMERCIAL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-green-600 hover:bg-green-700 text-white transition-colors w-fit"
        >
          <MessageCircle className="w-5 h-5" />
          Falar no WhatsApp
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </Modal>
  )
}
