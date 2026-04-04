'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Globe,
  Server,
  Smartphone,
  Target,
  Users,
} from 'lucide-react'
import { ProjetoRealPhonePreview } from '@/components/formacao-android/ProjetoRealPhonePreview'
import { SubmittersFacepile } from '@/components/ui/SubmittersFacepile'
import {
  getFormacaoAndroidProjetoRealById,
  OBJETIVO_PRINCIPAL_PROJETOS_REAIS,
  TECH_AREAS_PROJETO_META,
  type FormacaoAndroidTechAreaId,
} from '@/data/formacao-android-projetos'

const techIcons: Record<FormacaoAndroidTechAreaId, LucideIcon> = {
  android: Smartphone,
  ios: Apple,
  web: Globe,
  backend: Server,
  data: BarChart3,
}

export default function FormacaoAndroidProjetoDetalhePage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const projeto = id ? getFormacaoAndroidProjetoRealById(id) : null

  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!projeto) {
    return (
      <section className={cn('min-h-[50vh] px-4 py-16', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
        <div className="mx-auto max-w-xl text-center">
          <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Projeto não encontrado
          </h1>
          <Link
            href="/aluno/projetos"
            className="mt-6 inline-flex items-center gap-2 text-[#F2C94C] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para projetos
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('min-h-[70vh]', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <Link
          href="/aluno/projetos"
          className={cn(
            'mb-8 inline-flex items-center gap-2 text-sm font-semibold transition-colors',
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Projetos reais
        </Link>

        <div
          className={cn(
            'overflow-hidden rounded-3xl border',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="md:flex">
            <div className="relative md:w-[42%] md:max-w-[340px] md:shrink-0">
              <ProjetoRealPhonePreview variant={projeto.preview} isDark={isDark} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-6 md:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F2C94C]">
                {projeto.detailBadge ?? 'Projeto real · Formação Android'}
              </p>
              <h1
                className={cn(
                  'mt-2 text-2xl font-black uppercase leading-tight tracking-tight md:text-3xl',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                {projeto.title}
              </h1>
              <p
                className={cn(
                  'mt-4 text-sm leading-relaxed md:text-base',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {projeto.detailLead ?? projeto.description}
              </p>
              {projeto.bullets.length > 0 ? (
                <ul className="mt-6 space-y-2">
                  {projeto.bullets.map((b) => (
                    <li
                      key={b}
                      className={cn(
                        'flex items-start gap-2.5 text-sm font-semibold',
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      )}
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F2C94C]" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                isDark ? 'bg-[#F2C94C]/15 text-[#F2C94C]' : 'bg-yellow-100 text-yellow-800'
              )}
            >
              <Target className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2
                className={cn(
                  'text-sm font-black uppercase tracking-[0.12em]',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
              >
                Objetivo principal
              </h2>
              <p
                className={cn(
                  'mt-2 text-sm leading-relaxed md:text-[0.95rem]',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {OBJETIVO_PRINCIPAL_PROJETOS_REAIS}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Users className={cn('h-5 w-5', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} />
            <h2
              className={cn(
                'text-sm font-black uppercase tracking-[0.12em]',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Quem está no projeto
            </h2>
          </div>
          <p
            className={cn(
              'mt-2 text-sm',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Pessoas que compartilham o código, revisões e rituais com você neste squad.
          </p>
          <div className="mt-5">
            <SubmittersFacepile people={projeto.team} isDark={isDark} maxVisible={8} size="md" />
          </div>
        </div>

        <div
          className={cn(
            'mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#121212]' : 'border-gray-200 bg-white'
          )}
        >
          <h2
            className={cn(
              'text-sm font-black uppercase tracking-[0.12em]',
              isDark ? 'text-white' : 'text-gray-900'
            )}
          >
            Tecnologias que temos
          </h2>
          <p
            className={cn(
              'mt-2 text-sm',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Ecossistema multidisciplinar para projetos que se aproximam do mercado.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projeto.techAreas.map((key) => {
              const meta = TECH_AREAS_PROJETO_META[key]
              const Icon = techIcons[key]
              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-2xl border p-4',
                    isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-gray-50/80'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4 shrink-0', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} />
                    <span className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                      {meta.label}
                    </span>
                  </div>
                  <p className={cn('mt-2 text-xs leading-relaxed', isDark ? 'text-gray-500' : 'text-gray-600')}>
                    {meta.short}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className={cn(
            'mb-10 mt-8 rounded-3xl border p-6 md:p-8',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <CalendarDays className={cn('h-5 w-5', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')} />
            <h2
              className={cn(
                'text-sm font-black uppercase tracking-[0.12em]',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Nossos encontros e rituais
            </h2>
          </div>
          <p
            className={cn(
              'mt-2 text-sm',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Daylis, planejamento, sprint e momentos de revisão — o mesmo vocabulário que você verá em empresa.
          </p>
          <ul className="mt-6 space-y-4">
            {projeto.ceremonias.map((c) => (
              <li
                key={c.titulo}
                className={cn(
                  'rounded-2xl border p-4 md:p-5',
                  isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50/50'
                )}
              >
                <p className={cn('text-sm font-bold', isDark ? 'text-[#F2C94C]' : 'text-yellow-800')}>
                  {c.titulo}
                </p>
                <p
                  className={cn(
                    'mt-2 text-sm leading-relaxed',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  {c.descricao}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
