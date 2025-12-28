// Tipos para o Plano de Estudos
export interface CourseProgress {
  id: string
  name: string
  description?: string
  totalLessons: number
  completedLessons: number
}

export type StudyBlockType = "watch_lesson" | "do_quiz" | "do_challenge" | "review" | "custom"

export interface StudyBlock {
  id: string
  type: StudyBlockType
  courseId?: string         // qual curso esse bloco está ligado
  title: string             // ex.: "Assistir módulo 1 de HTML"
  description?: string      // detalhe opcional
  estimatedMinutes?: number // tempo estimado
  isCompleted?: boolean
}

export interface StudyDay {
  id: string
  dayNumber: number         // Dia 1, Dia 2, Dia 3...
  date?: string             // opcional: data real (ISO)
  blocks: StudyBlock[]
}

export interface StudyPlan {
  id: string
  title: string             // ex.: "Plano Norte Tech - 30 dias"
  description?: string
  days: StudyDay[]
}

// Dados mockados de cursos com progresso
export const mockCourseProgress: CourseProgress[] = [
  {
    id: 'norte-tech-fundamentos',
    name: 'Norte Tech – Fundamentos',
    description: 'Porta de entrada ideal para quem quer entrar no mundo da tecnologia',
    totalLessons: 7,
    completedLessons: 2,
  },
  {
    id: 'android-fundamentos',
    name: 'Android – Fundamentos do Ecossistema Mobile',
    description: 'Aprende do zero a criar apps e entender o ecossistema mobile',
    totalLessons: 7,
    completedLessons: 0,
  },
  {
    id: 'web-fundamentos',
    name: 'Web – Construção de Interfaces e Sites',
    description: 'Constrói interfaces e sites completos do zero',
    totalLessons: 7,
    completedLessons: 0,
  },
  {
    id: 'logica-programacao',
    name: 'Lógica de Programação',
    description: 'Aprende a pensar como um programador. Base necessária para qualquer linguagem',
    totalLessons: 5,
    completedLessons: 1,
  },
]

