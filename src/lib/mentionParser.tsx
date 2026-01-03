import React from 'react'

/**
 * Parser de menções @username em textos
 */

/**
 * Extrai menções do formato @username de um texto
 * Suporta nomes compostos (ex: @Beto Imlau)
 * @param text Texto para analisar
 * @returns Array de usernames mencionados (sem o @)
 */
export function extractMentions(text: string): string[] {
  // Regex que captura @ seguido de uma ou mais palavras (separadas por espaços)
  // Para na primeira pontuação, quebra de linha, ou fim do texto
  // Exemplos: @Beto, @Beto Imlau, @João Silva
  const mentionRegex = /@([\w\u00C0-\u017F]+(?:\s+[\w\u00C0-\u017F]+)*)/g
  const matches = text.matchAll(mentionRegex)
  const mentions: string[] = []
  const seen = new Set<string>()

  for (const match of matches) {
    // Pegar o nome completo (pode ter espaços)
    const username = match[1].trim()
    const usernameLower = username.toLowerCase()
    
    if (username && !seen.has(usernameLower)) {
      seen.add(usernameLower)
      mentions.push(username) // Manter case original para melhor match
    }
  }

  return mentions
}

/**
 * Valida menções verificando se os usuários existem
 * @param mentions Array de usernames
 * @returns Promise com array de user_ids válidos
 */
export async function validateMentions(mentions: string[]): Promise<string[]> {
  if (mentions.length === 0) return []

  try {
    const response = await fetch('/api/comunidade/validar-mencoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentions }),
    })

    if (!response.ok) {
      console.warn('Erro ao validar menções:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.userIds || []
  } catch (error) {
    console.error('Erro ao validar menções:', error)
    return []
  }
}

/**
 * Formata menções no texto, destacando-as visualmente
 * @param text Texto com menções
 * @param users Array de usuários mencionados
 * @returns ReactNode com menções formatadas
 */
export function formatMentions(
  text: string,
  users: Array<{ id: string; name: string }>
): React.ReactNode {
  const parts: React.ReactNode[] = []
  // Mesma regex do extractMentions para consistência
  const mentionRegex = /@([\w\u00C0-\u017F]+(?:\s+[\w\u00C0-\u017F]+)*)/g
  let lastIndex = 0
  let match

  const userMap = new Map(users.map((u) => [u.name.toLowerCase(), u]))

  while ((match = mentionRegex.exec(text)) !== null) {
    // Adicionar texto antes da menção
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const username = match[1].trim()
    const user = userMap.get(username.toLowerCase())

    if (user) {
      // Adicionar menção destacada
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="font-semibold text-yellow-400"
        >
          @{username}
        </span>
      )
    } else {
      // Menção não encontrada, manter texto original
      parts.push(`@${username}`)
    }

    lastIndex = match.index + match[0].length
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : text
}

