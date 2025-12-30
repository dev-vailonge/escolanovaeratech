/**
 * Constantes e helpers para cursos/formações da Escola Nova Era Tech
 */

export type CursoId =
  | 'android'
  | 'frontend'
  | 'backend'
  | 'ios'
  | 'analise-dados'
  | 'norte-tech'
  | 'logica-programacao'
  | null

export interface Curso {
  id: CursoId
  nome: string
  descricao: string
}

/**
 * Lista de cursos/formações disponíveis
 */
export const CURSOS: Record<NonNullable<CursoId>, Omit<Curso, 'id'>> = {
  'android': {
    nome: 'Android (Kotlin)',
    descricao: 'Desenvolvimento completo de apps nativos Android com Kotlin, UI/UX, APIs, Room, coroutines e publicação na Play Store.',
  },
  'frontend': {
    nome: 'Web Frontend (React)',
    descricao: 'Domine React e Next.js para criar interfaces modernas e performáticas. Torne-se um desenvolvedor frontend completo.',
  },
  'backend': {
    nome: 'Backend NodeJs',
    descricao: 'Torne-se desenvolvedor backend completo. Domine APIs REST, autenticação, bancos de dados e deploy em produção.',
  },
  'ios': {
    nome: 'iOS (Swift)',
    descricao: 'Torne-se desenvolvedor iOS profissional. Domine SwiftUI, Combine e publique seus apps na App Store.',
  },
  'analise-dados': {
    nome: 'Análise de Dados (Python)',
    descricao: 'Domine análise de dados com Python. Aprenda Pandas, SQL, visualização e crie dashboards profissionais.',
  },
  'norte-tech': {
    nome: 'Norte Tech',
    descricao: 'Porta de entrada ideal para quem quer entrar no mundo da tecnologia com direção e propósito.',
  },
  'logica-programacao': {
    nome: 'Lógica de Programação',
    descricao: 'Aprenda a pensar como um programador. Base necessária para qualquer linguagem.',
  },
}

/**
 * Lista de cursos incluindo opção "Geral" (null)
 */
export const CURSOS_COM_GERAL: Array<Curso> = [
  {
    id: null,
    nome: 'Geral',
    descricao: 'Desafio geral, não vinculado a curso específico',
  },
  ...Object.entries(CURSOS).map(([id, curso]) => ({
    id: id as NonNullable<CursoId>,
    ...curso,
  })),
]

/**
 * Obtém informações de um curso pelo ID
 * @param cursoId - ID do curso
 * @returns Informações do curso ou null se não encontrado
 */
export function getCursoById(cursoId: CursoId): Curso | null {
  if (!cursoId) {
    return {
      id: null,
      nome: 'Geral',
      descricao: 'Desafio geral, não vinculado a curso específico',
    }
  }

  const curso = CURSOS[cursoId]
  if (!curso) return null

  return {
    id: cursoId,
    ...curso,
  }
}

/**
 * Obtém o nome do curso pelo ID
 * @param cursoId - ID do curso
 * @returns Nome do curso ou "Geral" se null
 */
export function getCursoNome(cursoId: CursoId): string {
  if (!cursoId) return 'Geral'
  return CURSOS[cursoId]?.nome || 'Curso Desconhecido'
}

/**
 * Verifica se um curso ID é válido
 * @param cursoId - ID a ser validado
 * @returns true se válido
 */
export function isValidCursoId(cursoId: string | null | undefined): cursoId is CursoId {
  if (!cursoId) return true // null é válido (desafio geral)
  return cursoId in CURSOS
}




