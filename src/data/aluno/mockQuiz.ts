// Quiz mockados
export interface Quiz {
  id: string
  titulo: string
  descricao: string
  categoria: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  questoes: number
  tempoEstimado: number // em minutos
  xpGanho: number
  completo: boolean
  pontuacao?: number
  tentativas: number
  melhorPontuacao?: number
  disponivel: boolean
}

export const mockQuiz: Quiz[] = [
  {
    id: '1',
    titulo: 'Fundamentos de HTML',
    descricao: 'Teste seus conhecimentos sobre tags HTML básicas',
    categoria: 'Web Development',
    nivel: 'iniciante',
    questoes: 10,
    tempoEstimado: 15,
    xpGanho: 50,
    completo: true,
    pontuacao: 90,
    tentativas: 2,
    melhorPontuacao: 90,
    disponivel: true,
  },
  {
    id: '2',
    titulo: 'CSS Selectors e Box Model',
    descricao: 'Questões sobre seletores CSS e modelo de caixa',
    categoria: 'Web Development',
    nivel: 'iniciante',
    questoes: 12,
    tempoEstimado: 20,
    xpGanho: 60,
    completo: true,
    pontuacao: 85,
    tentativas: 1,
    melhorPontuacao: 85,
    disponivel: true,
  },
  {
    id: '3',
    titulo: 'JavaScript Fundamentos',
    descricao: 'Variáveis, funções, escopo e mais conceitos essenciais',
    categoria: 'Web Development',
    nivel: 'intermediario',
    questoes: 15,
    tempoEstimado: 25,
    xpGanho: 80,
    completo: false,
    tentativas: 0,
    disponivel: true,
  },
  {
    id: '4',
    titulo: 'React Hooks e Componentes',
    descricao: 'useState, useEffect e criação de componentes',
    categoria: 'React',
    nivel: 'intermediario',
    questoes: 20,
    tempoEstimado: 30,
    xpGanho: 100,
    completo: false,
    tentativas: 0,
    disponivel: true,
  },
  {
    id: '5',
    titulo: 'Async/Await e Promises',
    descricao: 'Programação assíncrona em JavaScript',
    categoria: 'Web Development',
    nivel: 'avancado',
    questoes: 15,
    tempoEstimado: 25,
    xpGanho: 120,
    completo: false,
    tentativas: 0,
    disponivel: false,
  },
]



