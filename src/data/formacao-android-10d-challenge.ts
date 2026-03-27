import { FORMACAO_ANDROID_APPS } from './formacao-android-desafios'

const CLUB_BASE =
  'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content'

const primeiroDesafioApp = FORMACAO_ANDROID_APPS[0]

export type FormacaoAndroid10dLesson = {
  title: string
  href: string
  description: string
}

export type FormacaoAndroid10dDayPlan = {
  day: number
  lessons: FormacaoAndroid10dLesson[]
}

function splitLessonsIntoDays(
  lessons: FormacaoAndroid10dLesson[],
  dayCount: number
): FormacaoAndroid10dDayPlan[] {
  const n = lessons.length
  const out: FormacaoAndroid10dDayPlan[] = []
  let idx = 0
  const base = Math.floor(n / dayCount)
  const extra = n % dayCount
  for (let day = 1; day <= dayCount; day++) {
    const count = base + (day <= extra ? 1 : 0)
    out.push({ day, lessons: lessons.slice(idx, idx + count) })
    idx += count
  }
  return out
}

export const FORMACAO_ANDROID_10D_CHALLENGE = {
  id: '10d-challenge',
  /** Recompensa da jornada guiada de 10 dias (independente do XP do desafio de app vinculado) */
  xpReward: 3000,
  /** Quantidade de dias da jornada (abas do plano de estudos) */
  journeyDayCount: 10,
  desafioHref: `/aluno/formacoes/android/apps/${primeiroDesafioApp.id}` as const,
  title: '10D Challenge',
  heroLine1: 'Seu primeiro app em',
  heroHighlight: '10 dias',
  badgeLabel: 'Iniciante',
  tags: ['KOTLIN', 'ANDROID STUDIO', 'MULTIPLAS TELAS', 'UI'] as const,
  /** Preview das telas do projeto guiado (Calculadora de gasto de combustível) */
  previewSrc: '/images/formacao-android-10d-challenge-preview.png',
  previewAlt:
    'Telas do aplicativo Calculadora de gasto de combustível — jornada de 10 dias da formação Android',
  subtitle:
    'Jornada guiada pelo professor: do primeiro “Olá, mundo” até um app com telas, navegação e interface. Um desafio por dia para você criar seu primeiro aplicativo Android com confiança.',
  lessons: [
    {
      title: 'Introdução',
      href: `${CLUB_BASE}/2OM8LZ2976`,
      description: 'Visão geral do que você vai construir nessa jornada de 10 dias.',
    },
    {
      title: 'Olá Mundo — Primeira linha de código',
      href: `${CLUB_BASE}/o4EBAx8Zez`,
      description: 'Escreva seu primeiro programa e veja o resultado rodando.',
    },
    {
      title: 'Sintaxe em Kotlin',
      href: `${CLUB_BASE}/y4bpna157R`,
      description: 'Base da linguagem para ler e escrever código com fluência.',
    },
    {
      title: 'Tipos de variáveis',
      href: `${CLUB_BASE}/Z72QrPgyeN`,
      description: 'Entenda como guardar e manipular dados corretamente.',
    },
    {
      title: 'Algoritmo para cálculo de combustível',
      href: `${CLUB_BASE}/R4jjw1Rw4a`,
      description: 'Pratique lógica e estruturas básicas com um problema real.',
    },
    {
      title: 'Download Android Studio',
      href: `${CLUB_BASE}/M7GR0qY8ew`,
      description: 'Baixe a IDE oficial para desenvolvimento Android.',
    },
    {
      title: 'Instalação Android Studio',
      href: `${CLUB_BASE}/146qPVBwOd`,
      description: 'Configure o ambiente no Windows passo a passo.',
    },
    {
      title: 'Instalação Android Studio (Mac)',
      href: `${CLUB_BASE}/NOwAqQEaem`,
      description: 'Configure o Android Studio no macOS.',
    },
    {
      title: 'Virtualização (opcional)',
      href: `${CLUB_BASE}/14owdPD94p`,
      description: 'Acelere o emulador quando precisar de desempenho extra.',
    },
    {
      title: 'Executando app em dispositivo real',
      href: `${CLUB_BASE}/3eapPQn94g`,
      description: 'Rode seu app no celular físico e depure de forma prática.',
    },
    {
      title: 'Interface do usuário — ConstraintLayout',
      href: `${CLUB_BASE}/R4jjw1rw4a`,
      description: 'Monte telas organizadas e responsivas com constraints.',
    },
    {
      title: 'FindViewById',
      href: `${CLUB_BASE}/kOXx6zpXOW`,
      description: 'Conecte elementos visuais (views) ao código Kotlin.',
    },
    {
      title: 'Adicionando ação ao botão',
      href: `${CLUB_BASE}/y4PErjwLex`,
      description: 'Responda a cliques e faça a interface reagir ao usuário.',
    },
    {
      title: 'Navegando entre telas',
      href: `${CLUB_BASE}/V7ygE3QG4J`,
      description: 'Abra outra tela e construa o fluxo básico do app.',
    },
    {
      title: 'Passando dados entre telas',
      href: `${CLUB_BASE}/k458n5joOl`,
      description: 'Envie informações de uma activity para outra.',
    },
    {
      title: 'Melhorando a experiência do usuário',
      href: `${CLUB_BASE}/b4KVZLklOX`,
      description: 'Refine feedbacks, textos e usabilidade da interface.',
    },
    {
      title: 'Utilizando ImageView',
      href: `${CLUB_BASE}/LO0D5jLBOG`,
      description: 'Exiba imagens e deixe o visual mais atrativo.',
    },
    {
      title: 'Melhorando a interface — parte 2',
      href: `${CLUB_BASE}/PeA2dDm27W`,
      description: 'Evolua o layout com ajustes e boas práticas visuais.',
    },
    {
      title: 'Utilizando Toolbar',
      href: `${CLUB_BASE}/RO9210634P`,
      description: 'Adicione barra superior com título e ações.',
    },
    {
      title: 'Exercícios',
      href: `${CLUB_BASE}/x7WVPKw5e2`,
      description: 'Consolide o que aprendeu com prática focada.',
    },
  ] satisfies FormacaoAndroid10dLesson[],
}

/** Aulas agrupadas por dia (distribuição equilibrada: primeiros dias recebem aula extra se houver resto) */
export const FORMACAO_ANDROID_10D_PLAN_BY_DAY: FormacaoAndroid10dDayPlan[] = splitLessonsIntoDays(
  FORMACAO_ANDROID_10D_CHALLENGE.lessons,
  FORMACAO_ANDROID_10D_CHALLENGE.journeyDayCount
)
