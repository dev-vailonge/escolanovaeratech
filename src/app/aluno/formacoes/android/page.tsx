'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { Rocket, Code2, Award, ArrowRight, Baby, Bot } from 'lucide-react'
import {
  BONUS_COMPLETAR_TODOS_XP,
  FORMACAO_ANDROID_APPS,
  type ChallengeVisual,
} from '@/data/formacao-android-desafios'
import { FORMACAO_ANDROID_PROJETOS_REAIS } from '@/data/formacao-android-projetos'

const heroBadges = [
  { icon: Rocket, label: '+15 APLICATIVOS' },
  { icon: Code2, label: 'PROJETOS REAIS' },
  { icon: Award, label: 'DESAFIOS GAMIFICADOS' },
] as const

/** Área de preview: mais baixa que o screenshot inteiro; imagens usam crop (cover), sem distorção */
const CHALLENGE_COVER_WIDTH = 280
const CHALLENGE_COVER_HEIGHT = 360

const challengePreviewFrameStyle: CSSProperties = {
  maxWidth: CHALLENGE_COVER_WIDTH,
  aspectRatio: `${CHALLENGE_COVER_WIDTH} / ${CHALLENGE_COVER_HEIGHT}`,
}

function challengePreviewShell(className: string) {
  return {
    className: cn('relative mx-auto w-full overflow-hidden', className),
    style: challengePreviewFrameStyle,
  }
}

