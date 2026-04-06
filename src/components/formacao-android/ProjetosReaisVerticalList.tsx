'use client'

import Link from 'next/link'
import { FileText, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormacaoAndroidProjetoReal } from '@/data/formacao-android-projetos'
import { ProjetoRealPhonePreview } from '@/components/formacao-android/ProjetoRealPhonePreview'

type ProjetosReaisVerticalListProps = {
  isDark: boolean
  projetos: FormacaoAndroidProjetoReal[]
}

export function ProjetosReaisVerticalList({ isDark, projetos }: ProjetosReaisVerticalListProps) {
  return (
    <ul className="flex list-none flex-col gap-4 md:gap-5">
      {projetos.map((proj) => (
        <li key={proj.id}>
          <Link
            href={`/aluno/formacoes/android/projetos/${proj.id}`}
            className={cn(
              'group block overflow-hidden rounded-2xl border transition-colors md:rounded-3xl',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2',
              isDark
                ? 'border-white/10 bg-[#161616] hover:border-[#F2C94C]/35'
                : 'border-gray-200 bg-[#fafafa] hover:border-yellow-300/80',
              isDark ? 'focus-visible:ring-offset-[#0e0e0e]' : 'focus-visible:ring-offset-gray-100'
            )}
          >
            <article className="flex min-h-[148px] flex-col sm:min-h-0 sm:flex-row">
              <div className="relative w-full shrink-0 overflow-hidden sm:w-[36%] sm:max-w-[280px]">
                <ProjetoRealPhonePreview variant={proj.preview} isDark={isDark} compact />
              </div>
              <div
                className={cn(
                  'flex flex-1 flex-col justify-center px-5 py-5 sm:px-6 sm:py-6 md:px-8',
                  isDark ? 'bg-[#161616]' : 'bg-[#fafafa]'
                )}
              >
                <div className="flex items-start gap-2.5">
                  <FileText
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0 stroke-[1.75]',
                      isDark ? 'text-[#F2C94C]' : 'text-yellow-700'
                    )}
                    aria-hidden
                  />
                  <h3
                    className={cn(
                      'font-serif text-lg font-semibold leading-snug tracking-tight md:text-xl',
                      isDark ? 'text-white' : 'text-gray-900',
                      'group-hover:underline group-hover:decoration-[#F2C94C]/50 group-hover:underline-offset-4'
                    )}
                  >
                    {proj.title}
                  </h3>
                </div>
                <span
                  className={cn(
                    'mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                    isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'
                  )}
                >
                  Projeto real
                </span>
                <div className="mt-3 flex items-start gap-2.5">
                  <Layers
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0 opacity-70',
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    )}
                    aria-hidden
                  />
                  <p
                    className={cn(
                      'text-sm leading-relaxed md:text-[0.95rem]',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    {proj.description}
                  </p>
                </div>
              </div>
            </article>
          </Link>
        </li>
      ))}
    </ul>
  )
}
