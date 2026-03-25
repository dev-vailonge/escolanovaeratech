'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'
import { BookOpen, ChevronLeft } from 'lucide-react'
import { markdownToSafeHtml } from '@/lib/markdown'

export default function NorteTechWikiPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const categories = [
    { key: 'todas', label: 'Todas' },
    { key: 'logica-de-programacao', label: 'logica de programacao' },
    { key: 'web', label: 'web' },
    { key: 'android', label: 'android' },
    { key: 'backend', label: 'backend' },
    { key: 'analise-de-dados', label: 'analise de dados' },
    { key: 'carreira', label: 'carreira' },
  ] as const

  type CategoryKey = (typeof categories)[number]['key']
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('todas')

  type WikiContent = { body: string[]; note?: string }
  type WikiSection = {
    key: string
    title: string
    description: string
    bullets: string[]
    tags: string[]
    content?: WikiContent | null
  }

  const sections: WikiSection[] = [
    {
      key: 'comece-aqui',
      title: 'Comece aqui',
      description: 'Guia de orientação para você entender como estudar, como se organizar e como acompanhar o progresso.',
      bullets: ['Checklist inicial', 'Como usar o portfólio', 'Organização por semana', 'Dicas de constância'],
      tags: ['logica-de-programacao', 'carreira'],
    },
    {
      key: 'requisitos-e-portfolio',
      title: 'Requisitos e Portfólio',
      description: 'Estrutura para transformar aprendizado em evidência: projetos, desafios e entregáveis que contam para entrevistas.',
      bullets: ['O que as vagas pedem', 'Como escolher um projeto', 'Como documentar', 'Evidências para entrevistas'],
      tags: ['web', 'android', 'backend', 'analise-de-dados'],
    },
    {
      key: 'entrevistas',
      title: 'Entrevistas',
      description: 'Preparação prática para você se sentir confiante na hora de explicar seu caminho e responder perguntas comuns.',
      bullets: ['Como apresentar seu projeto', 'Perguntas frequentes', 'Plano de evolução', 'Como treinar respostas'],
      tags: ['carreira', 'logica-de-programacao'],
    },
    {
      key: 'logica-o-que-e',
      title: 'O que é lógica de programação',
      description:
        'Lógica de programação é a forma de pensar e organizar passos para resolver problemas, transformando ideias em um fluxo que o computador consegue executar.',
      bullets: ['Problema -> algoritmo', 'Sequência e decisões', 'Variáveis e controle', 'Prática com exercícios'],
      tags: ['logica-de-programacao'],
      content: {
        body: [
          '📘 Wiki: Lógica de Programação (Do Zero Absoluto)',
          '🧠 O que é Lógica de Programação?',
          'Lógica de programação é a forma de organizar pensamentos para resolver problemas passo a passo.',
          '👉 Em outras palavras:',
          'É transformar um problema em uma sequência clara de ações.',
          'Antes de escrever qualquer código, você precisa saber o que fazer e em qual ordem.',
          '---',
          '🍳 Exemplo simples (vida real)',
          '**Problema:** Fazer um café ☕',
          '**Passo a passo:**',
          '1. Colocar água na chaleira',
          '2. Esquentar a água',
          '3. Colocar o pó de café',
          '4. Despejar a água quente',
          '5. Servir',
          '👉 Se você bagunçar a ordem, o resultado não funciona.',
          'Isso é lógica de programação.',
          '---',
          '🧱 Os 3 pilares da lógica de programação',
          '1. Sequência (Ordem das ações)',
          'Tudo acontece em uma ordem específica.',
          'Exemplo:',
          'Acordar → Escovar os dentes → Tomar café',
          '---',
          '2. Decisão (Escolhas)',
          'Às vezes precisamos tomar decisões.',
          'Exemplo:',
          'Se estiver chovendo → levar guarda-chuva',
          'Senão → sair sem',
          'Aqui existe um caminho A ou B.',
          '---',
          '3. Repetição (Fazer várias vezes)',
          'Algumas ações precisam ser repetidas.',
          'Exemplo:',
          'Dar 10 passos',
          'OU',
          'Enquanto não chegar → continuar andando',
          '---',
          '🧠 Como pensar com lógica?',
          'Sempre que você encontrar um problema, pense:',
          '1. Qual é o objetivo?',
          '2. Quais são os passos?',
          '3. Existe alguma decisão?',
          '4. Algo precisa se repetir?',
          '---',
          '🛠️ Exercícios',
          'Exercício 1: Fazer um sanduíche',
          'Crie um passo a passo para fazer um sanduíche.',
          '👉 Pense na ordem correta das ações.',
          '---',
          'Exercício 2: Sair de casa',
          'Crie uma lógica para sair de casa considerando:',
          '- Se estiver chovendo → levar guarda-chuva',
          '- Senão → sair normalmente',
          '---',
          'Exercício 3: Beber água',
          'Crie uma lógica onde a pessoa deve beber 5 copos de água ao longo do dia.',
          '👉 Dica: pense em repetição.',
          '---',
          '🚀 Resumo final',
          '- Lógica de programação é pensar antes de codar',
          '- É organizar um problema em passos claros',
          '- Você usa:',
          '  - Sequência',
          '  - Decisão',
          '  - Repetição',
          '- Não precisa de código para praticar lógica',
          '---',
          '📌 A ideia mais importante',
          'Programar não é sobre escrever código.',
          'É sobre saber resolver problemas de forma clara e organizada',
        ],
      },
    },
  ]

  const searchParams = useSearchParams()
  const selectedSec = searchParams.get('sec')
  const selectedSection = selectedSec ? sections.find((s) => s.key === selectedSec) : null

  const filteredSections =
    selectedCategory === 'todas'
      ? sections
      : sections.filter((s) => s.tags.includes(selectedCategory))

  return (
    <section className={cn('px-4 md:px-6 py-10', isDark ? 'bg-[#0e0e0e]' : 'bg-white')}>
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href="/aluno/norte-tech"
          className={cn(
            'inline-flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 transition-colors',
            isDark ? 'bg-[#1a1919] text-gray-300 hover:bg-[#201f1f]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para Norte Tech
        </Link>

        <div
          className={cn(
            'rounded-3xl p-6 md:p-8',
            isDark ? 'bg-gradient-to-br from-[#201f1f] via-[#171717] to-[#111111]' : 'bg-gray-50'
          )}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-10 w-2 rounded-full bg-[#FFD600] shadow-[0_0_26px_rgba(255,214,0,0.35)]" />
                <h1 className={cn('text-4xl font-extrabold tracking-[-0.02em]', isDark ? 'text-white' : 'text-gray-900')}>
                  Norte Tech — Wiki
                </h1>
              </div>
              <p className={cn('text-sm md:text-base max-w-2xl', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Um espaço para guiar seus passos: referências, checklists e orientações práticas para você estudar com clareza.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold', isDark ? 'bg-[#1a1919] text-gray-300' : 'bg-white text-gray-700')}>
                Atualizado em breve
              </span>
              <span className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold', isDark ? 'bg-[#1a1919] text-gray-300' : 'bg-white text-gray-700')}>
                Conteudo por trilhas
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className={cn('text-xs tracking-[0.08em] font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Seções da Wiki
          </h2>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                    isActive
                      ? isDark
                        ? 'bg-yellow-400 text-[#0e0e0e]'
                        : 'bg-yellow-400 text-[#0e0e0e]'
                      : isDark
                      ? 'bg-[#1a1919] text-gray-300 hover:bg-[#201f1f]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            {selectedSection ? (
              <div
                className={cn(
                  'rounded-3xl p-6 md:p-8 border',
                  isDark ? 'bg-[#1a1919] border-white/10' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-2xl bg-[#201f1f] flex items-center justify-center shadow-[0_0_26px_rgba(255,214,0,0.12)]">
                        <BookOpen className={cn('w-5 h-5 text-[#FFD600]')} />
                      </span>
                      <h2 className="text-3xl font-extrabold leading-tight">{selectedSection.title}</h2>
                    </div>
                    <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {selectedSection.description}
                    </p>
                  </div>

                  <Link
                    href="/aluno/norte-tech-wiki"
                    className={cn(
                      'inline-flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 transition-colors',
                      isDark ? 'bg-[#0e0e0e] text-gray-300 hover:bg-[#201f1f]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Voltar para lista
                  </Link>
                </div>

                {'content' in selectedSection && selectedSection.content ? (
                  <div className="mt-6 space-y-4">
                    <div
                      className={cn(
                        'text-sm md:text-base',
                        isDark ? 'text-gray-300' : 'text-gray-700',
                        '[&_p]:my-2 [&_p]:leading-relaxed',
                        '[&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside',
                        '[&_li]:my-0.5',
                        '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-extrabold',
                        '[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-extrabold',
                        '[&_hr]:my-4 [&_hr]:border-white/10'
                      )}
                      dangerouslySetInnerHTML={{
                        __html: markdownToSafeHtml(selectedSection.content.body.join('\n') || ''),
                      }}
                    />

                    {selectedSection.content.note ? (
                      <div
                        className={cn(
                          'rounded-2xl p-4 border',
                          isDark ? 'border-yellow-400/60 bg-[#201f1f]' : 'border-yellow-400/60 bg-yellow-50'
                        )}
                      >
                        <p className={cn('text-sm font-semibold', isDark ? 'text-yellow-300' : 'text-yellow-800')}>
                          {selectedSection.content.note}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className={cn('mt-6 text-sm text-gray-400', isDark ? '' : 'text-gray-600')}>
                    Conteúdo do artigo em breve.
                  </div>
                )}
              </div>
            ) : (
              <>
                {filteredSections.map((s) => (
                  <Link
                    key={s.key}
                    href={`/aluno/norte-tech-wiki?sec=${encodeURIComponent(s.key)}`}
                    className="block"
                  >
                    <div
                      className={cn(
                        'relative rounded-3xl p-6 border transition-colors cursor-pointer',
                        isDark
                          ? 'bg-[#1a1919] text-white border-transparent hover:border-yellow-400/70'
                          : 'bg-gray-50 text-gray-900 border-transparent hover:border-yellow-400/60'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="h-9 w-9 rounded-2xl bg-[#201f1f] flex items-center justify-center shadow-[0_0_26px_rgba(255,214,0,0.12)]">
                          <BookOpen className={cn('w-5 h-5 text-[#FFD600]')} />
                        </span>
                        <h3 className="text-2xl font-extrabold leading-tight">{s.title}</h3>
                      </div>

                      <p className={cn('text-sm leading-relaxed mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {s.description}
                      </p>

                      <div className="space-y-2">
                        {s.bullets.map((b) => (
                          <div
                            key={b}
                            className={cn('flex items-start gap-2 text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}
                          >
                            <span className={cn('mt-2 inline-block w-2 h-2 rounded-full bg-[#FFD600]')} />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}

                {filteredSections.length === 0 ? (
                  <div className={cn('text-sm text-gray-400', isDark ? '' : 'text-gray-600')}>
                    Nenhuma seção encontrada para este filtro.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