function ChallengeCardVisual({ visual, isDark }: { visual: ChallengeVisual; isDark: boolean }) {
  switch (visual) {
    case 'phone':
      return (
        <div
          {...challengePreviewShell(
            'flex h-full min-h-0 items-center justify-center bg-gradient-to-b from-sky-400/25 to-blue-700/40'
          )}
        >
          <div className="h-[7.5rem] w-24 rounded-2xl border-2 border-white/50 bg-gradient-to-b from-sky-300/90 to-blue-600/90 shadow-lg" />
        </div>
      )
    case 'wireframe':
      return (
        <div {...challengePreviewShell('bg-gray-100 p-4 flex h-full min-h-0 flex-col gap-2')}>
          <div className="h-3 rounded bg-gray-300/90 w-4/5" />
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
            <div className="rounded-lg bg-white border border-gray-300 shadow-sm" />
            <div className="rounded-lg bg-white border border-gray-300 shadow-sm" />
          </div>
          <div className="h-8 rounded bg-gray-200" />
        </div>
      )
    case 'chart':
      return (
        <div
          {...challengePreviewShell(
            'bg-[#0f172a] px-4 pb-4 pt-6 flex h-full min-h-0 items-end justify-center gap-1.5'
          )}
        >
          {[40, 68, 48, 82, 56, 72].map((h, i) => (
            <div
              key={i}
              className="w-5 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-300/90"
              style={{ height: `${h}%`, maxHeight: '85%' }}
            />
          ))}
        </div>
      )
    case 'map':
      return (
        <div
          {...challengePreviewShell(
            'bg-gradient-to-br from-emerald-900/40 to-slate-900 flex h-full min-h-0 items-center justify-center p-4'
          )}
        >
          <div className="grid grid-cols-3 gap-1 w-28 opacity-90">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-6 rounded-sm bg-emerald-500/40 border border-emerald-400/30" />
            ))}
          </div>
        </div>
      )
    case 'crypto':
      return (
        <div
          {...challengePreviewShell(
            'bg-gradient-to-br from-amber-900/30 to-zinc-900 flex h-full min-h-0 items-center justify-center'
          )}
        >
          <div className="flex gap-2 items-end h-24">
            {[30, 55, 40, 70, 45].map((h, i) => (
              <div key={i} className="w-4 rounded-t bg-amber-400/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )
    case 'media':
      return (
        <div
          {...challengePreviewShell(
            'bg-gradient-to-br from-violet-900/35 to-indigo-950 flex h-full min-h-0 items-center justify-center gap-3'
          )}
        >
          <div className="h-16 w-12 rounded-lg bg-white/10 border border-white/20" />
          <div className="h-20 w-20 rounded-full border-4 border-violet-400/50 bg-violet-500/20" />
        </div>
      )
    default:
      return (
        <div {...challengePreviewShell(isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200')} />
      )
  }
}

function ProjetoRealPhonePreview({
  variant,
  isDark,
}: {
  variant: 'lake' | 'ai-shopping'
  isDark: boolean
}) {
  if (variant === 'lake') {
    return (
      <div
        className={cn(
          'flex h-full min-h-[220px] items-center justify-center p-6 md:p-8 md:min-h-[280px]',
          isDark
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-[#0a0a0a]'
            : 'bg-gradient-to-br from-emerald-100/90 via-white to-slate-100'
        )}
      >
        <div
          className={cn(
            'relative w-[9.25rem] shrink-0 rounded-[1.65rem] border-[6px] shadow-2xl overflow-hidden',
            isDark ? 'border-zinc-600 bg-white' : 'border-gray-400 bg-white'
          )}
        >
          <div className="flex aspect-[9/17] flex-col items-center bg-gradient-to-b from-emerald-50 to-white px-3 pb-6 pt-7">
            <span
              className="text-center font-serif text-lg font-bold leading-tight text-emerald-900"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Baby routine
            </span>
            <Baby className="mt-3 h-10 w-10 text-emerald-600/90" aria-hidden />
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 ring-1 ring-emerald-200/80" />
              <div className="h-8 w-8 rounded-full bg-emerald-100 ring-1 ring-emerald-200/80" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-[220px] items-center justify-center p-6 md:p-8 md:min-h-[280px]',
        isDark
          ? 'bg-gradient-to-br from-violet-950/60 via-zinc-900 to-[#050508]'
          : 'bg-gradient-to-br from-violet-200/40 via-slate-200 to-zinc-300/80'
      )}
    >
      <div
        className={cn(
          'relative w-[9.25rem] shrink-0 rounded-[1.65rem] border-[6px] shadow-2xl overflow-hidden',
          'border-zinc-600 bg-zinc-900'
        )}
      >
        <div className="flex aspect-[9/17] flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 px-3 pb-8 pt-10">
          <Bot className="mb-3 h-12 w-12 text-cyan-400" aria-hidden />
          <span className="text-center text-[10px] font-extrabold tracking-[0.18em] text-white">
            COMPRAS IA
          </span>
        </div>
      </div>
    </div>
  )
}

export default function FormacaoAndroidPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const xpApps = FORMACAO_ANDROID_APPS.reduce((total, app) => total + app.xp, 0)
  const totalXpDesafios = xpApps + BONUS_COMPLETAR_TODOS_XP

  return (
    <section className={cn('min-h-[60vh]', isDark ? 'bg-[#0e0e0e]' : 'bg-gray-100')}>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 md:p-10 lg:p-12',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-[3.15rem] font-extrabold leading-[1.08] tracking-[-0.03em]">
              <span className={cn(isDark ? 'text-white' : 'text-gray-900')}>Formação </span>
              <span className="text-[#FFD600]">Android Completa</span>
            </h1>
            <p
              className={cn(
                'text-base md:text-[1.05rem] max-w-xl leading-relaxed',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Do zero ao avançado construindo aplicativos reais com as tecnologias mais modernas do ecossistema
              Google.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {heroBadges.slice(0, 2).map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide',
                    isDark
                      ? 'bg-[#2a2a2a] text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#FFD600]" aria-hidden />
                  {label}
                </div>
              ))}
              <div className="col-span-2">
                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide',
                    isDark
                      ? 'bg-[#2a2a2a] text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  )}
                >
                  <Award className="h-4 w-4 shrink-0 text-[#FFD600]" aria-hidden />
                  {heroBadges[2].label}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <a
                href="https://pay.hotmart.com/A102787902R?bid=1769602808367"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFD600] px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-black hover:bg-[#ffe033] transition-colors"
              >
                Explorar formação
                <ArrowRight className="h-5 w-5" aria-hidden />
              </a>
            </div>
            <div
              className={cn(
                'mt-4 w-full max-w-xl rounded-2xl border p-4 md:p-5 lg:hidden',
                isDark
                  ? 'border-[#F2C94C]/30 bg-gradient-to-r from-[#F2C94C]/10 to-transparent'
                  : 'border-yellow-300 bg-gradient-to-r from-yellow-100 to-white'
              )}
            >
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-[0.12em]',
                  isDark ? 'text-[#F2C94C]' : 'text-yellow-800'
                )}
              >
                Potencial de recompensa
              </p>
              <p className={cn('mt-1 text-xl md:text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>
                {`+${totalXpDesafios.toLocaleString('pt-BR')} XP`}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'absolute bottom-8 right-8 hidden w-[360px] rounded-2xl border p-5 lg:block',
              isDark
                ? 'border-[#F2C94C]/30 bg-gradient-to-r from-[#F2C94C]/10 to-transparent'
                : 'border-yellow-300 bg-gradient-to-r from-yellow-100 to-white'
            )}
          >
            <p
              className={cn(
                'text-[11px] font-bold uppercase tracking-[0.12em]',
                isDark ? 'text-[#F2C94C]' : 'text-yellow-800'
              )}
            >
              Potencial de recompensa
            </p>
            <p className={cn('mt-1 text-2xl font-black', isDark ? 'text-white' : 'text-gray-900')}>
              {`+${totalXpDesafios.toLocaleString('pt-BR')} XP`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1',
                  isDark ? 'bg-white/10 text-gray-200' : 'bg-white text-gray-700 border border-gray-200'
                )}
              >
                {`Apps: +${xpApps.toLocaleString('pt-BR')} XP`}
              </span>
              <span className={cn('font-black', isDark ? 'text-[#F2C94C]' : 'text-yellow-700')}>+</span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1',
                  isDark ? 'bg-[#F2C94C]/15 text-[#F2C94C]' : 'bg-yellow-200 text-yellow-900'
                )}
              >
                {`Bonus final: +${BONUS_COMPLETAR_TODOS_XP.toLocaleString('pt-BR')} XP`}
              </span>
            </div>
          </div>
        </div>

        {/* Desafios de aplicativos */}
        <div
          id="desafios"
          className={cn(
            'scroll-mt-24 mt-10 rounded-3xl border p-6 md:p-8 lg:p-10',
            isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 md:mb-10">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight leading-tight">
                <span className={cn(isDark ? 'text-white' : 'text-gray-900')}>Desafios de </span>
                <span className="text-[#F2C94C]">aplicativos</span>
              </h2>
              <p
                className={cn(
                  'text-sm md:text-base leading-relaxed',
                  isDark ? 'text-gray-300' : 'text-gray-600'
                )}
              >
                Construa 6 aplicativos práticos, cada um focado em uma tecnologia específica para acelerar seu
                portfólio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {FORMACAO_ANDROID_APPS.map((c) => (
              <article
                key={c.id}
                className={cn(
                  'rounded-2xl overflow-hidden border flex flex-col shadow-sm',
                  isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'
                )}
              >
                <div>
                  {c.coverSrc ? (
                    <div className="flex justify-center bg-[#e8eee8]">
                      <div className="relative w-full bg-[#e8eee8]" style={challengePreviewFrameStyle}>
                        <Image
                          src={c.coverSrc}
                          alt={`Preview: ${c.title}`}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 640px) 90vw, 280px"
                        />
                      </div>
                    </div>
                  ) : (
                    <ChallengeCardVisual visual={c.visual} isDark={isDark} />
                  )}
                </div>
                <div
                  className={cn(
                    'flex flex-col flex-1 p-4 md:p-5 border-t',
                    isDark ? 'bg-black border-white/5' : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#828282]">
                      App {String(c.mission).padStart(2, '0')}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-[#F2C94C] border',
                        isDark ? 'bg-[#2a2a2a] border-white/10' : 'bg-gray-200 border-gray-300'
                      )}
                    >
                      +{c.xp} XP
                    </span>
                  </div>
                  <h3
                    className={cn(
                      'text-lg md:text-xl font-extrabold tracking-tight mb-4 leading-snug',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {c.title}
                  </h3>
                  {c.mission === 1 ? (
                    <Link
                      href={`/aluno/formacoes/android/apps/${c.id}`}
                      className="mt-auto w-full inline-flex items-center justify-center rounded-xl bg-[#F2C94C] py-3 text-xs font-bold uppercase tracking-wide text-black border border-[#F2C94C] hover:bg-[#f5d35c] transition-colors"
                    >
                      Ver mais
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={cn(
                        'mt-auto w-full inline-flex items-center justify-center rounded-xl py-3 text-xs font-bold uppercase tracking-wide border cursor-not-allowed opacity-70',
                        isDark
                          ? 'bg-white/5 text-gray-400 border-white/10'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      )}
                    >
                      Em breve
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div
            className={cn(
              'mt-8 rounded-2xl border px-4 py-4 md:px-6 md:py-5 text-center',
              'border-[#F2C94C]/35 bg-[#F2C94C]/[0.08]'
            )}
          >
            <p
              className={cn(
                'text-sm md:text-base font-semibold',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              <span className="text-[#F2C94C]">+{BONUS_COMPLETAR_TODOS_XP.toLocaleString('pt-BR')} XP</span>{' '}
              por completar todos os desafios.
            </p>
          </div>
        </div>

        {/* Projetos reais (cases da formação) */}
        <div
          id="projetos"
          className={cn(
            'scroll-mt-24 mt-10 rounded-3xl border p-6 md:p-8 lg:p-10',
            isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'
          )}
        >
          <h2 className="mb-10 text-center text-2xl font-black uppercase tracking-tight md:mb-12 md:text-4xl md:tracking-[0.02em]">
            <span className={cn(isDark ? 'text-white' : 'text-gray-900')}>Projetos </span>
            <span className="text-[#F2C94C]">reais</span>
          </h2>
          <p
            className={cn(
              'mx-auto -mt-6 mb-10 max-w-3xl text-center text-sm leading-relaxed md:mb-12 md:text-base',
              isDark ? 'text-gray-300' : 'text-gray-600'
            )}
          >
            Alunos das formações vão desenvolver projetos reais com programadores experientes. Você ganha
            experiência enquanto estuda, e isso aumenta em 70% sua chance de ser contratado.
          </p>
          <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-2">
            {FORMACAO_ANDROID_PROJETOS_REAIS.map((proj) => (
              <article
                key={proj.id}
                className={cn(
                  'flex flex-col overflow-hidden rounded-2xl border md:min-h-[280px] md:flex-row',
                  isDark ? 'border-white/10 bg-[#161616]' : 'border-gray-200 bg-[#fafafa]'
                )}
              >
                <div className="relative overflow-hidden md:w-[44%] md:max-w-[320px] md:shrink-0">
                  <ProjetoRealPhonePreview variant={proj.preview} isDark={isDark} />
                </div>
                <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden p-6 md:p-7 md:pl-8">
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
              </article>
            ))}
          </div>
        </div>

        <div
          id="conteudo-formacao"
          className={cn(
            'scroll-mt-24 mt-10 rounded-[2rem] border px-6 py-10 md:px-10 md:py-14',
            isDark
              ? 'bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.07),rgba(10,10,10,1))] border-[#F2C94C]/25'
              : 'bg-[radial-gradient(ellipse_at_top,rgba(250,220,70,0.22),rgba(255,255,255,1))] border-yellow-300/80'
          )}
        >
          <div className="mx-auto max-w-4xl text-center">
            <h2
              className={cn(
                'text-3xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              Não e apenas um curso
              <br />
              <span className="text-[#F2C94C] drop-shadow-[0_0_14px_rgba(242,201,76,0.35)]">
                É o seu caminho real.
              </span>
            </h2>

            <p
              className={cn(
                'mx-auto mt-6 max-w-2xl text-sm leading-relaxed md:text-2xl',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              Torne-se o desenvolvedor Android que as empresas disputam, ganhando experiência real enquanto estuda. Comece sua jornada agora e suba de nivel no
              mercado.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:mt-10">
              <a
                href="https://pay.hotmart.com/A102787902R?bid=1769602808367"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex min-w-[220px] items-center justify-center rounded-xl px-7 py-3.5 text-sm font-extrabold uppercase tracking-wider transition-colors',
                  'bg-[#F2C94C] text-black hover:bg-[#f5d35c]'
                )}
              >
                Entrar na formacao
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
