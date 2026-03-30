import type { DatabaseDesafio, DatabaseDesafioSubmission } from '@/types/database'

export type MeuDesafioStatus =
  | 'pendente_envio'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'desistiu'

export type MeuDesafioMerged = {
  id: string
  desafio: DatabaseDesafio
  atribuido_em: string
  submission?: DatabaseDesafioSubmission
  status: MeuDesafioStatus
  tentativas: number
}

const EM_ANDAMENTO: MeuDesafioStatus[] = ['pendente_envio', 'aguardando_aprovacao', 'rejeitado']

/**
 * Mescla atribuições, detalhes do desafio e submissões (mesma regra da página /aluno/desafios).
 */
export function mergeAtribuicoesComDesafios(
  atribuicoes: { desafio_id: string; created_at: string }[],
  desafios: DatabaseDesafio[] | null | undefined,
  submissions: DatabaseDesafioSubmission[] | null | undefined
): MeuDesafioMerged[] {
  const merged: MeuDesafioMerged[] = []

  for (const atrib of atribuicoes) {
    const desafio = desafios?.find((d) => d.id === atrib.desafio_id)
    if (!desafio) continue

    const todasSubmissions = submissions?.filter((s) => s.desafio_id === atrib.desafio_id) || []
    const submission =
      todasSubmissions.length > 0 ? todasSubmissions[todasSubmissions.length - 1] : undefined

    const tentativas = todasSubmissions.filter(
      (s) => s.status === 'pendente' || s.status === 'aprovado' || s.status === 'rejeitado'
    ).length

    let status: MeuDesafioStatus = 'pendente_envio'

    if (submission) {
      const subStatus = submission.status as string
      if (subStatus === 'pendente') status = 'aguardando_aprovacao'
      else if (subStatus === 'aprovado') status = 'aprovado'
      else if (subStatus === 'rejeitado') status = 'rejeitado'
      else if (subStatus === 'desistiu') status = 'desistiu'
    }

    if (status === 'desistiu') continue

    merged.push({
      id: atrib.desafio_id,
      desafio,
      atribuido_em: atrib.created_at,
      submission,
      status,
      tentativas: tentativas || 0,
    })
  }

  return merged
}

/** Não concluído: ainda pode enviar ou está em revisão / devolvido para ajustes. */
export function pickPrimeiroDesafioEmAndamento(list: MeuDesafioMerged[]): MeuDesafioMerged | null {
  const found = list.find((d) => EM_ANDAMENTO.includes(d.status))
  return found ?? null
}

export function labelStatusDesafio(status: MeuDesafioStatus): string {
  switch (status) {
    case 'pendente_envio':
      return 'Pendente de envio'
    case 'aguardando_aprovacao':
      return 'Aguardando correção'
    case 'rejeitado':
      return 'Ajustes solicitados'
    case 'aprovado':
      return 'Aprovado'
    case 'desistiu':
      return 'Desistiu'
    default:
      return status
  }
}

export function labelDificuldadeDesafio(d: DatabaseDesafio['dificuldade']): string {
  switch (d) {
    case 'iniciante':
      return 'Iniciante'
    case 'intermediario':
      return 'Intermediário'
    case 'avancado':
      return 'Avançado'
    default:
      return d
  }
}
