export type FormacaoAndroidProjetoReal = {
  id: string
  title: string
  description: string
  bullets: string[]
  /** Tema visual do mock do telefone na listagem */
  preview: 'lake' | 'ai-shopping'
}

export const FORMACAO_ANDROID_PROJETOS_REAIS: FormacaoAndroidProjetoReal[] = [
  {
    id: 'lake-tracking',
    title: 'ACOMPANHAMENTO DE ROTINA',
    description:
      'Um gerenciador completo de rotina para bebês, utilizando Clean Architecture, Koin para injeção de dependência e Room Database.',
    bullets: ['Interface com Jetpack Compose', 'Coroutines e Flow'],
    preview: 'lake',
  },
  {
    id: 'ai-shopping-list',
    title: 'LISTA DE COMPRAS COM IA',
    description:
      'Lista de compras inteligente que utiliza IA para sugerir produtos e gerenciar estoques domésticos em tempo real.',
    bullets: ['Integração com IA Gemini', 'Firebase Realtime Database'],
    preview: 'ai-shopping',
  },
]
