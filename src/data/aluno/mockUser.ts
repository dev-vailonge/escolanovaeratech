// Dados mockados do usuário aluno
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
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

export const mockUser: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao@example.com',
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

