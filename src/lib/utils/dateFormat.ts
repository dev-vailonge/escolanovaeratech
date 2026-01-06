/**
 * Formata data/hora para exibição em português
 * @param dateString String ISO da data
 * @returns Data formatada como "DD/MM/YYYY às HH:MM"
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Formata data para exibição curta em português
 * @param dateString String ISO da data
 * @returns Data formatada como "DD/MM/YYYY"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Verifica se uma data foi editada (updated_at diferente de created_at)
 * @param createdAt Data de criação
 * @param updatedAt Data de atualização
 * @returns true se foi editada
 */
export function wasEdited(createdAt: string | null | undefined, updatedAt: string | null | undefined): boolean {
  if (!createdAt || !updatedAt) return false
  
  try {
    const created = new Date(createdAt).getTime()
    const updated = new Date(updatedAt).getTime()
    // Considerar editada se a diferença for maior que 1 segundo (para evitar problemas de precisão)
    return Math.abs(updated - created) > 1000
  } catch {
    return false
  }
}


