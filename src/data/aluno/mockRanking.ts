// Ranking mockado
export interface RankingUser {
  id: string
  name: string
  avatar?: string
  level: number
  xp: number
  position: number
  isCurrentUser?: boolean
  badge?: string
}

export const mockRanking: RankingUser[] = [
  {
    id: '1',
    name: 'Ana Costa',
    level: 25,
    xp: 8500,
    position: 1,
    badge: 'ouro',
  },
  {
    id: '2',
    name: 'Pedro Santos',
    level: 23,
    xp: 7800,
    position: 2,
    badge: 'prata',
  },
  {
    id: '3',
    name: 'Maria Oliveira',
    level: 22,
    xp: 7200,
    position: 3,
    badge: 'bronze',
  },
  {
    id: '4',
    name: 'Carlos Lima',
    level: 20,
    xp: 6500,
    position: 4,
  },
  {
    id: '5',
    name: 'Fernanda Souza',
    level: 19,
    xp: 6200,
    position: 5,
  },
  {
    id: '6',
    name: 'Rafael Alves',
    level: 18,
    xp: 5800,
    position: 6,
  },
  {
    id: '7',
    name: 'Juliana Rocha',
    level: 17,
    xp: 5400,
    position: 7,
  },
  {
    id: '8',
    name: 'Lucas Pereira',
    level: 16,
    xp: 5000,
    position: 8,
  },
  {
    id: '9',
    name: 'Camila Ferreira',
    level: 15,
    xp: 4600,
    position: 9,
  },
  {
    id: '10',
    name: 'Bruno Rodrigues',
    level: 14,
    xp: 4200,
    position: 10,
  },
  {
    id: '11',
    name: 'Gabriela Martins',
    level: 13,
    xp: 3800,
    position: 11,
  },
  {
    id: '12',
    name: 'Thiago Gomes',
    level: 13,
    xp: 3600,
    position: 12,
  },
  {
    id: '13',
    name: 'Isabela Ribeiro',
    level: 12,
    xp: 3200,
    position: 13,
  },
  {
    id: '14',
    name: 'Matheus Carvalho',
    level: 12,
    xp: 2800,
    position: 14,
  },
  {
    id: '15',
    name: 'João Silva',
    level: 12,
    xp: 2450,
    position: 15,
    isCurrentUser: true,
  },
  {
    id: '16',
    name: 'Larissa Silva',
    level: 11,
    xp: 2200,
    position: 16,
  },
  {
    id: '17',
    name: 'Diego Costa',
    level: 11,
    xp: 2000,
    position: 17,
  },
  {
    id: '18',
    name: 'Beatriz Lima',
    level: 10,
    xp: 1800,
    position: 18,
  },
  {
    id: '19',
    name: 'Gustavo Santos',
    level: 10,
    xp: 1600,
    position: 19,
  },
  {
    id: '20',
    name: 'Mariana Alves',
    level: 9,
    xp: 1400,
    position: 20,
  },
]

