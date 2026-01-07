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
 * - Desafio concluído: 50 XP
 * 
 * Formulários:
 * - Formulário preenchido: 1 XP
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
    completo: 50,
  },
  formulario: {
    preenchido: 1,
  },
} as const




