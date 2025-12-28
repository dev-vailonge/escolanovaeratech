// Badges e conquistas mockadas
export interface Badge {
  id: string
  nome: string
  descricao: string
  icone: string // emoji ou nome do ícone
  categoria: 'estudo' | 'quiz' | 'desafio' | 'comunidade' | 'especial'
  raridade: 'comum' | 'rara' | 'epica' | 'lendaria'
  desbloqueada: boolean
  dataDesbloqueio?: string
  requisito: string
  xpBonus?: number
}

export const mockBadges: Badge[] = [
  {
    id: 'primeiro-passo',
    nome: 'Primeiro Passo',
    descricao: 'Criou e publicou seu primeiro projeto',
    icone: '🎯',
    categoria: 'especial',
    raridade: 'comum',
    desbloqueada: true,
    dataDesbloqueio: '2024-01-20',
    requisito: 'Publicar primeiro projeto no GitHub',
    xpBonus: 50,
  },
  {
    id: 'estudioso',
    nome: 'Estudioso',
    descricao: 'Completou 25 aulas',
    icone: '📚',
    categoria: 'estudo',
    raridade: 'comum',
    desbloqueada: true,
    dataDesbloqueio: '2024-03-15',
    requisito: 'Completar 25 aulas',
    xpBonus: 100,
  },
  {
    id: 'quiz-master',
    nome: 'Quiz Master',
    descricao: 'Conseguiu 100% em qualquer quiz',
    icone: '🏆',
    categoria: 'quiz',
    raridade: 'rara',
    desbloqueada: true,
    dataDesbloqueio: '2024-04-10',
    requisito: '100% de acerto em um quiz',
    xpBonus: 150,
  },
  {
    id: 'semana-perfeita',
    nome: 'Semana Perfeita',
    descricao: '7 dias consecutivos de estudo',
    icone: '🔥',
    categoria: 'estudo',
    raridade: 'rara',
    desbloqueada: true,
    dataDesbloqueio: '2024-12-25',
    requisito: '7 dias consecutivos estudando',
    xpBonus: 200,
  },
  {
    id: 'desafio-semanal',
    nome: 'Guerreiro da Semana',
    descricao: 'Completou o desafio semanal',
    icone: '⚔️',
    categoria: 'desafio',
    raridade: 'comum',
    desbloqueada: false,
    requisito: 'Completar desafio semanal',
    xpBonus: 100,
  },
  {
    id: 'desafio-mensal',
    nome: 'Lenda Mensal',
    descricao: 'Completou o desafio mensal',
    icone: '👑',
    categoria: 'desafio',
    raridade: 'epica',
    desbloqueada: false,
    requisito: 'Completar desafio mensal',
    xpBonus: 300,
  },
  {
    id: 'ajudante',
    nome: 'Ajudante',
    descricao: 'Respondeu 10 perguntas na comunidade',
    icone: '🤝',
    categoria: 'comunidade',
    raridade: 'comum',
    desbloqueada: false,
    requisito: 'Responder 10 perguntas',
    xpBonus: 75,
  },
  {
    id: 'mestre',
    nome: 'Mestre da Comunidade',
    descricao: 'Respostas com mais de 50 votos',
    icone: '⭐',
    categoria: 'comunidade',
    raridade: 'epica',
    desbloqueada: false,
    requisito: 'Receber 50+ votos em respostas',
    xpBonus: 250,
  },
  {
    id: 'level-10',
    nome: 'Nível 10',
    descricao: 'Atingiu o nível 10',
    icone: '🌟',
    categoria: 'estudo',
    raridade: 'comum',
    desbloqueada: true,
    dataDesbloqueio: '2024-05-20',
    requisito: 'Atingir nível 10',
    xpBonus: 100,
  },
  {
    id: 'level-20',
    nome: 'Nível 20',
    descricao: 'Atingiu o nível 20',
    icone: '💫',
    categoria: 'estudo',
    raridade: 'rara',
    desbloqueada: false,
    requisito: 'Atingir nível 20',
    xpBonus: 200,
  },
  {
    id: 'velocista',
    nome: 'Velocista',
    descricao: 'Completou um quiz em menos de 10 minutos',
    icone: '⚡',
    categoria: 'quiz',
    raridade: 'rara',
    desbloqueada: false,
    requisito: 'Completar quiz em menos de 10min',
    xpBonus: 125,
  },
  {
    id: 'perfeccionista',
    nome: 'Perfeccionista',
    descricao: 'Completou 5 quizes com 100% de acerto',
    icone: '💎',
    categoria: 'quiz',
    raridade: 'lendaria',
    desbloqueada: false,
    requisito: '5 quizes com 100% de acerto',
    xpBonus: 500,
  },
]






