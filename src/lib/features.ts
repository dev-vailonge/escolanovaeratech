/**
 * Feature Flags para controlar funcionalidades do MVP
 * 
 * Use estas flags para habilitar/desabilitar funcionalidades
 * sem precisar deletar código, facilitando a evolução futura.
 */
export const FEATURES = {
  /**
   * Sistema de moedas/coins
   * Desabilitado no MVP - será implementado futuramente
   */
  coins: false,

  /**
   * Modo intensivo de estudos
   * Desabilitado no MVP - será implementado futuramente
   */
  intensivo: false,

  /**
   * Sistema de streak (sequência de dias estudando)
   * Desabilitado no MVP - será implementado futuramente
   */
  streak: false,
} as const satisfies Record<string, boolean>

/**
 * Helper para verificar se uma feature está habilitada
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true as boolean
}

