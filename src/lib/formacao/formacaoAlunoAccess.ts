/** Cursos cujo plano/desafio exige matrícula comprovada na Hotmart (`users.role === 'formacao'`). */
export const CURSO_SLUGS_EXIGEM_VALIDACAO_FORMACAO = ['android'] as const

export function cursoSlugExigeValidacaoFormacao(slug: string | null | undefined): boolean {
  if (!slug) return false
  return (CURSO_SLUGS_EXIGEM_VALIDACAO_FORMACAO as readonly string[]).includes(slug)
}

export type UserFormacaoMatriculaRoleOptions = {
  /**
   * Só para `role === 'admin'`: simula aluno sem matrícula (modo teste do gate). Não altera `users.role`.
   */
  adminPretendSemMatricula?: boolean
}

/** Aluno já validou e-mail na Hotmart — role atualizado pela API `/api/formacoes/validar`. Admin passa exceto em modo teste. */
export function userHasFormacaoMatriculaRole(
  role: string | undefined | null,
  opts?: UserFormacaoMatriculaRoleOptions
): boolean {
  if (role === 'formacao') return true
  if (role === 'admin') {
    if (opts?.adminPretendSemMatricula) return false
    return true
  }
  return false
}
