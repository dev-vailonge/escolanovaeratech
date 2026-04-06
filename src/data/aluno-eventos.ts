export const ALUNO_EVENTO_TIPOS = [
  'meetup',
  'clube_livro',
  'projetos_reais',
  'mentoria',
] as const

export type AlunoEventoTipo = (typeof ALUNO_EVENTO_TIPOS)[number]

export const ALUNO_EVENTO_TIPO_LABELS: Record<AlunoEventoTipo, string> = {
  meetup: 'Meetup',
  clube_livro: 'Clube do livro',
  projetos_reais: 'Projetos reais',
  mentoria: 'Mentoria',
}

export interface AlunoEvento {
  id: string
  tipo: AlunoEventoTipo
  startAt: string
  endAt: string
  title: string
  /** Tema ou trilha complementar (ex.: formação) */
  seriesLabel?: string
  description: string
}
