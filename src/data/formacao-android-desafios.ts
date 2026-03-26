export type ChallengeVisual = 'phone' | 'wireframe' | 'chart' | 'map' | 'crypto' | 'media'

export type DesafioDifficulty = 'Iniciante' | 'Intermediário' | 'Avançado'

/** Aula sugerida: com link direto ao Hotmart Club ou só termo para busca no curso */
export type FormacaoAndroidRelatedLesson = {
  title: string
  href?: string
  description?: string
}

export type FormacaoAndroidApp = {
  id: string
  mission: number
  title: string
  /** Título em destaque no hero (geralmente caixa alta) */
  heroTitle: string
  xp: number
  visual: ChallengeVisual
  coverSrc?: string
  /** Imagem ampla do fluxo (ex.: tripé de telas) — só na página de detalhe */
  detailCoverSrc?: string
  difficulty: DesafioDifficulty
  summary: string
  tags: string[]
  objective: string
  practiceItems: string[]
  requirements: string[]
  relatedLessons: FormacaoAndroidRelatedLesson[]
  /** Repositório público de referência; se omitido, o botão GitHub usa busca pelo título */
  githubRepoUrl?: string
}

export const BONUS_COMPLETAR_TODOS_XP = 4000

export const FORMACAO_ANDROID_APPS: FormacaoAndroidApp[] = [
  {
    id: 'c1',
    mission: 1,
    title: 'Simulador de Investimentos',
    heroTitle: 'SIMULADOR DE INVESTIMENTOS',
    xp: 500,
    visual: 'crypto',
    coverSrc: '/images/desafio-android-simulador-investimentos.png',
    detailCoverSrc: '/images/desafio-android-simulador-investimentos-detalhe.png',
    githubRepoUrl:
      'https://github.com/Escola-Nova-Era/form-android/blob/main/desafio1/README.md',
    difficulty: 'Iniciante',
    summary:
      'Primeiro desafio da formação: app Android com múltiplas telas (Activities), navegação, cálculo de juros compostos e uso de Fragments para organizar a interface — com XML, ConstraintLayout e boas práticas de layout.',
    tags: ['ANDROID', 'ACTIVITY', 'FRAGMENTS', 'XML'],
    objective:
      'Criar um aplicativo com múltiplas telas que recebe dados do usuário, realiza cálculos com base em juros compostos, navega entre telas, exibe o resultado de forma organizada e utiliza Fragments para modularizar a interface.',
    practiceItems: [
      'Activity',
      'Navegação entre activities',
      'Ciclo de vida de Activity',
      'Passagem de dados entre telas',
      'Passagem de objetos entre telas',
      'Fragments',
      'Fragment KTX (Jetpack)',
      'XML',
      'ConstraintLayout',
      'ScrollView',
      'TextInputLayout',
      'Temas e estilos',
      'Organização de layouts',
    ],
    requirements: [
      'Três telas principais: boas-vindas, configuração da simulação e resultado',
      'Coleta de valor inicial, aporte mensal, taxa (% ao ano) e tempo (anos), com validação',
      'Uso de TextInputLayout, ScrollView e ConstraintLayout conforme o enunciado do desafio',
      'Tela de resultado com destaque para montante, total investido e lucro; container para Fragment de resumo',
      'Fragment que recebe argumentos (Bundle / Fragment KTX) e exibe detalhes do cálculo',
      'Fórmula de juros compostos e tratamento de aporte mensal (iterativo ou aproximação, conforme README)',
    ],
    relatedLessons: [
      {
        title: 'O que é uma Activity?',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/k458n8pJOl',
        description: 'Entenda o papel da Activity e como estruturar cada tela principal do app.',
      },
      {
        title: 'Navegação entre activities',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/K4k2q2VkOY',
        description: 'Aprenda a abrir telas com Intents e organizar o fluxo de navegação do desafio.',
      },
      {
        title: 'Passando dados entre activities',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/37dpXpjd7L',
        description: 'Veja como enviar e receber dados entre telas para montar a simulação e o resultado.',
      },
      {
        title: 'Aprendendo sobre XML',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/r48ENERAeR',
        description: 'Base para montar os layouts do app com boa hierarquia visual e organização.',
      },
      {
        title: 'FindViewById',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/EOgplpGp46',
        description: 'Conecte os componentes da interface ao código para ler inputs e exibir resultados.',
      },
      {
        title: 'ConstraintLayout',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/meLx0kAgen',
        description: 'Monte telas flexíveis com constraints para diferentes tamanhos de tela.',
      },
      {
        title: 'ScrollView',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/a4RvLaxx4n',
        description: 'Permita rolagem em telas com muitos campos sem quebrar a experiência do usuário.',
      },
      {
        title: 'TextInputLayout',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/V4VQrp6rO2',
        description: 'Aplique campos com validação e feedback visual seguindo boas práticas de formulário.',
      },
      {
        title: 'Recuperando dados digitados',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/K4k2qr0ZOY',
        description: 'Capture e trate os valores digitados para alimentar os cálculos de investimento.',
      },
      {
        title: 'Introdução a Fragment',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/0OvzkzdBOj',
        description: 'Entenda quando usar Fragments para modularizar a interface da tela de resultado.',
      },
      {
        title: 'Criando um Fragment',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/k458n8PrOl',
        description: 'Implemente um Fragment na prática para separar responsabilidades da UI.',
      },
      {
        title: 'Criando um Fragment Interface',
        href: 'https://hotmart.com/pt-BR/club/escolanovaeratech/products/6576377/content/BOnw6wGq4R',
        description: 'Aprenda a comunicação entre Activity e Fragment para trocar dados de forma organizada.',
      },
    ],
  },
  {
    id: 'c2',
    mission: 2,
    title: 'Lista de Eventos',
    heroTitle: 'LISTA DE EVENTOS',
    xp: 500,
    visual: 'wireframe',
    coverSrc: '/images/desafio-android-lista-eventos.png',
    difficulty: 'Iniciante',
    summary:
      'Crie um app de eventos com busca, filtros por categoria e lista responsiva, preparando terreno para persistência local.',
    tags: ['KOTLIN', 'LISTAS', 'FILTROS'],
    objective:
      'Desenvolver fluxo de listagem com busca em tempo real, chips de categoria e navegação para detalhe do evento.',
    practiceItems: [
      'LazyColumn e performance de lista',
      'TextField e debounce de busca',
      'Modelagem de Evento e UX de estados vazios',
    ],
    requirements: [
      'Lista principal com busca por nome, local ou categoria',
      'Dados podem ser mockados em memória ou JSON local',
      'Tela de detalhe mínima do evento',
    ],
    relatedLessons: [
      { title: 'RecyclerView lista Android' },
      { title: 'LazyColumn Compose' },
      { title: 'busca em tempo real Android' },
      { title: 'filtro lista Kotlin' },
      { title: 'TextField debounce' },
      { title: 'chips filtro Material' },
      { title: 'navegação lista detalhe' },
    ],
  },
  {
    id: 'c3',
    mission: 3,
    title: 'Controle Financeiro',
    heroTitle: 'CONTROLE FINANCEIRO',
    xp: 1000,
    visual: 'chart',
    coverSrc: '/images/desafio-android-controle-financeiro.png',
    difficulty: 'Intermediário',
    summary:
      'Organize receitas e despesas com resumo mensal, categorias e telas de dashboard alinhadas a um visual financeiro moderno.',
    tags: ['MVVM', 'ROOM', 'UI'],
    objective:
      'Aplicar camadas de apresentação claras, persistência de transações e telas de resumo com totais e indicadores.',
    practiceItems: [
      'MVVM com ViewModel e Flow',
      'Room: entidades, DAO e consultas',
      'Composição de telas de dashboard',
    ],
    requirements: [
      'Cadastro simples de receitas e despesas',
      'Persistência local com Room',
      'Tela resumo com saldo ou totais do mês',
    ],
    relatedLessons: [
      { title: 'Room Database Android' },
      { title: 'ViewModel Flow Android' },
      { title: 'MVVM Android' },
      { title: 'DAO Room consultas' },
      { title: 'Hilt injeção dependência' },
      { title: 'dashboard financeiro UI' },
      { title: 'Formatação moeda Android' },
    ],
  },
  {
    id: 'c4',
    mission: 4,
    title: 'Characters App Rick & Morty',
    heroTitle: 'RICK & MORTY CHARACTERS',
    xp: 1500,
    visual: 'media',
    coverSrc: '/images/desafio-android-rick-morty.png',
    difficulty: 'Intermediário',
    summary:
      'Consuma a API pública de personagens, exiba grid ou lista com imagens e uma tela de perfil com dados ricos do personagem.',
    tags: ['RETROFIT', 'COIL', 'API'],
    objective:
      'Integrar rede com tratamento de erro, listagem paginada ou scroll infinito e detalhe com estados de loading.',
    practiceItems: [
      'Retrofit + serialização',
      'Carregamento de imagens e placeholders',
      'Navegação lista → detalhe com argumentos',
    ],
    requirements: [
      'Uso da API de Rick and Morty (documentação oficial)',
      'Lista e tela de detalhe do personagem',
      'Tratamento básico de falha de rede',
    ],
    relatedLessons: [
      { title: 'Retrofit API REST Android' },
      { title: 'Coroutines Kotlin Android' },
      { title: 'Coil imagem Android' },
      { title: 'serialização JSON Kotlin' },
      { title: 'tratamento erro rede' },
      { title: 'lista com imagem API' },
      { title: 'Navigation argumentos' },
    ],
  },
  {
    id: 'c5',
    mission: 5,
    title: 'Tech Events',
    heroTitle: 'TECH EVENTS',
    xp: 2000,
    visual: 'map',
    coverSrc: '/images/desafio-android-tech-events.png',
    difficulty: 'Intermediário',
    summary:
      'Monte um hub de eventos tech com mapa ou localização, detalhe rico e CTA, simulando fluxo real de inscrição.',
    tags: ['MAPS', 'DETALHE', 'MATERIAL'],
    objective:
      'Trabalhar mapas ou endereço, cards de evento e uma tela de detalhe com informações, tags e ação principal.',
    practiceItems: [
      'Integração Maps / localização (ou mock de endereço)',
      'Layouts complexos e nested scroll',
      'Design system consistente',
    ],
    requirements: [
      'Lista e detalhe de evento tech',
      'Indicação de local (mapa ou texto estruturado)',
      'Botão ou fluxo de “participar” (pode ser mock)',
    ],
    relatedLessons: [
      { title: 'Google Maps SDK Android' },
      { title: 'localização permissões Android' },
      { title: 'Material Design cards' },
      { title: 'NestedScrollView CoordinatorLayout' },
      { title: 'Deep link Android' },
      { title: 'compartilhar conteúdo Intent' },
      { title: 'endereço geocoding' },
    ],
  },
  {
    id: 'c6',
    mission: 6,
    title: 'Pokédex',
    heroTitle: 'POKÉDEX',
    xp: 3000,
    visual: 'phone',
    coverSrc: '/images/desafio-android-pokedex.png',
    difficulty: 'Avançado',
    summary:
      'Explore a PokéAPI com lista rica, tipos, stats e tela de detalhe premium — consolidando tudo que você aprendeu na trilha.',
    tags: ['API', 'PAGINAÇÃO', 'UI_POLIDA'],
    objective:
      'Entregar experiência próxima a um app real: grid, busca, cache simples e detalhe com stats e tipos.',
    practiceItems: [
      'Paginação e cache em memória',
      'Modelagem de domínio (Pokemon, types, stats)',
      'Polimento visual e animações leves',
    ],
    requirements: [
      'Uso da PokéAPI ou camada de dados documentada',
      'Lista + detalhe com imagem e atributos',
      'Boas práticas de arquitetura e testes manuais documentados',
    ],
    relatedLessons: [
      { title: 'paginação API Android' },
      { title: 'PokéAPI Retrofit' },
      { title: 'grid lista detalhe Android' },
      { title: 'cache memória Repository' },
      { title: 'Clean Architecture Android' },
      { title: 'testes instrumentados Android' },
      { title: 'animação Compose Android' },
    ],
  },
]

export function getFormacaoAndroidApp(id: string) {
  return FORMACAO_ANDROID_APPS.find((a) => a.id === id) ?? null
}
