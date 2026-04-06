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
