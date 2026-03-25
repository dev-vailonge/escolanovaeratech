'use client'

import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { BookOpen, Smartphone, Globe, Server, BarChart3, Plane, Code2 } from 'lucide-react'

type Curso = {
  key: string
  title: string
  description: string
  href: string | null
  nivel: string
  badge?: string
  /** Card visualmente desabilitado (ex.: em breve, sem link) */
  disabled?: boolean
  tags: string[]
  icon: React.ComponentType<{ className?: string }>
}

/** Checkout Hotmart — abre em nova aba */
const HOTMART = {
  norteTech:
    'https://pay.hotmart.com/J102851381Y?off=a2r0a50i&bid=1769602948273',
  logica:
    'https://pay.hotmart.com/E102855638K?off=zxel0oad&bid=1774457166153',
  android: 'https://pay.hotmart.com/A102787902R?bid=1769602808367',
  ios: 'https://pay.hotmart.com/W102792939J?bid=1769602931930',
  web: 'https://pay.hotmart.com/U102787997Q?bid=1769602851992',
  backend: 'https://pay.hotmart.com/K102792839B?bid=1769602889517',
  analiseDados: 'https://pay.hotmart.com/V102851360D?off=fxe0fuyw',
} as const

function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

export default function CursosPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const cursos: Curso[] = [
    {
      key: 'norte-tech-list',
      title: 'Norte Tech',
      description: 'Curso de entrada para descobrir sua área e evoluir com projetos práticos.',
      href: HOTMART.norteTech,
      nivel: 'Iniciante',
      tags: ['Kotlin', 'HTML', 'CSS', 'JavaScript', 'Java', 'Python'],
      icon: BookOpen,
    },
    {
      key: 'logica',
      title: 'Lógica de programação',
      description: 'Comece do zero e construa os fundamentos necessários para qualquer linguagem.',
      href: HOTMART.logica,
      nivel: 'Iniciante',
      tags: ['Portugol'],
      icon: Code2,
    },
    {
      key: 'android',
      title: 'Formação Android',
      description: 'Especialize-se em mobile e domine o sistema operacional mais usado do mundo.',
      href: HOTMART.android,
      nivel: 'Iniciante ao Avançado',
      tags: ['Kotlin', 'XML', 'Compose', 'Room Database', 'MVVM', 'Flow', 'Retrofit', 'Unit Test'],
      icon: Smartphone,
    },
    {
      key: 'ios',
      title: 'Formação iOS',
      description: 'Especialize-se em Apple ecosystem com Swift e SwiftUI para apps premium.',
      href: HOTMART.ios,
      nivel: 'Iniciante ao Avançado',
      tags: ['Swift', 'Objective C', 'SwiftUI'],
      icon: Smartphone,
    },
    {
      key: 'web-fullstack',
      title: 'Formação Web Fullstack',
      description: 'Domine o front e back com as stacks mais modernas do mercado atual.',
      href: HOTMART.web,
      nivel: 'Iniciante ao Avançado',
      tags: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'NodeJS'],
      icon: Globe,
    },
    {
      key: 'backend-js',
      title: 'Formação Backend JS',
      description: 'Alta performance com Node, construindo APIs escaláveis e seguras.',
      href: HOTMART.backend,
      nivel: 'Iniciante ao Avançado',
      tags: ['NodeJS', 'TypeScript', 'SQL', 'API REST'],
      icon: Server,
    },
    {
      key: 'analise-dados',
      title: 'Formação Análise de dados',
      description: 'Inteligência de dados, visualização e extração de insights estratégicos.',
      href: HOTMART.analiseDados,
      nivel: 'Iniciante ao Avançado',
      tags: ['Python', 'Tableau', 'Looker Studio', 'SQL'],
      icon: BarChart3,
    },
    {
      key: 'carreira-internacional',
      title: 'Carreira Internacional',
      description: 'Conteúdo para preparação de carreira e posicionamento no mercado global.',
      href: null,
      nivel: 'Iniciante ao Avançado',
      badge: 'EM BREVE',
      disabled: true,
      tags: ['CV', 'LinkedIn', 'Estrutura de dados', 'Algoritmo', 'System Design', 'Entrevistas'],
      icon: Plane,
    },
  ]

  return (
    <section className={cn('px-4 md:px-6 py-10', isDark ? 'bg-[#0e0e0e]' : 'bg-white', 'min-h-[60vh]')}>
      <div className="mx-auto max-w-6xl space-y-8">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border p-6 md:p-7',
            isDark ? 'border-yellow-400/60 bg-[#141414]' : 'border-yellow-500/50 bg-gray-50'
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,214,0,0.10),transparent_55%)]" />
          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6 items-center">
            <div className="space-y-4">
              <h2 className={cn('text-5xl font-extrabold leading-tight', isDark ? 'text-white' : 'text-gray-900')}>
                Cursos
              </h2>
              <p className={cn('max-w-2xl text-xl', isDark ? 'text-gray-300' : 'text-gray-600')}>
                Escolha sua formação e evolua no ranking
              </p>
            </div>

            <div className="hidden md:flex justify-center">
              <div
                className={cn(
                  'h-32 w-32 rounded-full border flex items-center justify-center',
                  isDark ? 'border-yellow-400/30' : 'border-yellow-500/30'
                )}
              >
                <BookOpen className="h-10 w-10 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cursos.map((curso) => {
            const Icon = curso.icon
            const isDisabled = curso.disabled === true
            const content = (
              <div
                className={cn(
                  'relative rounded-2xl p-5 flex flex-col h-full border transition-colors',
                  isDisabled
                    ? cn(
                        'opacity-[0.58] saturate-[0.6] cursor-not-allowed select-none',
                        isDark
                          ? 'bg-[#121212] text-white border-white/[0.06] border-dashed hover:border-white/[0.06]'
                          : 'bg-gray-100/90 text-gray-900 border-gray-300/90 border-dashed hover:border-gray-300/90'
                      )
                    : isDark
                      ? 'bg-[#161616] text-white border-white/10 hover:border-yellow-400'
                      : 'bg-gray-50 text-gray-900 border-gray-200 hover:border-yellow-500'
                )}
              >
                {curso.badge ? (
                  <div
                    className={cn(
                      'absolute top-4 right-4 rounded-md px-2 py-1 text-[10px] font-bold',
                      isDisabled
                        ? isDark
                          ? 'bg-white/[0.08] text-gray-500'
                          : 'bg-gray-300 text-gray-600'
                        : 'bg-yellow-400 text-[#0e0e0e]'
                    )}
                  >
                    {curso.badge}
                  </div>
                ) : null}
                <div
                  className={cn(
                    'mb-4 flex h-10 w-10 items-center justify-center rounded-lg',
                    isDisabled ? (isDark ? 'bg-white/[0.04]' : 'bg-gray-200/80') : 'bg-white/5'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isDisabled
                        ? isDark
                          ? 'text-gray-600'
                          : 'text-gray-400'
                        : isDark
                          ? 'text-[#FFD600]'
                          : 'text-yellow-600'
                    )}
                  />
                </div>
                <h3
                  className={cn(
                    'text-3xl font-extrabold leading-tight',
                    isDisabled
                      ? isDark
                        ? 'text-gray-500'
                        : 'text-gray-500'
                      : isDark
                        ? 'text-gray-100'
                        : 'text-gray-900'
                  )}
                >
                  {curso.title}
                </h3>
                <div className="mt-2">
                  <p
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      isDisabled
                        ? isDark
                          ? 'text-gray-600'
                          : 'text-gray-400'
                        : isDark
                          ? 'text-gray-500'
                          : 'text-gray-500'
                    )}
                  >
                    Nível
                  </p>
                  <p
                    className={cn(
                      'text-sm font-semibold leading-snug mt-0.5',
                      isDisabled
                        ? isDark
                          ? 'text-gray-500'
                          : 'text-gray-500'
                        : isDark
                          ? 'text-[#FFD600]'
                          : 'text-yellow-700'
                    )}
                  >
                    {curso.nivel}
                  </p>
                </div>
                <p
                  className={cn(
                    'mt-3 text-base leading-relaxed',
                    isDisabled
                      ? isDark
                        ? 'text-gray-600'
                        : 'text-gray-500'
                      : isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                  )}
                >
                  {curso.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {curso.tags.map((tag) => (
                    <span
                      key={`${curso.key}-${tag}`}
                      className={cn(
                        'inline-flex rounded-md px-2 py-1 text-[11px] font-semibold',
                        isDisabled
                          ? isDark
                            ? 'bg-[#1a1a1a] text-gray-500'
                            : 'bg-gray-200/80 text-gray-500'
                          : isDark
                            ? 'bg-[#222] text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )

            if (!curso.href) {
              return (
                <div
                  key={curso.key}
                  className={cn('block text-left', isDisabled ? 'cursor-not-allowed' : 'cursor-default')}
                  aria-disabled={isDisabled ? true : undefined}
                >
                  {content}
                </div>
              )
            }

            if (isExternalHref(curso.href)) {
              return (
                <a
                  key={curso.key}
                  href={curso.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-transform hover:scale-[1.01]"
                >
                  {content}
                </a>
              )
            }

            return (
              <a key={curso.key} href={curso.href} className="block transition-transform hover:scale-[1.01]">
                {content}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

