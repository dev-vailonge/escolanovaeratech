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
    coverSrc: '/images/desafio-android-lista-eventos-v2.png',
    detailCoverSrc: '/images/desafio-android-lista-eventos-v2.png',
    githubRepoUrl:
      'https://github.com/Escola-Nova-Era/form-android/blob/main/desafio2/README.md',
    difficulty: 'Iniciante',
    summary:
      'Segundo desafio da formação: aplicativo de eventos com lista dinâmica, busca, ordenação e atualização em tempo real, trabalhando dados 100% em memória para consolidar fundamentos de UI moderna.',
    tags: ['ANDROID', 'RECYCLERVIEW', 'KOTLIN', 'COLLECTIONS'],
    objective:
      'Criar um aplicativo chamado Eventos com Splash Screen, tela principal com lista dinâmica, busca, ordenação, atualização em tempo real e navegação para detalhe do evento, sem usar API ou banco de dados.',
    practiceItems: [
      'RecyclerView',
      'Adapter',
      'ListView',
      'CardView',
      'LayoutManager',
      'Atualização dinâmica de listas',
      'Kotlin Collections (List, Set, Map)',
      'Funções lambda',
      'Funções de escopo',
      'Data Classes',
      'Manipulação de dados dinâmicos',
      'Busca com filter + atualização do adapter',
      'Ordenação com sortedBy e sortedByDescending',
    ],
    requirements: [
      'Splash Screen e tela principal com lista de eventos',
      'No mínimo 6 eventos mockados em memória (sem API e sem banco de dados)',
      'Lista mutável com atualização dinâmica na tela',
      'Busca por nome e categoria usando filter e funções lambda',
      'Ordenação por nome (A-Z), data mais próxima e categoria',
      'Navegação da lista para tela de detalhe do evento',
      'Boas práticas no Adapter, código organizado e responsabilidades bem separadas',
      'Opcional: agrupamento por categoria, contagem dinâmica, estado vazio e versão com ListView',
    ],
    relatedLessons: [
      {
        title: 'RecyclerView lista Android',
        description: 'Aprenda a montar a base da lista principal de eventos com boa performance.',
      },
      {
        title: 'Adapter Android',
        description: 'Estruture o Adapter para renderizar os cards e atualizar a lista em tempo real.',
      },
      {
        title: 'CardView Android',
        description: 'Crie cards organizados para exibir nome, data e categoria dos eventos.',
      },
      {
        title: 'Kotlin Data Class',
        description: 'Modele o evento com data class para facilitar leitura e manipulação dos dados.',
      },
      {
        title: 'Collections Kotlin List Set Map',
        description: 'Use coleções para filtrar, ordenar e manter a lista original em memória.',
      },
      {
        title: 'filter Kotlin',
        description: 'Implemente a busca por nome e categoria com atualização dinâmica da lista.',
      },
      {
        title: 'sortedBy e sortedByDescending Kotlin',
        description: 'Aplique ordenação por nome, data e categoria de forma clara e reutilizável.',
      },
      {
        title: 'navegação lista detalhe',
        description: 'Leve o usuário para a tela de detalhe ao tocar em um evento da lista.',
      },
    ],
  },
  {
    id: 'c3',
    mission: 3,
    title: 'Controle Financeiro',
    heroTitle: 'CONTROLE FINANCEIRO',
    xp: 1000,
    visual: 'chart',
    coverSrc: '/images/desafio-android-controle-financeiro-v2.png',
    detailCoverSrc: '/images/desafio-android-controle-financeiro-detalhe-v2.png',
    githubRepoUrl:
      'https://github.com/Escola-Nova-Era/form-android/blob/main/desafio3/README.md',
    difficulty: 'Intermediário',
    summary:
      'Terceiro desafio da formação: app de controle financeiro com persistência real de dados em banco local, CRUD completo, filtros e relatórios por categoria.',
    tags: ['ANDROID', 'ROOM', 'CRUD', 'PERSISTENCIA'],
    objective:
      'Criar um aplicativo de Controle Financeiro que permita registrar receitas e despesas, visualizar saldo atualizado, editar e excluir transações, filtrar por tipo e gerar relatórios por categoria, persistindo tudo localmente no dispositivo.',
    practiceItems: [
      'Room Database',
      'Entities',
      'DAO e CRUD completo',
      'TypeConverters',
      'Migrations',
      'Relacionamentos (1-1, 1-N, N-N)',
      'Consultas e agregações para relatórios',
      'Separação entre banco e camada de UI',
    ],
    requirements: [
      'Aplicativo com Splash Screen, Dashboard, Lista de Transações, Cadastro/Edição e Relatórios',
      'CRUD completo de transações (criar, listar, editar e excluir)',
      'Persistência local obrigatória com Room Database',
      'Entidades mínimas: Conta, Categoria e Transacao',
      'Relacionamentos 1 Conta -> N Transações e 1 Categoria -> N Transações',
      'Filtro de transações por tipo (receita/despesa)',
      'Relatórios por categoria com saldo atualizado',
      'Uso de DAO e estrutura organizada com banco isolado da camada de UI',
      'TypeConverter aplicado para tipos complexos (ex.: Date)',
      'Pelo menos uma migration (ex.: observacao ou formaPagamento)',
      'Opcional: histórico mensal, exportação JSON e múltiplas contas',
    ],
    relatedLessons: [
      {
        title: 'Room Database Android',
        description: 'Base para persistir transações localmente e sair do armazenamento em memória.',
      },
      {
        title: 'Entities no Room',
        description: 'Modele Conta, Categoria e Transacao com campos consistentes e escaláveis.',
      },
      {
        title: 'DAO Room consultas',
        description: 'Implemente operações de CRUD e consultas para filtros e relatórios.',
      },
      {
        title: 'Relacionamentos Room 1-N',
        description: 'Conecte contas e categorias às transações com relacionamentos claros.',
      },
      {
        title: 'TypeConverter Room',
        description: 'Converta tipos como Date para salvar e recuperar dados corretamente.',
      },
      {
        title: 'Migrations Room',
        description: 'Aprenda a evoluir o schema sem perder dados dos usuários.',
      },
      {
        title: 'Dashboard financeiro UI',
        description: 'Apresente saldo, totais e visão geral de forma útil para tomada de decisão.',
      },
      {
        title: 'Filtros e ordenação de lista',
        description: 'Permita refinar transações por tipo e período com atualização fluida.',
      },
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
    detailCoverSrc: '/images/desafio-android-rick-morty-detalhe-v2.png',
    githubRepoUrl:
      'https://github.com/Escola-Nova-Era/form-android/blob/main/desafio4/README.md',
    difficulty: 'Intermediário',
    summary:
      'Quarto desafio da formação: aplicativo conectado à internet com consumo da API Rick and Morty, paginação infinita, busca por nome, estados de loading/erro e favoritos persistidos localmente com Room.',
    tags: ['ANDROID', 'RETROFIT', 'PAGINACAO', 'ROOM'],
    objective:
      'Criar o app Characters consumindo API pública para listar personagens com paginação infinita, permitir busca por nome, abrir detalhe completo do personagem e favoritar itens com persistência local.',
    practiceItems: [
      'Retrofit',
      'Coroutines e threads',
      'Requisições GET',
      'Paginação com scroll infinito',
      'Interceptor',
      'Tratamento de erro de rede',
      'Estados de loading, vazio e erro',
      'Room Database para favoritos',
      'Integração lista -> detalhe',
    ],
    requirements: [
      'Usar a Rick and Morty API (GET /character e GET /character/{id})',
      'Três telas: Splash, Lista de Personagens e Detalhe do Personagem',
      'Lista com TopAppBar, campo de busca, RecyclerView com CardView e scroll infinito',
      'Exibir loader no rodapé ao paginar e evitar múltiplas requisições simultâneas',
      'Cada item deve mostrar imagem, nome, status, espécie e ícone de favorito',
      'Busca por nome com tratamento de estado vazio',
      'Tela de detalhe com imagem grande, nome, status, espécie, gênero, origem e localização atual',
      'Favoritos persistidos localmente com Room (Entity, DAO, Database e CRUD básico)',
      'Tratar erros de conexão, timeout, 404 e 500 com UI amigável e botão "Tentar novamente"',
      'Separar claramente camada de rede e UI, com código organizado',
      'Opcional: filtro por status/gênero, tela de favoritos, skeleton loading e cache da última busca',
    ],
    relatedLessons: [
      {
        title: 'Retrofit API REST Android',
        description: 'Configure cliente HTTP e endpoints para consumir a API de personagens.',
      },
      {
        title: 'Coroutines Kotlin Android',
        description: 'Execute chamadas assíncronas sem bloquear a UI e com controle de estado.',
      },
      {
        title: 'Interceptor no OkHttp',
        description: 'Adicione logs, timeout e padronização das requisições de rede.',
      },
      {
        title: 'Paginação com RecyclerView',
        description: 'Carregue próxima página no fim da lista e mostre loader no rodapé.',
      },
      {
        title: 'Tratamento de erro de rede',
        description: 'Trate cenários de timeout, sem conexão e respostas de erro da API.',
      },
      {
        title: 'Coil imagem Android',
        description: 'Renderize imagens dos personagens com placeholders e fallback.',
      },
      {
        title: 'Room favoritos Android',
        description: 'Persista personagens favoritados localmente com Entity, DAO e Database.',
      },
      {
        title: 'Navegação lista detalhe',
        description: 'Leve dados para a tela de detalhe e mantenha experiência fluida.',
      },
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
    detailCoverSrc: '/images/desafio-android-tech-events-detalhe-v2.png',
    githubRepoUrl:
      'https://github.com/Escola-Nova-Era/form-android/blob/main/desafio5/README.md',
    difficulty: 'Intermediário',
    summary:
      'Quinto desafio da formação: construir o app Tech Events do zero usando MVVM, Repository Pattern e modelagem de estados de UI com Sealed Class para criar uma base escalável e profissional.',
    tags: ['ANDROID', 'MVVM', 'REPOSITORY', 'UI_STATE'],
    objective:
      'Criar um aplicativo de eventos de tecnologia com consumo de API mock, listagem paginada, busca, filtros e tela de detalhe, aplicando MVVM desde o início com separação clara entre UI, ViewModel e dados.',
    practiceItems: [
      'Arquitetura MVVM',
      'ViewModel',
      'LiveData',
      'DataBinding',
      'Repository Pattern',
      'Separação de responsabilidades entre camadas',
      'Sealed Class para UI State',
      'Generics e tipagem em estados',
      'Paginação (scroll infinito ou carregar mais)',
      'Busca e filtros em lista',
    ],
    requirements: [
      'Aplicativo criado do zero já em MVVM (sem DI/Hilt neste desafio)',
      'Telas obrigatórias: Splash, Lista de Eventos e Detalhe do Evento',
      'Consumo da Tech Events API mock com GET /events e GET /events/{id}',
      'Implementar busca por query e filtros (categoria e online/presencial)',
      'Implementar paginação funcional',
      'Modelar estados da tela com Sealed Class (Loading, Success, Error e Empty recomendado)',
      'Activity/Fragment sem regra de negócio: apenas observar estado, renderizar UI e disparar ações',
      'UI não acessa API diretamente; comunicação via Repository -> API Service',
      'ViewModel desacoplado de Retrofit (idealmente dependente de interface de repository)',
      'Estrutura organizada nas camadas data, domain e presentation',
      'Opcional: criar/editar/deletar evento (POST/PUT/DELETE), mapper DTO -> Domain, wrapper de resultado e cache em memória',
    ],
    relatedLessons: [
      {
        title: 'MVVM Android',
        description: 'Entenda como separar UI, estado e lógica de apresentação com ViewModel.',
      },
      {
        title: 'ViewModel e LiveData',
        description: 'Observe estados de tela e atualize a UI de forma reativa e previsível.',
      },
      {
        title: 'DataBinding Android',
        description: 'Reduza código de binding manual e deixe telas mais limpas e organizadas.',
      },
      {
        title: 'Repository Pattern Android',
        description: 'Centralize acesso a dados e desacople camadas de apresentação e rede.',
      },
      {
        title: 'Sealed Class Kotlin',
        description: 'Modele Loading, Success, Error e Empty com tipagem forte para UI State.',
      },
      {
        title: 'Paginação em lista Android',
        description: 'Implemente carregamento incremental sem duplicar requisições.',
      },
      {
        title: 'Busca e filtros Android',
        description: 'Combine query, categoria e modalidade para refinar eventos em tempo real.',
      },
      {
        title: 'Arquitetura em camadas Android',
        description: 'Organize pastas data/domain/presentation para manter escalabilidade no projeto.',
      },
    ],
  },
  {
    id: 'c6',
    mission: 6,
    title: 'Pokédex',
    heroTitle: 'POKÉDEX',
    xp: 3000,
    visual: 'phone',
    coverSrc: '/images/desafio-android-pokedex-v2.png',
    detailCoverSrc: '/images/desafio-android-pokedex-v2.png',
    githubRepoUrl:
      'https://github.com/Escola-Nova-Era/form-android/blob/main/desafio6/README.md',
    difficulty: 'Avançado',
    summary:
      'Sexto desafio da formação: construir uma Pokédex funcional com foco em testes profissionais, qualidade de código e cobertura mínima, validando comportamento da aplicação em nível unitário e de UI.',
    tags: ['ANDROID', 'TESTES', 'ESPRESSO', 'COBERTURA'],
    objective:
      'Criar o app Pokédex consumindo a PokéAPI com paginação, busca por nome e detalhe do Pokémon, implementando testes unitários, de ViewModel, de Repository e de UI com meta mínima de cobertura.',
    practiceItems: [
      'Testes unitários',
      'Mockito',
      'Truth',
      'Testes de Coroutines',
      'Espresso',
      'Cobertura de código',
      'Paginação e busca em API real',
      'Estados de UI (Loading, Success, Error, Empty)',
      'Isolamento de camadas com Repository',
    ],
    requirements: [
      'Consumir PokéAPI (GET /pokemon?limit=20&offset=0, GET /pokemon/{id}, GET /pokemon/{name})',
      'Telas obrigatórias: Splash, Lista de Pokémons e Detalhe do Pokémon',
      'Paginação funcional (scroll infinito ou carregar mais)',
      'Busca por nome com estados Loading, Success, Error e Empty',
      'Testes unitários para mapeamento DTO -> Model, formatação (#001), conversão de altura/peso e utilitários',
      'Testes de ViewModel com Mockito, Coroutines Test e Truth cobrindo Loading/Success/Error/Empty',
      'Testes de Repository com mock de API (erro de rede e retorno vazio)',
      'Testes de UI com Espresso: lista pós-loading, busca, navegação para detalhe, erro e retry',
      'Cobertura mínima de 60% (recomendado 70%+) com foco em ViewModel, Repository e mapeamentos',
      'Sem lógica de negócio na Activity; ViewModel com estado observável e Repository isolando API',
      'Testes sem depender de internet real, sem delays reais e com dispatcher de teste',
      'Opcional: favoritos com Room + testes DAO, retry automático, Result genérico, teste de navegação e FakeRepository',
    ],
    relatedLessons: [
      {
        title: 'PokéAPI Retrofit',
        description: 'Configure endpoints e modelos para listar e detalhar Pokémons com segurança.',
      },
      {
        title: 'Paginação API Android',
        description: 'Implemente carregamento incremental para lista grande de Pokémons.',
      },
      {
        title: 'Mockito Android',
        description: 'Mocke dependências para testar ViewModel e Repository sem rede real.',
      },
      {
        title: 'Coroutines Test',
        description: 'Teste fluxo assíncrono com dispatcher de teste e execução determinística.',
      },
      {
        title: 'Truth assertions',
        description: 'Escreva asserções claras para validar estados e transformações de dados.',
      },
      {
        title: 'Espresso UI tests',
        description: 'Valide busca, navegação, erro e retry diretamente na interface.',
      },
      {
        title: 'Coverage Android',
        description: 'Meça cobertura e priorize ViewModel, Repository e funções de transformação.',
      },
      {
        title: 'Formatação e utilitários Kotlin',
        description: 'Teste regras como número #001 e conversões de altura/peso.',
      },
    ],
  },
]

export function getFormacaoAndroidApp(id: string) {
  return FORMACAO_ANDROID_APPS.find((a) => a.id === id) ?? null
}
