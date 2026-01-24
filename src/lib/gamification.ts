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
 * AÇÕES QUE DÃO XP NO MVP (PONTUAÇÕES OFICIAIS)
 * ============================================================
 * 
 * Os XP que os alunos podem ganhar vão de 0 a 100
 * 
 * 1. Comunidade
 *    - Pergunta: 10 XP
 *    - Resposta: 1 XP
 *    - Resposta marcada como certa pelo autor: 100 XP
 * 
 * 2. Quiz
 *    - Quiz completo: 20 XP (se acertar tudo, ou percentual de quantas acertar)
 * 
 * 3. Desafios
 *    - Desafio concluído: 150 XP
 * 
 * 4. Formulários
 *    - Formulário preenchido: 1 XP
 * 
 * ============================================================
 * NÍVEIS OFICIAIS (PROGRESSÃO EXPONENCIAL)
 * ============================================================
 * 
 * Os níveis vão de 1 a 9, sendo:
 * - Iniciante = Níveis 1 a 3
 * - Intermediário = Níveis 4 a 6
 * - Avançado = Níveis 7 a 9
 * 
 * Progressão de XP por nível:
 * - Level 1: 0 pontos
 * - Level 2: 10 pontos
 * - Level 3: 20 pontos
 * - Level 4: 40 pontos
 * - Level 5: 80 pontos
 * - Level 6: 160 pontos
 * - Level 7: 320 pontos
 * - Level 8: 640 pontos
 * - Level 9: 1280 pontos
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
 * Requisitos de XP para cada nível (progressão exponencial)
 */
const LEVEL_THRESHOLDS = [0, 10, 20, 40, 80, 160, 320, 640, 1280] as const

/**
 * Função para calcular nível baseado em XP (progressão exponencial)
 * 
 * @param totalXP - XP total do usuário
 * @returns Nível calculado (1 a 9)
 * 
 * NÍVEIS OFICIAIS:
 * - Iniciante: Níveis 1 a 3
 * - Intermediário: Níveis 4 a 6
 * - Avançado: Níveis 7 a 9
 * 
 * Progressão exponencial: 0, 10, 20, 40, 80, 160, 320, 640, 1280 XP
 */
export function calculateLevel(totalXP: number): number {
  // Percorrer thresholds de trás para frente para encontrar o nível correto
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * Função para obter requisitos de XP para cada nível
 * 
 * @returns Array com requisitos de XP por nível (índice = nível - 1)
 */
export function getLevelRequirements(): readonly number[] {
  return LEVEL_THRESHOLDS
}

/**
 * Função para obter XP necessário para alcançar um nível específico
 * 
 * @param level - Nível desejado (1 a 9)
 * @returns XP necessário para alcançar o nível, ou null se nível inválido
 */
export function getXPForLevel(level: number): number | null {
  if (level < 1 || level > 9) return null
  return LEVEL_THRESHOLDS[level - 1]
}

/**
 * Função para calcular XP necessário para próximo nível
 * 
 * @param currentXP - XP atual do usuário
 * @param currentLevel - Nível atual do usuário
 * @returns XP necessário para próximo nível, ou null se já está no nível máximo
 */
export function getXPForNextLevel(currentXP: number, currentLevel: number): number | null {
  if (currentLevel >= 9) return null
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel]
  return Math.max(0, nextLevelXP - currentXP)
}

/**
 * Função para calcular progresso atual em direção ao próximo nível
 * 
 * @param currentXP - XP atual do usuário
 * @param currentLevel - Nível atual do usuário
 * @returns Progresso em porcentagem (0-100), ou 100 se já está no nível máximo
 */
export function getLevelProgress(currentXP: number, currentLevel: number): number {
  if (currentLevel >= 9) return 100
  
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1]
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel]
  const xpNeeded = nextLevelXP - currentLevelXP
  const xpProgress = currentXP - currentLevelXP
  
  return Math.min(100, Math.max(0, Math.round((xpProgress / xpNeeded) * 100)))
}

/**
 * Função para obter categoria do nível
 * 
 * @param level - Nível do usuário (1 a 9)
 * @returns Categoria do nível
 */
export function getLevelCategory(level: number): 'iniciante' | 'intermediario' | 'avancado' {
  if (level >= 1 && level <= 3) {
    return 'iniciante'
  } else if (level >= 4 && level <= 6) {
    return 'intermediario'
  } else {
    return 'avancado'
  }
}

/**
 * Função para obter classes CSS da borda baseada no nível
 * 
 * @param level - Nível do usuário (1 a 9)
 * @param isDark - Se o tema é escuro (opcional, não usado mais - mantido para compatibilidade)
 * @returns Classes CSS para a borda do avatar
 * 
 * Cores oficiais (consistentes em dark e light):
 * - Iniciante (1-3): Amarelo
 * - Intermediário (4-6): Azul
 * - Avançado (7-9): Roxo
 */
export function getLevelBorderColor(level: number, isDark: boolean = false): string {
  const category = getLevelCategory(level)
  
  if (category === 'iniciante') {
    // Níveis 1-3: Amarelo (mesma cor em ambos os temas)
    return 'border-yellow-500'
  } else if (category === 'intermediario') {
    // Níveis 4-6: Azul (mesma cor em ambos os temas)
    return 'border-blue-500'
  } else {
    // Níveis 7-9: Roxo (mesma cor em ambos os temas)
    return 'border-purple-600'
  }
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


