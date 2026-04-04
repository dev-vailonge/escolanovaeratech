'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { ArrowLeft, ExternalLink, FolderKanban, ShieldAlert } from 'lucide-react'
import { OBJETIVO_PRINCIPAL_PROJETOS_REAIS } from '@/data/formacao-android-projetos'
import { ProjetosReaisVerticalList } from '@/components/formacao-android/ProjetosReaisVerticalList'

const pageTags = ['Android', 'iOS', 'Backend', 'Data', 'Web'] as const

const experienciaBullets = [
  'Reuniões e rituais de time (daily, planning, revisão de código)',
  'Feedback de quem já trabalha com entrega contínua em produção',
  'Projetos que simulam demandas reais: prioridades, prazos e qualidade'
]

export default function AlunoProjetosPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={cn('min-h-[70vh] pb-16 md:pb-24', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
      <div className="mx-auto max-w-3xl px-4 pt-6 md:px-6 md:pt-10">
        {/* Navegação contextual */}
        <Link
          href="/aluno"
          className={cn(
            'inline-flex items-center gap-2 text-sm font-medium transition-colors',
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Voltar
        </Link>

        {/* Título e tags */}
        <h1
          className={cn(
            'mt-6 font-serif text-[2rem] font-semibold leading-[1.12] tracking-tight md:text-5xl md:leading-[1.08]',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          Projetos reais
        </h1>
        <p
          className={cn(
            'mt-2 font-serif text-lg italic md:text-xl',
            isDark ? 'text-gray-500' : 'text-gray-600'
          )}
        >
          Escola Nova Era Tech
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {pageTags.map((tag) => (
            <span
              key={tag}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-200/90 text-gray-800'
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Banner */}
        <div
          className={cn(
            'relative mt-8 aspect-[2/1] w-full overflow-hidden rounded-2xl border shadow-lg md:aspect-[21/9] md:rounded-3xl',
            isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-gray-200 bg-white'
          )}
        >
          <Image
            src="/images/formacao-android-hero.png"
            alt="Visual da formação e ecossistema mobile Nova Era Tech"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 720px"
            priority
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:from-black/35"
            aria-hidden
          />
        </div>

        {/* Cartão principal: cabeçalho + sobre */}
        <div
          className={cn(
            'mt-8 rounded-2xl border md:rounded-3xl',
            isDark ? 'border-white/10 bg-[#141414]' : 'border-gray-200 bg-white shadow-sm'
          )}
        >
          <div className="border-b border-inherit p-5 md:p-8 md:pb-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border md:h-14 md:w-14 md:rounded-2xl',
                    isDark ? 'border-white/10 bg-white/5 text-[#F2C94C]' : 'border-gray-200 bg-gray-50 text-yellow-700'
                  )}
                >
                  <FolderKanban className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2
                    className={cn(
                      'font-serif text-xl font-semibold tracking-tight md:text-2xl',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    Hub de projetos reais
                  </h2>
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}
                  >
                    Ganhe experiência próxima ao mercado desenvolvendo projetos reais com time cross-functional.
                  </p>
                </div>
              </div>
           
            </div>
          </div>

          <div className="p-5 md:p-8 md:pt-6">
            <h3
              className={cn(
                'font-serif text-lg font-semibold md:text-xl',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Sobre esta experiência
            </h3>
            <div
              className={cn(
                'mt-4 space-y-4 text-sm leading-relaxed md:text-[0.95rem]',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              <p>
                Aqui você conhece os projetos que mantemos com time misto — alunos em formação e programadores que
                já estão no mercado — para aproximar o estudo da rotina profissional.
              </p>
              <p>{OBJETIVO_PRINCIPAL_PROJETOS_REAIS}</p>
              <ul className="list-none space-y-3 pt-1">
                {experienciaBullets.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#F2C94C]" aria-hidden />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={cn(
                'mt-8 flex gap-3 rounded-2xl border p-4 md:p-5',
                isDark ? 'border-amber-500/35 bg-amber-500/[0.09]' : 'border-amber-300 bg-amber-50/90'
              )}
            >
              <ShieldAlert
                className={cn('h-6 w-6 shrink-0 mt-0.5', isDark ? 'text-amber-300' : 'text-amber-800')}
                aria-hidden
              />
              <div>
                <p className={cn('text-sm font-bold', isDark ? 'text-amber-100' : 'text-amber-950')}>
                  Requisitos para participar dos projetos reais:
                </p>
                <p
                  className={cn(
                    'mt-1 text-sm leading-relaxed',
                    isDark ? 'text-amber-100/85' : 'text-amber-950/85'
                  )}
                >
                  Para participar dos projetos reais com o time, é necessário estar matriculado em uma das nossas formações. Os desafios do curso
                  e o projeto em grupo se complementam. Os projetos reais são projetos que estamos desenvolvendo com time cross-functional.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista vertical: imagem + título + descrição */}
        <section className="mt-12 md:mt-16" aria-labelledby="projetos-lista-heading">
          <h2
            id="projetos-lista-heading"
            className={cn(
              'font-serif text-xl font-semibold md:text-2xl',
              isDark ? 'text-white' : 'text-gray-900'
            )}
          >
            Projetos em destaque
          </h2>
          <p
            className={cn(
              'mt-2 max-w-2xl text-sm leading-relaxed',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Selecione um projeto para ver stack, rituais do time e o squad.
          </p>
          <div className="mt-8">
            <ProjetosReaisVerticalList isDark={isDark} />
          </div>
        </section>
      </div>
    </div>
  )
}
