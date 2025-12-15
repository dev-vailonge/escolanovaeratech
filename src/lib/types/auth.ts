/**
 * Tipos de autenticação e acesso - Escola Nova Era Tech
 * 
 * Define os tipos de usuário e níveis de acesso do sistema.
 */

export type UserRole = "aluno" | "admin"

export type AccessLevel = "full" | "limited"

/**
 * Interface do usuário autenticado
 * 
 * Para alunos:
 * - accessLevel: "full" - acesso completo (pode participar de quiz, desafios, ranking)
 * - accessLevel: "limited" - acesso limitado (pode ver mas não participar de quiz/desafios, não aparece no ranking)
 * 
 * Para admin:
 * - accessLevel não se aplica (sempre tem acesso total)
 */
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  accessLevel?: AccessLevel // Apenas para role === "aluno"
  avatarUrl?: string | null
  bio?: string | null
  level?: number
  xp?: number
  xpMensal?: number
  coins?: number
  streak?: number
  createdAt?: string
  // TODO: Adicionar campo hasFormation quando integrar com Hotmart
  // hasFormation?: boolean
}

/**
 * Helper para verificar se um aluno tem acesso completo
 */
export function hasFullAccess(user: AuthUser | null): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  return user.role === "aluno" && user.accessLevel === "full"
}

/**
 * Helper para verificar se um aluno tem acesso limitado
 */
export function hasLimitedAccess(user: AuthUser | null): boolean {
  if (!user) return false
  return user.role === "aluno" && user.accessLevel === "limited"
}


