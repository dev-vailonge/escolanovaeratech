/**
 * Evento customizado para notificar quando o usuário ganha XP
 * Permite que o AuthContext atualize apenas quando necessário
 */

export const XP_GAINED_EVENT = 'xpGained'

/**
 * Dispara um evento quando o usuário ganha XP
 */
export function notifyXPGained(userId: string, amount: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(XP_GAINED_EVENT, {
        detail: { userId, amount },
      })
    )
  }
}

/**
 * Hook para escutar eventos de XP ganho
 */
export function useXPGainedListener(callback: (userId: string, amount: number) => void) {
  if (typeof window === 'undefined') return

  const handleXPGained = (event: Event) => {
    const customEvent = event as CustomEvent<{ userId: string; amount: number }>
    callback(customEvent.detail.userId, customEvent.detail.amount)
  }

  window.addEventListener(XP_GAINED_EVENT, handleXPGained)

  return () => {
    window.removeEventListener(XP_GAINED_EVENT, handleXPGained)
  }
}





