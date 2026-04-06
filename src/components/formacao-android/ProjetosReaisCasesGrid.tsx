'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { FormacaoAndroidProjetoReal } from '@/data/formacao-android-projetos'
import { ProjetoRealPhonePreview } from '@/components/formacao-android/ProjetoRealPhonePreview'

type ProjetosReaisCasesGridProps = {
  isDark: boolean
  projetos: FormacaoAndroidProjetoReal[]
  /** Quando true, o card inteiro leva à página de detalhe do projeto */
  wrapWithDetailLink?: boolean
}

function ProjetoArticle({ isDark, children }: { isDark: boolean; children: ReactNode }) {
  return (
    <article
      className={cn(
        'flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border md:flex-row',
        isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-[#fafafa]'
      )}
    >
      {children}
    </article>
  )
}

export function ProjetosReaisCasesGrid({
  isDark,
  projetos,
  wrapWithDetailLink,
}: ProjetosReaisCasesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-2">
      {projetos.map((proj) => {
        const inner = (
          <>
            <div className="relative overflow-hidden md:w-[44%] md:max-w-[320px] md:shrink-0">
              <ProjetoRealPhonePreview variant={proj.preview} isDark={isDark} />
            </div>
            <div
              className={cn(
                'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-6 pt-6 pb-8 md:px-7 md:pt-7 md:pb-8 md:pl-8',
                wrapWithDetailLink && 'transition-colors',
                wrapWithDetailLink &&
                  (isDark ? 'group-hover:bg-white/[0.03]' : 'group-hover:bg-yellow-500/[0.04]')
              )}
            >
              <h3
                className={cn(
                  'text-xl font-black uppercase leading-tight tracking-tight break-words md:text-2xl',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                {proj.title}
              </h3>
              <p
                className={cn(
                  'mt-3 text-sm leading-relaxed break-words md:text-[0.95rem]',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {proj.description}
              </p>
              <ul className="mt-5 space-y-2">
                {proj.bullets.map((b) => (
                  <li
                    key={b}
                    className={cn(
                      'flex items-start gap-2.5 text-sm font-semibold',
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    )}
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F2C94C]"
                      aria-hidden
                    />
                    <span className="break-words">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )

        if (wrapWithDetailLink) {
          return (
            <Link
              key={proj.id}
              href={`/aluno/formacoes/android/projetos/${proj.id}`}
              className={cn(
                'group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2',
                isDark ? 'focus-visible:ring-offset-[#0e0e0e]' : 'focus-visible:ring-offset-gray-100'
              )}
            >
              <ProjetoArticle isDark={isDark}>{inner}</ProjetoArticle>
            </Link>
          )
        }

        return (
          <ProjetoArticle key={proj.id} isDark={isDark}>
            {inner}
          </ProjetoArticle>
        )
      })}
    </div>
  )
}