// Função placeholder para gerar plano de estudos
// TODO: no futuro, esta função poderá chamar um endpoint de IA/motor
// que retorna um plano de estudos personalizado (dias, blocos, etc).
// Por enquanto, retorne um plano mockado estático.
export function generateStudyPlanFromCourses(courses: CourseProgress[]): StudyPlan {
  // TODO: substituir plano mockado por plano gerado pelo modelo/IA ou backend.
  
  // Futuro:
  // - Os cursos disponíveis do aluno virão do backend (ex.: Supabase).
  // - Enviaremos esses cursos + perfil do aluno para um endpoint (ou IA),
  //   que retornará um StudyPlan com days/blocks personalizados.
  // - Esta página só vai receber o StudyPlan pronto e exibir.

  // Plano mockado com 5 dias de exemplo
  const today = new Date()
  
  return {
    id: 'plano-mock-001',
    title: 'Plano Norte Tech - 30 dias',
    description: 'Plano de estudos personalizado para dominar os fundamentos da programação',
    days: [
      {
        id: 'day-1',
        dayNumber: 1,
        date: today.toISOString(),
        blocks: [
          {
            id: 'block-1-1',
            type: 'watch_lesson',
            courseId: 'norte-tech-fundamentos',
            title: 'Assistir: Introdução e Visão Geral do Norte Tech',
            description: 'Aula introdutória sobre o programa e metodologia',
            estimatedMinutes: 60,
            isCompleted: true,
          },
          {
            id: 'block-1-2',
            type: 'do_quiz',
            courseId: 'norte-tech-fundamentos',
            title: 'Quiz: Fundamentos da Programação',
            description: 'Teste seus conhecimentos sobre os conceitos básicos',
            estimatedMinutes: 15,
            isCompleted: true,
          },
          {
            id: 'block-1-3',
            type: 'review',
            courseId: 'norte-tech-fundamentos',
            title: 'Revisar: Material complementar',
            description: 'Leitura e exercícios práticos',
            estimatedMinutes: 30,
            isCompleted: false,
          },
        ],
      },
      {
        id: 'day-2',
        dayNumber: 2,
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        blocks: [
          {
            id: 'block-2-1',
            type: 'watch_lesson',
            courseId: 'android-fundamentos',
            title: 'Assistir: Fundamentos do Ecossistema Mobile',
            description: 'Aprenda sobre Android, iOS e o mercado mobile',
            estimatedMinutes: 90,
            isCompleted: false,
          },
          {
            id: 'block-2-2',
            type: 'do_challenge',
            courseId: 'android-fundamentos',
            title: 'Desafio: Configurar ambiente Android',
            description: 'Instale e configure o Android Studio',
            estimatedMinutes: 45,
            isCompleted: false,
          },
        ],
      },
      {
        id: 'day-3',
        dayNumber: 3,
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        blocks: [
          {
            id: 'block-3-1',
            type: 'watch_lesson',
            courseId: 'logica-programacao',
            title: 'Assistir: Algoritmos e Estruturas Básicas',
            description: 'Domine algoritmos e estruturas básicas de programação',
            estimatedMinutes: 60,
            isCompleted: false,
          },
          {
            id: 'block-3-2',
            type: 'do_quiz',
            courseId: 'logica-programacao',
            title: 'Quiz: Algoritmos e Lógica',
            description: 'Teste seus conhecimentos sobre algoritmos',
            estimatedMinutes: 20,
            isCompleted: false,
          },
          {
            id: 'block-3-3',
            type: 'do_challenge',
            courseId: 'logica-programacao',
            title: 'Desafio: Resolver 5 problemas de lógica',
            description: 'Pratique com exercícios práticos',
            estimatedMinutes: 60,
            isCompleted: false,
          },
        ],
      },
      {
        id: 'day-4',
        dayNumber: 4,
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        blocks: [
          {
            id: 'block-4-1',
            type: 'watch_lesson',
            courseId: 'web-fundamentos',
            title: 'Assistir: Construção de Interfaces e Sites',
            description: 'Aprenda a construir interfaces modernas',
            estimatedMinutes: 90,
            isCompleted: false,
          },
          {
            id: 'block-4-2',
            type: 'do_challenge',
            courseId: 'web-fundamentos',
            title: 'Desafio: Criar primeira página HTML',
            description: 'Pratique criando uma página simples',
            estimatedMinutes: 45,
            isCompleted: false,
          },
        ],
      },
      {
        id: 'day-5',
        dayNumber: 5,
        date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        blocks: [
          {
            id: 'block-5-1',
            type: 'review',
            courseId: 'norte-tech-fundamentos',
            title: 'Revisar: Conteúdo da semana',
            description: 'Revise todos os conceitos aprendidos',
            estimatedMinutes: 60,
            isCompleted: false,
          },
          {
            id: 'block-5-2',
            type: 'do_quiz',
            courseId: 'norte-tech-fundamentos',
            title: 'Quiz: Avaliação semanal',
            description: 'Teste completo sobre a semana',
            estimatedMinutes: 30,
            isCompleted: false,
          },
        ],
      },
    ],
  }
}

// Função auxiliar para traduzir tipos de blocos
export function getBlockTypeLabel(type: StudyBlockType): string {
  const labels: Record<StudyBlockType, string> = {
    watch_lesson: 'Assistir Aula',
    do_quiz: 'Fazer Quiz',
    do_challenge: 'Desafio',
    review: 'Revisar',
    custom: 'Personalizado',
  }
  return labels[type]
}

// Função auxiliar para obter ícone do tipo de bloco
export function getBlockTypeIcon(type: StudyBlockType): string {
  const icons: Record<StudyBlockType, string> = {
    watch_lesson: '📺',
    do_quiz: '❓',
    do_challenge: '🎯',
    review: '📚',
    custom: '📝',
  }
  return icons[type]
}






