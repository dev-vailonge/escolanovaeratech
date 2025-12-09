// Ranking mockado
import { AccessLevel } from '@/lib/types/auth'

export interface RankingUser {
  id: string
  name: string
  avatar?: string
  level: number
  xp: number // XP total acumulado
  xpMensal: number // XP do mês atual (para ranking mensal)
  position: number
  isCurrentUser?: boolean
  badge?: string
  accessLevel: AccessLevel // Apenas alunos com "full" aparecem no ranking
}

// Ranking mockado - apenas alunos com accessLevel "full" aparecem
export const mockRanking: RankingUser[] = [
  {
    id: '1',
    name: 'Ana Costa',
    level: 25,
    xp: 8500,
    xpMensal: 1200,
    position: 1,
    badge: 'ouro',
    accessLevel: 'full',
  },
  {
    id: '2',
    name: 'Pedro Santos',
    level: 23,
    xp: 7800,
    xpMensal: 1100,
    position: 2,
    badge: 'prata',
    accessLevel: 'full',
  },
  {
    id: '3',
    name: 'Maria Oliveira',
    level: 22,
    xp: 7200,
    xpMensal: 1050,
    position: 3,
    badge: 'bronze',
    accessLevel: 'full',
  },
  {
    id: '4',
    name: 'Carlos Lima',
    level: 20,
    xp: 6500,
    xpMensal: 980,
    position: 4,
    accessLevel: 'full',
  },
  {
    id: '5',
    name: 'Fernanda Souza',
    level: 19,
    xp: 6200,
    xpMensal: 950,
    position: 5,
    accessLevel: 'full',
  },
  {
    id: '6',
    name: 'Rafael Alves',
    level: 18,
    xp: 5800,
    xpMensal: 900,
    position: 6,
    accessLevel: 'full',
  },
  {
    id: '7',
    name: 'Juliana Rocha',
    level: 17,
    xp: 5400,
    xpMensal: 850,
    position: 7,
    accessLevel: 'full',
  },
  {
    id: '8',
    name: 'Lucas Pereira',
    level: 16,
    xp: 5000,
    xpMensal: 800,
    position: 8,
    accessLevel: 'full',
  },
  {
    id: '9',
    name: 'Camila Ferreira',
    level: 15,
    xp: 4600,
    xpMensal: 750,
    position: 9,
    accessLevel: 'full',
  },
  {
    id: '10',
    name: 'Bruno Rodrigues',
    level: 14,
    xp: 4200,
    xpMensal: 700,
    position: 10,
    accessLevel: 'full',
  },
  {
    id: '11',
    name: 'Gabriela Martins',
    level: 13,
    xp: 3800,
    xpMensal: 650,
    position: 11,
    accessLevel: 'full',
  },
  {
    id: '12',
    name: 'Thiago Gomes',
    level: 13,
    xp: 3600,
    xpMensal: 620,
    position: 12,
    accessLevel: 'full',
  },
  {
    id: '13',
    name: 'Isabela Ribeiro',
    level: 12,
    xp: 3200,
    xpMensal: 580,
    position: 13,
    accessLevel: 'full',
  },
  {
    id: '14',
    name: 'Matheus Carvalho',
    level: 12,
    xp: 2800,
    xpMensal: 540,
    position: 14,
    accessLevel: 'full',
  },
  {
    id: '15',
    name: 'João Silva',
    level: 12,
    xp: 2450,
    xpMensal: 500,
    position: 15,
    isCurrentUser: true,
    accessLevel: 'full',
  },
  {
    id: '16',
    name: 'Larissa Silva',
    level: 11,
    xp: 2200,
    xpMensal: 480,
    position: 16,
    accessLevel: 'full',
  },
  {
    id: '17',
    name: 'Diego Costa',
    level: 11,
    xp: 2000,
    xpMensal: 450,
    position: 17,
    accessLevel: 'full',
  },
  {
    id: '18',
    name: 'Beatriz Lima',
    level: 10,
    xp: 1800,
    xpMensal: 420,
    position: 18,
    accessLevel: 'full',
  },
  {
    id: '19',
    name: 'Gustavo Santos',
    level: 10,
    xp: 1600,
    xpMensal: 400,
    position: 19,
    accessLevel: 'full',
  },
  {
    id: '20',
    name: 'Mariana Alves',
    level: 9,
    xp: 1400,
    xpMensal: 380,
    position: 20,
    accessLevel: 'full',
  },
]


