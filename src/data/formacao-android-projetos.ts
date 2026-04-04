import type { FacepilePerson } from '@/components/ui/SubmittersFacepile'

export type FormacaoAndroidTechAreaId = 'android' | 'ios' | 'web' | 'backend' | 'data'

export type FormacaoAndroidProjetoCerimonia = {
  titulo: string
  descricao: string
}

export type FormacaoAndroidProjetoReal = {
  id: string
  title: string
  description: string
  bullets: string[]
  /** Linha acima do título na página de detalhe */
  detailBadge?: string
  /** Parágrafo de abertura na página de detalhe (lista e cards usam só `description`) */
  detailLead?: string
  /** Tema visual do mock do telefone na listagem */
  preview: 'lake' | 'ai-shopping'
  /** Squad de exemplo (substitua por integrantes reais quando houver API) */
  team: FacepilePerson[]
  /** Áreas de tecnologia envolvidas no ecossistema do projeto */
  techAreas: FormacaoAndroidTechAreaId[]
  /** Reuniões e rituais (dailies, planning, sprint…) */
  ceremonias: FormacaoAndroidProjetoCerimonia[]
}

export const OBJETIVO_PRINCIPAL_PROJETOS_REAIS =
  'Ganhar experiência profissional enquanto estuda: desenvolver projetos reais ao lado de programadores que já atuam no mercado, com código revisado, rituais de time e entregas que simulam o dia a dia de uma empresa.'

export const TECH_AREAS_PROJETO_META: Record<
  FormacaoAndroidTechAreaId,
  { label: string; short: string }
> = {
  android: { label: 'Android', short: 'Apps nativos, Jetpack, Kotlin' },
  ios: { label: 'iOS', short: 'Swift, SwiftUI, App Store' },
  web: { label: 'Web', short: 'Front, APIs consumidas, deploy' },
  backend: { label: 'Backend', short: 'Serviços, dados, escalabilidade' },
  data: { label: 'Análise de dados', short: 'Métricas, dashboards, decisões' },
}

const CEREMONIAS_PADRAO: FormacaoAndroidProjetoCerimonia[] = [
  {
    titulo: 'Daily (stand-up)',
    descricao:
      'Alinhamento rápido do dia: o que cada pessoa fez, o que vai fazer e se há algum bloqueio — igual times ágeis reais.',
  },
  {
    titulo: 'Planning',
    descricao:
      'Planejamento do que entra no ciclo: priorização, estimativa em conjunto e definição clara do “pronto”.',
  },
  {
    titulo: 'Sprint',
    descricao:
      'Bloco de trabalho com entregas contínuas: commits, PRs, revisão e objetivo de valor ao final do ciclo.',
  },
  {
    titulo: 'Review e retrospectiva',
    descricao:
      'Demonstração do que foi construído para o time e momento de melhorar processo na próxima sprint.',
  },
]

const TEAM_LAKE: FacepilePerson[] = [
  { id: 'mentor', name: 'Roque Buarque Junior — mentoria (Spotify)', avatarUrl: null },
  { id: '1', name: 'Tech lead mobile', avatarUrl: null },
  { id: '2', name: 'Dev mobile', avatarUrl: null },
  { id: '3', name: 'Dev backend', avatarUrl: null },
  { id: '4', name: 'Aluno formação', avatarUrl: null },
  { id: '5', name: 'Product / PO', avatarUrl: null },
]

const TEAM_AI: FacepilePerson[] = [
  { id: 'a', name: 'Tech lead', avatarUrl: null },
  { id: 'b', name: 'Dev Android', avatarUrl: null },
  { id: 'c', name: 'Especialista IA', avatarUrl: null },
  { id: 'd', name: 'Aluno formação', avatarUrl: null },
]

const TECH_FULL: FormacaoAndroidTechAreaId[] = ['android', 'ios', 'web', 'backend', 'data']

export const FORMACAO_ANDROID_PROJETOS_REAIS: FormacaoAndroidProjetoReal[] = [
  {
    id: 'lake-tracking',
    title: 'BABY TRACKING APP',
    description:
      'Projeto open source para famílias acompanharem rotinas do bebê — e para alunos vivenciarem o dia a dia de um time de tecnologia real.',
    detailLead:
      'O Baby Tracking App é um projeto open source da Escola Nova Era Tech, criado para proporcionar uma experiência real de trabalho em tecnologia enquanto os alunos ainda estão estudando. Mais do que um aplicativo, é uma simulação completa do dia a dia de um programador profissional, com pessoas reais e processos reais — e um produto pensado para ajudar pais e responsáveis no dia a dia.',
    bullets: [
      'Alimentação e hábitos do bebê',
      'Sono e descanso',
      'Banho e higiene',
      'Outros cuidados do dia a dia',
    ],
    detailBadge: 'Projeto real · Open source Nova Era',
    preview: 'lake',
    team: TEAM_LAKE,
    techAreas: TECH_FULL,
    ceremonias: CEREMONIAS_PADRAO,
  },
  {
    id: 'ai-shopping-list',
    title: 'LISTA DE COMPRAS COM IA',
    description:
      'Lista de compras inteligente que utiliza IA para sugerir produtos e gerenciar estoques domésticos em tempo real.',
    bullets: ['Integração com IA Gemini', 'Firebase Realtime Database'],
    preview: 'ai-shopping',
    team: TEAM_AI,
    techAreas: TECH_FULL,
    ceremonias: CEREMONIAS_PADRAO,
  },
]

export function getFormacaoAndroidProjetoRealById(id: string): FormacaoAndroidProjetoReal | null {
  const trimmed = id.trim()
  return FORMACAO_ANDROID_PROJETOS_REAIS.find((p) => p.id === trimmed) ?? null
}
