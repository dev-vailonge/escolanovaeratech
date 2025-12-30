// Dados mockados do usuário aluno
import { UserRole, AccessLevel } from '@/lib/types/auth'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  accessLevel: AccessLevel
  level: number
  xp: number
  xpNextLevel: number
  coins: number
  badges: string[]
  streak: number
  rank: number
  joinDate: string
  bio?: string
}

// Aluno com acesso ilimitado (pode participar de tudo)
export const mockUser: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'admin',
  accessLevel: 'full',
  level: 12,
  xp: 2450,
  xpNextLevel: 3000,
  coins: 1250,
  badges: ['primeiro-passo', 'estudioso', 'quiz-master', 'semana-perfeita'],
  streak: 7,
  rank: 15,
  joinDate: '2024-01-15',
  bio: 'Desenvolvedor em formação, apaixonado por tecnologia!',
}

// Aluno com acesso limitado (pode ver mas não participar de quiz/desafios)
export const mockUserLimited: User = {
  id: '2',
  name: 'Maria Santos',
  email: 'maria@example.com',
  role: 'aluno',
  accessLevel: 'limited',
  level: 1,
  xp: 0,
  xpNextLevel: 200,
  coins: 0,
  badges: [],
  streak: 0,
  rank: 0,
  joinDate: '2024-12-01',
  bio: 'Aluna iniciante explorando a plataforma',
}

// Admin (para testes - em produção virá do backend)
export const mockAdmin: User = {
  id: 'admin1',
  name: 'Admin',
  email: 'admin@escolanovaeratech.com.br',
  role: 'admin',
  accessLevel: 'full', // Admin sempre tem acesso full
  level: 1,
  xp: 0,
  xpNextLevel: 200,
  coins: 0,
  badges: [],
  streak: 0,
  rank: 0,
  joinDate: '2024-01-01',
  bio: 'Administrador da plataforma',
}


