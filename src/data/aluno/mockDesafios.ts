// Desafios mockados
export interface Desafio {
  id: string
  titulo: string
  descricao: string
  tipo: 'semanal' | 'mensal' | 'especial'
  categoria: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  xpGanho: number
  moedasGanho: number
  badgeGanho?: string
  completo: boolean
  prazo: string // formato ISO
  dataInicio: string
  participantes: number
  tempoEstimado: number // em minutos
  requisitos?: string[]
}

export const mockDesafios: Desafio[] = [
  {
    id: '1',
    titulo: 'Desafio da Semana: Card Interativo',
    descricao: 'Crie um card interativo usando HTML, CSS e JavaScript com animações suaves',
    tipo: 'semanal',
    categoria: 'Web Development',
    nivel: 'intermediario',
    xpGanho: 200,
    moedasGanho: 100,
    badgeGanho: 'desafio-semanal',
    completo: false,
    prazo: '2024-12-31T23:59:59',
    dataInicio: '2024-12-24T00:00:00',
    participantes: 45,
    tempoEstimado: 120,
    requisitos: ['HTML5', 'CSS3', 'JavaScript'],
  },
  {
    id: '2',
    titulo: 'Desafio Mensal: Landing Page Completa',
    descricao: 'Desenvolva uma landing page responsiva com formulário funcional',
    tipo: 'mensal',
    categoria: 'Web Development',
    nivel: 'avancado',
    xpGanho: 500,
    moedasGanho: 250,
    badgeGanho: 'desafio-mensal',
    completo: false,
    prazo: '2025-01-31T23:59:59',
    dataInicio: '2024-12-01T00:00:00',
    participantes: 120,
    tempoEstimado: 480,
    requisitos: ['Responsive Design', 'Formulários', 'Validação'],
  },
  {
    id: '3',
    titulo: 'Quiz Master - 100% de Acerto',
    descricao: 'Complete qualquer quiz com 100% de acerto',
    tipo: 'especial',
    categoria: 'Geral',
    nivel: 'intermediario',
    xpGanho: 150,
    moedasGanho: 75,
    badgeGanho: 'quiz-master',
    completo: true,
    prazo: '2024-12-31T23:59:59',
    dataInicio: '2024-12-01T00:00:00',
    participantes: 80,
    tempoEstimado: 30,
  },
  {
    id: '4',
    titulo: 'Semana Perfeita',
    descricao: 'Complete 7 dias consecutivos de estudo',
    tipo: 'especial',
    categoria: 'Geral',
    nivel: 'iniciante',
    xpGanho: 100,
    moedasGanho: 50,
    badgeGanho: 'semana-perfeita',
    completo: true,
    prazo: '2024-12-31T23:59:59',
    dataInicio: '2024-12-18T00:00:00',
    participantes: 200,
    tempoEstimado: 420,
  },
  {
    id: '5',
    titulo: 'Primeiro Projeto',
    descricao: 'Crie e publique seu primeiro projeto no GitHub',
    tipo: 'especial',
    categoria: 'Ferramentas',
    nivel: 'iniciante',
    xpGanho: 80,
    moedasGanho: 40,
    badgeGanho: 'primeiro-passo',
    completo: true,
    prazo: '2024-12-31T23:59:59',
    dataInicio: '2024-01-01T00:00:00',
    participantes: 500,
    tempoEstimado: 180,
  },
]








