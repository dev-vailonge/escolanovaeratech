/**
 * ============================================================
 * SISTEMA DE GAMIFICAÇÃO - ESCOLA NOVA ERA TECH
 * ============================================================
 * 
 * MVP Gamificação (Dez/2025):
 * - Foco em XP, desafios, ranking, comunidade e notificações.
 * - Sistema de moedas e modo intensivo NÃO serão usados no MVP,
 *   mas tipos e estruturas básicas podem ficar preparados.
 * - Futuras versões vão definir:
 *   - Como o aluno ganha moedas.
 *   - Como funciona o modo intensivo.
 *   - Como o plano de estudos automático usa esses dados.
 * 
 * ============================================================
 * AÇÕES QUE DÃO XP NO MVP
 * ============================================================
 * 
 * 1. Completar aula
 *    - XP ganho: varia por aula (definido em mockAulas.ts)
 *    - Exemplo: 50-150 XP por aula
 * 
 * 2. Fazer quiz
 *    - XP ganho: varia por quiz (definido em mockQuiz.ts)
 *    - Exemplo: 50-120 XP por quiz
 *    - Pode ter bônus por acerto (futuro)
 * 
 * 3. Completar desafio
 *    - XP ganho: varia por desafio (definido em mockDesafios.ts)
 *    - Exemplo: 80-500 XP por desafio
 *    - Desafios especiais podem dar mais XP
 * 
 * ============================================================
 * RANKING
 * ============================================================
 * 
 * O ranking é baseado APENAS em XP acumulado.
 * - Não considera moedas
 * - Não considera modo intensivo
 * - Ordenação: maior XP = melhor posição
 * 
 * ============================================================
 */

/**
 * Tipos e interfaces para XP (MVP)
 */
export interface XPState {
  totalXP: number
  level: number
  xpHistory: XPEntry[]
}

export interface XPEntry {
  id: string
  source: 'aula' | 'quiz' | 'desafio' | 'comunidade'
  sourceId: string
  amount: number
  timestamp: string
  description?: string
}

/**
 * Função para calcular XP ganho ao completar uma ação
 * 
 * @param source - Tipo de ação (aula, quiz, desafio)
 * @param sourceId - ID da aula/quiz/desafio
 * @param baseXP - XP base da ação
 * @returns XP total ganho (pode incluir bônus no futuro)
 */
export function calculateXP(
  source: 'aula' | 'quiz' | 'desafio',
  sourceId: string,
  baseXP: number
): number {
  // No MVP, retorna apenas o XP base
  // Futuro: pode adicionar bônus por streak, badges, etc.
  return baseXP
}

/**
 * Função para adicionar XP ao usuário
 * 
 * @param currentXP - XP atual do usuário
 * @param xpGained - XP ganho na ação
 * @returns Novo total de XP
 */
export function addXP(currentXP: number, xpGained: number): number {
  return currentXP + xpGained
}

/**
 * Função para calcular nível baseado em XP
 * 
 * @param totalXP - XP total do usuário
 * @returns Nível calculado
 * 
 * Fórmula MVP: nível = floor(totalXP / 200) + 1
 * (Ajustar conforme necessário)
 */
export function calculateLevel(totalXP: number): number {
  // Fórmula simples para MVP
  // Futuro: pode ter curva de XP mais complexa
  return Math.floor(totalXP / 200) + 1
}

/**
 * ============================================================
 * SISTEMA DE MOEDAS (DESABILITADO NO MVP)
 * ============================================================
 * 
 * TODO: Implementar lógica de moedas após validação do MVP.
 * 
 * As seguintes interfaces e funções estão preparadas para
 * implementação futura, mas NÃO são usadas no MVP.
 * 
 * ============================================================
 */

/**
 * Estado de moedas do usuário
 * 
 * TODO: Detalhar estrutura de history após definir regras de moedas
 */
export interface CoinsState {
  totalCoins: number
  history: CoinsEntry[] // detalhar depois
}

export interface CoinsEntry {
  id: string
  source: 'desafio' | 'quiz' | 'aula' | 'compra' | 'recompensa'
  sourceId: string
  amount: number
  timestamp: string
  description?: string
}

/**
 * Função para calcular moedas ganhas
 * 
 * TODO: Implementar após definir regras de moedas no MVP
 * 
 * @param source - Tipo de ação
 * @param sourceId - ID da ação
 * @param baseCoins - Moedas base
 * @returns Moedas totais ganhas
 */
export function calculateCoins(
  source: 'desafio' | 'quiz' | 'aula',
  sourceId: string,
  baseCoins: number
): number {
  // TODO: Implementar lógica de moedas após validação do MVP
  // Por enquanto, retorna 0 (moedas desabilitadas)
  return 0
}

/**
 * Função para verificar se usuário tem moedas suficientes
 * 
 * TODO: Implementar após definir regras de moedas no MVP
 * 
 * @param currentCoins - Moedas atuais
 * @param requiredCoins - Moedas necessárias
 * @returns true se tem moedas suficientes
 */
export function hasEnoughCoins(currentCoins: number, requiredCoins: number): boolean {
  // TODO: Implementar após definir regras de moedas no MVP
  return false
}

/**
 * Função para adicionar moedas ao usuário
 * 
 * TODO: Implementar após definir regras de moedas no MVP
 * 
 * @param currentCoins - Moedas atuais
 * @param coinsGained - Moedas ganhas
 * @returns Novo total de moedas
 */
export function addCoins(currentCoins: number, coinsGained: number): number {
  // TODO: Implementar após definir regras de moedas no MVP
  return currentCoins
}

/**
 * ============================================================
 * MODO INTENSIVO (DESABILITADO NO MVP)
 * ============================================================
 * 
 * TODO: Implementar modo intensivo após validação do MVP.
 * 
 * O modo intensivo será uma funcionalidade futura que permite
 * ao aluno focar em estudos intensivos por um período determinado.
 * 
 * ============================================================
 */

export interface IntensivoState {
  isActive: boolean
  startDate?: string
  endDate?: string
  dailyGoal?: number
  currentStreak?: number
}

/**
 * Função para ativar modo intensivo
 * 
 * TODO: Implementar após definir regras do modo intensivo
 */
export function activateIntensivo(): IntensivoState {
  // TODO: Implementar após definir regras do modo intensivo
  return { isActive: false }
}

/**
 * Função para verificar se modo intensivo está ativo
 * 
 * TODO: Implementar após definir regras do modo intensivo
 */
export function isIntensivoActive(state: IntensivoState): boolean {
  // TODO: Implementar após definir regras do modo intensivo
  return false
}


