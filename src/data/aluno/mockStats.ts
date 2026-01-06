// Estatísticas mockadas do aluno
export interface Stats {
  aulasCompletas: number
  aulasTotais: number
  quizCompletos: number
  quizTotais: number
  desafiosConcluidos: number
  desafiosTotais: number
  tempoEstudo: number // em minutos
  participacaoComunidade: number
  respostasCorretas: number
  questoesTotais: number
}

export const mockStats: Stats = {
  aulasCompletas: 28,
  aulasTotais: 45,
  quizCompletos: 15,
  quizTotais: 30,
  desafiosConcluidos: 8,
  desafiosTotais: 15,
  tempoEstudo: 1240,
  participacaoComunidade: 23,
  respostasCorretas: 87,
  questoesTotais: 120,
}








