/**
 * ============================================================
 * CONSTANTES DE XP OFICIAIS - ESCOLA NOVA ERA TECH
 * ============================================================
 * 
 * PONTUAÇÕES OFICIAIS (XP de 0 a 100):
 * 
 * Comunidade:
 * - Pergunta: 10 XP
 * - Resposta: 1 XP
 * - Resposta marcada como certa pelo autor: 100 XP
 * 
 * Quiz:
 * - Quiz completo: 20 XP (se acertar tudo, ou percentual de quantas acertar)
 * 
 * Desafios:
 * - Desafio concluído: 40 XP
 * 
 * Formulários:
 * - Formulário preenchido: 1 XP
 * 
 * Hotmart Club:
 * - Comentários realizados: 1 ponto
 * - Comentários recebidos: 1 ponto
 * - Reações recebidas em post: 1 ponto
 * - Aulas avaliadas: 2 pontos
 * - Aulas concluídas: 10 pontos
 * 
 * ============================================================
 */

export const XP_CONSTANTS = {
  comunidade: {
    pergunta: 10,
    resposta: 1,
    respostaCerta: 100,
  },
  quiz: {
    maximo: 20,
  },
  desafio: {
    completo: 40,
  },
  formulario: {
    preenchido: 1,
  },
} as const

/**
 * ============================================================
 * CONSTANTES DE XP HOTMART CLUB
 * ============================================================
 * 
 * Pontuação oficial da Hotmart Club conforme regras do jogo:
 * 
 * Comunidades:
 * - Comentários realizados: 1 ponto
 * - Comentários recebidos: 1 ponto
 * - Reações recebidas em post: 1 ponto
 * 
 * Sala de Aula:
 * - Aulas avaliadas: 2 pontos
 * - Aulas concluídas: 10 pontos
 * 
 * ============================================================
 */
export const HOTMART_XP_CONSTANTS = {
  comentario: 1,
  comentarioRecebido: 1,
  reacaoRecebida: 1,
  aulaAvaliada: 2,
  aulaConcluida: 10,
} as const



