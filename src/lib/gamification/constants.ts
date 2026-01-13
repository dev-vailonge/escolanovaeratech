/**
 * ============================================================
 * CONSTANTES DE XP OFICIAIS - ESCOLA NOVA ERA TECH
 * ============================================================
 * 
 * PONTUAÇÕES OFICIAIS (XP de 0 a 100):
 * 
 * Comunidade:
 * - Pergunta: 5 XP
 * - Resposta: 1 XP
 * - Resposta marcada como certa pelo autor: 30 XP
 * 
 * Quiz:
 * - Quiz completo: 10 XP (se acertar tudo, ou percentual de quantas acertar)
 * 
 * Desafios:
 * - Desafio concluído: 150 XP
 * 
 * Formulários:
 * - Formulário preenchido: 1 XP
 * 
 * ============================================================
 */

export const XP_CONSTANTS = {
  comunidade: {
    pergunta: 5,
    resposta: 1,
    respostaCerta: 30,
  },
  quiz: {
    maximo: 10,
  },
  desafio: {
    completo: 150,
  },
  formulario: {
    preenchido: 1,
  },
} as const




