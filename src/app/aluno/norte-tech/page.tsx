'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { BookOpen, Target, Sparkles } from 'lucide-react'

export default function NorteTechPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const modules = [
    {
      key: 'wiki',
      title: 'Wiki',
      description: 'Um hub de conhecimento para acompanhar o curso com base em guias, referências e boas práticas.',
      icon: BookOpen,
      bullets: ['Guia de Setup', 'Arquitetura & Padrões', 'Checklist de Boas Práticas'],
      ctaLabel: 'Em breve',
      href: null as string | null,
    },
    {
      key: 'desafios',
      title: 'Desafios',
      description: 'Atividades práticas para consolidar o que você aprende: módulos curtos, feedback e evolução incremental.',
      icon: Target,
      bullets: ['Desafios por etapa', 'Progresso com XP', 'Recompensas por conclusão', 'Regras de validação'],
      ctaLabel: 'Em breve',
      href: null as string | null,
    },
    {
      key: 'nort-test',
      title: 'Nort Test',
      description: 'Nort Test é um teste feito com a ajuda de inteligência artificial para você identificar a área que mais gosta.',
      icon: Sparkles,
      bullets: [
        'Diagnóstico guiado por IA',
        'Preenchimento por etapa do curso',
        'Análise do seu perfil em evolução',
        'Recomendação da área com mais fit',
      ],
      ctaLabel: 'Iniciar Nort Test',
      href: '/aluno/norte-tech-test',
      ribbon: 'NOVO',
    },
  ]

  return (
    <section className={cn('px-4 md:px-6 py-10', isDark ? 'bg-[#0e0e0e]' : 'bg-white', 'min-h-[60vh]')}>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Hero */}
        <div
          className={cn(
            'rounded-3xl p-6 md:p-8',
            isDark
              ? 'bg-gradient-to-br from-[#201f1f] via-[#171717] to-[#111111]'
              : 'bg-gray-50'
          )}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-10 w-2 rounded-full bg-[#FFD600] shadow-[0_0_26px_rgba(255,214,0,0.35)]" />
                <h1 className={cn('text-[2.6rem] font-extrabold tracking-[-0.02em]', isDark ? 'text-white' : 'text-gray-900')}>Norte Tech</h1>
              </div>
              <p className={cn('text-[1.01rem] md:text-[1.15rem] max-w-2xl', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Curso criado para você dar o primeiro passo na área da programação. Aqui você fará na prática 1 projeto para as principais áreas e, no final, realizará nosso teste Nort Test para identificar a área que mais gosta.
              </p>
            </div>

            <div className={cn('flex gap-2 flex-wrap', isDark ? '' : '')} />
          </div>
        </div>

        {/* Technologies */}
        <div className="space-y-4">
          <h2 className={cn('text-sm tracking-[0.08em] font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Tecnologias que você vai aprender
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { key: 'logica', label: 'Lógica de programação' },
              { key: 'html', label: 'HTML' },
              { key: 'css', label: 'CSS' },
              { key: 'js', label: 'JavaScript' },
              { key: 'kotlin', label: 'Kotlin' },
              { key: 'java', label: 'Java' },
              { key: 'python', label: 'Python' },
            ].map((t) => (
              <div
                key={t.key}
                className={cn(
                  'rounded-3xl p-5 md:p-6',
                  isDark ? 'bg-[#1a1919]' : 'bg-gray-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#FFD600] shadow-[0_0_22px_rgba(255,214,0,0.35)]" />
                  <span className={cn('text-[1.01rem] font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                    {t.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          <h2 className={cn('text-sm tracking-[0.08em] font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>Ferramentas disponíveis</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map((m) => {
              const Icon = m.icon
              const hasLink = Boolean(m.href)

              return (
                <div
                  key={m.key}
                  className={cn(
                    'relative rounded-3xl p-5 md:p-6 flex flex-col',
                    isDark
                      ? 'bg-[#1a1919] text-white'
                      : 'bg-gray-50 text-gray-900'
                  )}
                >
                  {m.ribbon ? (
                    <div className="absolute top-4 right-4 rounded-xl bg-yellow-400 px-3 py-1 text-[13px] font-bold text-[#0e0e0e] shadow-[0_0_26px_rgba(255,214,0,0.35)]">
                      {m.ribbon}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-2 rounded-full bg-[#FFD600] shadow-[0_0_22px_rgba(255,214,0,0.3)]" />
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-6 h-6', isDark ? 'text-[#FFD600]' : 'text-yellow-600')} />
                      <h3 className={cn('text-[1.44rem] font-extrabold leading-tight', isDark ? 'text-gray-100' : 'text-gray-900')}>{m.title}</h3>
                    </div>
                    </div>
                  </div>

                  <p className={cn('mt-3 text-[1.01rem] leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>{m.description}</p>

                  <div className="mt-5 grid grid-cols-1 gap-2">
                    {m.bullets.map((b) => (
                      <div key={b} className={cn('flex items-start gap-2 text-[1.01rem]', isDark ? 'text-gray-300' : 'text-gray-700')}>
                        <span className={cn('mt-1 inline-block w-2 h-2 rounded-full', isDark ? 'bg-[#FFD600]' : 'bg-yellow-600')} />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-4">
                    {hasLink ? (
                      <Link
                        href={m.href as string}
                        className={cn(
                          'inline-flex items-center justify-center w-full rounded-xl px-4 py-3 text-[1.01rem] font-semibold transition-colors',
                          isDark
                            ? 'bg-gradient-to-r from-[#ffe483] to-[#fdd400] text-[#433700] shadow-[0_0_34px_rgba(255,214,0,0.16)] hover:brightness-105'
                            : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                        )}
                      >
                        {m.ctaLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={cn(
                          'inline-flex items-center justify-center w-full rounded-xl px-4 py-3 text-[1.01rem] font-semibold cursor-not-allowed opacity-60',
                          isDark ? 'bg-[#201f1f] text-gray-300' : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {m.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Jornada (no final) */}
        <div
          className={cn(
            'rounded-3xl p-6 md:p-8 space-y-8',
            isDark ? 'bg-gradient-to-br from-[#201f1f] via-[#171717] to-[#111111]' : 'bg-gray-50'
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-yellow-400" />
              <h3 className={cn('text-4xl font-extrabold leading-none', isDark ? 'text-white' : 'text-gray-900')}>
                Jornada
              </h3>
            </div>
            <p className={cn('text-[1.01rem] w-full', isDark ? 'text-gray-400' : 'text-gray-600')}>
              <span>Você está dando seu primeiro passo na sua jornada na área da programação.</span>
              <span className="block">É muito importante ter clareza de cada etapa.</span>
              <span className="block h-[2px] w-[280px] max-w-full rounded-full bg-yellow-400 shadow-[0_0_18px_rgba(255,214,0,0.25)]" />
              <br />
              Aqui na Escola Nova Era, tudo está configurado para o seu sucesso: não são somente aulas gravadas. Será uma experiência imersiva, com a oportunidade de trabalhar em projetos reais com programadores reais, ganhando experiência enquanto estuda.
              <br />
              <br />
              Mas, calma: sem pressa. Primeiro, evolua no Norte Tech e decida em qual área você quer se aprofundar. E não esqueça de fazer o Nort Test.
            </p>
          </div>

          <div className="relative">
            <div
              className={cn(
                'absolute left-0 right-0 top-[19px] h-[2px] rounded-full',
                isDark ? 'bg-white/10' : 'bg-gray-200'
              )}
            />

            <div className="relative grid grid-cols-3 gap-2">
              {[
                'Norte Tech',
                'Formações',
                'Projetos',
              ].map((label, idx) => {
                const isCurrent = idx === 0
                return (
                  <div key={label} className="flex flex-col items-center px-1">
                    <div
                      className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-full',
                        isCurrent
                          ? 'bg-yellow-400 text-[#0e0e0e] shadow-[0_0_26px_rgba(255,214,0,0.35)]'
                          : isDark
                          ? 'bg-[#1a1919] text-gray-400'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {idx + 1}
                    </div>
                    <p
                      className={cn(
                        'mt-4 text-[15px] leading-snug text-center font-semibold',
                        isCurrent
                          ? 'text-yellow-300'
                          : isDark
                          ? 'text-gray-400'
                          : 'text-gray-600'
                      )}
                    >
                      {idx === 1 || idx === 2 ? (
                        <span className="group relative inline-flex items-center">
                          {label}
                          <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[12px] font-bold text-[#0e0e0e] shadow-[0_0_18px_rgba(255,214,0,0.25)]">
                            ?
                          </span>
                          <span
                            role="tooltip"
                            className={cn(
                              'pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[110%]',
                              'w-[220px] max-w-[220px] min-h-[140px] px-4 py-5 rounded-2xl border border-yellow-400 text-[15px] leading-relaxed whitespace-normal break-words text-left',
                              isDark ? 'bg-[#0e0e0e] text-gray-200 shadow-[0_0_40px_rgba(255,214,0,0.08)]' : 'bg-white text-gray-900 shadow-[0_0_34px_rgba(0,0,0,0.25)]',
                              'opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity'
                            )}
                          >
                            {idx === 1 ? (
                              <>
                                Nossas formações vão além de aulas gravadas. Você aprenderá do absoluto zero ao avançado, com foco nos requisitos das vagas.
                                <br />
                                Também fará desafios para construir seu portfólio e ganhar confiança para participar de entrevistas.
                              </>
                            ) : (
                              <>
                                Alunos matriculados em nossas formações têm a oportunidade de desenvolver projetos reais, viver a rotina do trabalho de um programador e adquirir experiência prática.
                                <br />
                                Isso aumenta em 70% as chances de serem contratados.
                              </>
                            )}
                          </span>
                        </span>
                      ) : (
                        label
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

