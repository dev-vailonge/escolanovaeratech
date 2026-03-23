import OpenAI from 'openai'
import { getSupabaseAdmin } from './server/supabaseAdmin'
import type {
  NorteTechTestRespostasData,
  NorteTechTestResultadoIA,
  NorteTechTestFormacaoSugerida,
  NorteTechTestAreaId,
  NorteTechTestAreaRespostasData,
} from '@/types/database'

// Cliente OpenAI - usar apenas no servidor (API routes)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Tipo para desafio gerado pela IA
export interface DesafioPassoGerado {
  titulo: string
  detalhes?: string
}

export interface DesafioGerado {
  titulo: string
  descricao: string
  requisitos: string[]
  passos: DesafioPassoGerado[]
}

// Taxas de preço da OpenAI por modelo (USD por 1M tokens)
const OPENAI_PRICING = {
  'gpt-4o-mini': {
    input: 0.150, // $0.150 / 1M tokens
    output: 0.600, // $0.600 / 1M tokens
  },
  'gpt-4o': {
    input: 2.50, // $2.50 / 1M tokens
    output: 10.00, // $10.00 / 1M tokens
  },
} as const

// Parâmetros para rastrear uso de tokens
interface TrackTokenUsageParams {
  userId: string
  feature: string
  endpoint: string
  model: string
  promptTokens: number
  completionTokens: number
  metadata?: Record<string, any>
}

/**
 * Rastreia o uso de tokens da OpenAI no banco de dados
 * Calcula o custo estimado baseado nos preços da OpenAI
 */
async function trackTokenUsage(params: TrackTokenUsageParams): Promise<void> {
  try {
    const {
      userId,
      feature,
      endpoint,
      model,
      promptTokens,
      completionTokens,
      metadata = {},
    } = params

    // Calcular custo estimado
    const pricing = OPENAI_PRICING[model as keyof typeof OPENAI_PRICING] || {
      input: 0,
      output: 0,
    }

    const inputCost = (promptTokens * pricing.input) / 1_000_000
    const outputCost = (completionTokens * pricing.output) / 1_000_000
    const totalCost = inputCost + outputCost
    const totalTokens = promptTokens + completionTokens

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

    // Salvar no banco de dados usando Supabase Admin (bypass RLS)
    const supabase = getSupabaseAdmin()
    
    const insertData = {
      user_id: userId,
      feature,
      endpoint,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: totalCost,
      metadata,
    }

    const { data, error } = await supabase
      .from('openai_token_usage')
      .insert(insertData)
      .select()

    if (error) {
      // Não lançar erro para não quebrar o fluxo principal
    }
  } catch {
    // Não lançar erro para não quebrar o fluxo principal
  }
}

function isAndroidTecnologia(tecnologia: string) {
  return ['Kotlin', 'Jetpack Compose', 'Android'].includes(tecnologia)
}

function formatBulletRules(rules: string[]) {
  return rules.map((r) => `- ${r}`).join('\n')
}

function getScopeRules(tecnologia: string): string[] {
  return [
    `Não saia do escopo da tecnologia selecionada (${tecnologia}).`,
    'Nunca peça para construir um backend/API em outra tecnologia (ex: Node.js, Java, Python).',
    'Se precisar de consumo remoto, sempre consuma uma API pública pronta (qualquer API pública disponível).',
    'Não inclua tarefas que exijam infraestrutura/serviços pagos (ex: Firebase pago, AWS, etc.). Prefira soluções locais e gratuitas.',
  ]
}

function getAndroidRules(
  tecnologia: string,
  nivel: 'iniciante' | 'intermediario' | 'avancado'
): string[] {
  const isCompose = tecnologia === 'Jetpack Compose'

  const base = [
    'Focar no ecossistema Android (UI, navegação, lifecycle, estado).',
    'Não sair do escopo Android; se precisar de dados remotos, apenas consumir API pública pronta (não criar backend).',
    ...(isCompose
      ? ['Usar Jetpack Compose para UI (não usar XML/Views).']
      : ['UI pode ser feita com Views (XML) ou Jetpack Compose (opcional) — escolha uma abordagem e deixe claro.']),
  ]

  if (nivel === 'iniciante') {
    return [
      ...base,
      'NÃO usar arquitetura (MVVM/Clean) e NÃO incluir testes.',
      'NÃO consumir APIs.',
      'App simples com navegação entre telas.',
      'Navegação pode ser feita com Compose Navigation/Navigation Component ou com Activities/Intents (opcional — escolha uma abordagem e deixe claro).',
    ]
  }

  if (nivel === 'intermediario') {
    return [
      ...base,
      'NÃO usar arquitetura (MVVM/Clean) e NÃO incluir testes.',
      'NÃO consumir APIs.',
      'Persistência local com Room Database.',
      ...(isCompose
        ? ['Tela de listagem com Jetpack Compose (ex: LazyColumn).']
        : ['Tela de listagem (RecyclerView se Views, ou LazyColumn se Compose).']),
      'CRUD com navegação entre telas (criar/editar/remover/visualizar).',
    ]
  }

  // avançado
  const testRules: string[] = [
    'Incluir testes unitários (mínimo: ViewModel e/ou use-cases).',
  ]
  if (tecnologia === 'Jetpack Compose') {
    testRules.push('Incluir testes de UI com Jetpack Compose Testing (Compose tests).')
  } else {
    testRules.push('Se optar por Jetpack Compose, incluir testes de UI com Compose Testing (Compose tests).')
  }

  return [
    ...base,
    'App completo com consumo de API pública.',
    'Arquitetura MVVM.',
    ...testRules,
  ]
}

function buildPromptGerarDesafio(params: {
  tecnologia: string
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  desafiosJaFeitos?: { titulo: string; descricao?: string }[]
}) {
  const { tecnologia, nivel, desafiosJaFeitos } = params

  const scopeRules = getScopeRules(tecnologia)
  const techRules = isAndroidTecnologia(tecnologia) ? getAndroidRules(tecnologia, nivel) : []

  const secaoJaFeitos =
    desafiosJaFeitos && desafiosJaFeitos.length > 0
      ? `
DESAFIOS QUE ESTE ALUNO JÁ REALIZOU (não repita tema, objetivo nem contexto similares):
${desafiosJaFeitos.map((d) => `- "${d.titulo}"${d.descricao ? `: ${d.descricao}` : ''}`).join('\n')}

Gere um desafio NOVO e claramente diferente em tema, objetivo e contexto (ex.: outro tipo de app, domínio diferente como e-commerce, blog, jogo, dashboard, etc.).
`
      : ''

  return `Você é um instrutor de programação experiente. Gere um desafio prático de programação.

Tecnologia: ${tecnologia}
Nível: ${nivel}
${secaoJaFeitos}

REGRAS OBRIGATÓRIAS (escopo e tecnologia):
${formatBulletRules([...scopeRules, ...techRules])}

Requisitos do desafio:
- Deve ser implementável em 1-3 horas
- Título claro e objetivo (máximo 60 caracteres)
- Descrição detalhada do que o aluno deve fazer
- 3-5 requisitos específicos e verificáveis
- Deve resultar em código que possa ser hospedado no GitHub
- Varie o contexto (tipo de aplicação, domínio) para que o desafio seja distinto de outros da mesma tecnologia e nível

IMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional:
{
  "titulo": "string",
  "descricao": "string detalhada",
  "requisitos": ["req1", "req2", "req3"],
  "passos": [
    { "titulo": "Passo 1", "detalhes": "Detalhe do que fazer" },
    { "titulo": "Passo 2", "detalhes": "Detalhe do que fazer" }
  ]
}`
}

/**
 * Gera um desafio de programação usando OpenAI
 * 
 * @param tecnologia - Tecnologia do desafio (ex: 'JavaScript', 'React', 'Android')
 * @param nivel - Nível de dificuldade
 * @param userId - ID do usuário que solicitou (para rastreamento de tokens)
 * @param endpoint - Endpoint da API que chamou (para rastreamento)
 * @param desafiosJaFeitos - Desafios que o aluno já realizou (mesma tech+nível) para a IA evitar repetir
 */
export async function gerarDesafioComIA(
  tecnologia: string,
  nivel: 'iniciante' | 'intermediario' | 'avancado',
  userId?: string,
  endpoint?: string,
  desafiosJaFeitos?: { titulo: string; descricao?: string }[]
): Promise<DesafioGerado> {
  const prompt = buildPromptGerarDesafio({ tecnologia, nivel, desafiosJaFeitos })

  const model = 'gpt-4o-mini'
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente que gera desafios de programação. Responda apenas com JSON válido.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 800, // Reduzido pois não precisa mais do xp_sugerido
    response_format: { type: 'json_object' }
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Resposta vazia da OpenAI')
  }

  // Rastrear uso de tokens (se userId fornecido)
  if (userId && response.usage) {
    await trackTokenUsage({
      userId,
      feature: 'Geração de Desafio',
      endpoint: endpoint || '/api/desafios/gerar',
      model,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      metadata: {
        tecnologia,
        nivel,
      },
    })
  }

  try {
    const parsed = JSON.parse(content) as any
    
    // Validar campos obrigatórios
    if (!parsed?.titulo || !parsed?.descricao) {
      throw new Error('Resposta incompleta da IA')
    }

    // Normalizar requisitos (sempre array de string)
    const requisitos: string[] = Array.isArray(parsed.requisitos)
      ? parsed.requisitos.map((r: any) => String(r)).filter(Boolean)
      : []

    // Normalizar passos (aceita array de string ou array de objetos)
    let passos: DesafioPassoGerado[] = []
    if (Array.isArray(parsed.passos)) {
      passos = parsed.passos
        .map((p: any) => {
          if (typeof p === 'string') {
            return { titulo: p, detalhes: '' }
          }
          if (p && typeof p === 'object') {
            const titulo = String(p.titulo || '').trim()
            const detalhes = String(p.detalhes || '').trim()
            if (!titulo) return null
            return { titulo, detalhes }
          }
          return null
        })
        .filter(Boolean) as DesafioPassoGerado[]
    }

    // Fallback: se IA não retornou passos, gerar a partir dos requisitos
    if (!passos.length && requisitos.length) {
      passos = requisitos.map((r) => ({ titulo: r, detalhes: '' }))
    }

    // Garantir pelo menos alguns requisitos
    if (!requisitos.length) {
      throw new Error('Resposta incompleta da IA (requisitos ausentes)')
    }

    return {
      titulo: String(parsed.titulo),
      descricao: String(parsed.descricao),
      requisitos,
      passos,
    }
  } catch (parseError) {
    console.error('Erro ao parsear resposta da OpenAI:', content)
    throw new Error('Erro ao processar resposta da IA')
  }
}

// --- Aulas sugeridas para desafio ---

export interface AulaSugerida {
  aulaId: string
  titulo: string
  relevancia?: string
}

/**
 * Usa a IA para sugerir quais aulas do curso são mais relevantes para o aluno fazer o desafio.
 * Recebe o desafio (título, descrição, requisitos) e a lista de aulas (id + título) e retorna
 * as aulas recomendadas em ordem de relevância.
 */
export async function sugerirAulasParaDesafio(params: {
  titulo: string
  descricao: string
  requisitos?: string[]
  aulas: { id: string; titulo: string }[]
  maxSugestoes?: number
}): Promise<AulaSugerida[]> {
  const { titulo, descricao, requisitos = [], aulas, maxSugestoes = 5 } = params

  if (aulas.length === 0) return []

  const requisitosTexto = requisitos.length
    ? `Requisitos do desafio:\n${requisitos.map((r) => `- ${r}`).join('\n')}`
    : ''

  const listaAulas = aulas
    .map((a) => `- id: "${a.id}" | título: "${a.titulo}"`)
    .join('\n')

  const prompt = `Você é um orientador de estudos. Com base no desafio abaixo e na lista de aulas do curso, indique quais aulas são mais úteis para o aluno realizar esse desafio.

DESAFIO:
Título: ${titulo}
Descrição: ${descricao}
${requisitosTexto}

LISTA DE AULAS DO CURSO (id e título):
${listaAulas}

Retorne APENAS um JSON válido, sem texto adicional, no formato:
{
  "aulas": [
    { "aulaId": "id da aula", "titulo": "título da aula", "relevancia": "breve motivo em uma frase" },
    ...
  ]
}
Regras: selecione no máximo ${maxSugestoes} aulas, em ordem da mais relevante para a menos. O array "aulas" deve conter apenas as aulas que realmente ajudam no desafio.`

  const model = 'gpt-4o-mini'
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente que sugere aulas para ajudar em desafios de programação. Responda apenas com JSON válido.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: 'json_object' }
  })

  const content = response.choices[0]?.message?.content
  if (!content) return []

  try {
    const parsed = JSON.parse(content) as {
      aulas?: Array<{ aulaId?: string; id?: string; titulo?: string; relevancia?: string }>
    }
    const lista = Array.isArray(parsed.aulas) ? parsed.aulas : []
    return lista.slice(0, maxSugestoes).map((a) => ({
      aulaId: String(a.aulaId ?? a.id ?? ''),
      titulo: String(a.titulo ?? ''),
      relevancia: a.relevancia ? String(a.relevancia) : undefined
    }))
  } catch {
    console.error('Erro ao parsear resposta de aulas sugeridas:', content)
    return []
  }
}

// Tipo para quiz gerado pela IA (texto puro)
export interface QuizGerado {
  texto: string // Texto puro formatado com 15 perguntas
}

// Prompt para gerar quiz (formato texto puro)
const PROMPT_GERAR_QUIZ = `Você é um instrutor de programação experiente. Gere um quiz com EXATAMENTE 15 perguntas de múltipla escolha.

Tecnologia: {tecnologia}
Nível: {nivel}

FORMATO OBRIGATÓRIO (TEXTO PURO, SEM MARKDOWN):
- Sempre 15 perguntas
- Texto puro (sem markdown, sem **, sem #)
- Cada pergunta começa com "NÚMERO + PONTO + ESPAÇO" (ex: "1. ", "2. ")
- Alternativas com letras: A) B) C) D) E) F) (mínimo 4, máximo 6 alternativas por pergunta)
- Após as alternativas:
  R: LETRA_DA_CORRETA (ex: R: C)
  E: explicação breve e clara (1-2 frases)
- Separar perguntas com exatamente três hífens:
  ---

Exemplo do formato:
1. Pergunta sobre conceitos básicos?
A) Alternativa 1
B) Alternativa 2
C) Alternativa 3
D) Alternativa 4
R: C
E: Explicação breve do porquê C está correto.
---
2. Outra pergunta...
A) ...
B) ...
C) ...
D) ...
R: B
E: Explicação breve.
---
(continue até 15 perguntas)

Níveis de referência:
- iniciante: conceitos básicos, sintaxe simples, fundamentos
- intermediario: conceitos mais avançados, padrões, práticas
- avancado: arquitetura, otimização, conceitos complexos

IMPORTANTE:
- Gere EXATAMENTE 15 perguntas
- Use apenas texto puro (sem formatação markdown)
- Cada pergunta deve ter entre 4 e 6 alternativas
- Separe perguntas com exatamente "---"
- Perguntas devem ser relevantes para a tecnologia e nível especificados`

/**
 * Gera um quiz usando OpenAI no formato texto puro
 * 
 * @param tecnologia - Tecnologia do quiz (ex: 'JavaScript', 'React', 'Android')
 * @param nivel - Nível de dificuldade
 * @param userId - ID do usuário que solicitou (para rastreamento de tokens)
 * @param endpoint - Endpoint da API que chamou (para rastreamento)
 */
export async function gerarQuizComIA(
  tecnologia: string,
  nivel: 'iniciante' | 'intermediario' | 'avancado',
  userId?: string,
  endpoint?: string
): Promise<QuizGerado> {
  const prompt = PROMPT_GERAR_QUIZ
    .replace('{tecnologia}', tecnologia)
    .replace('{nivel}', nivel)

  const model = 'gpt-4o-mini'
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente que gera quizzes de programação em formato texto puro. Responda apenas com o texto formatado das perguntas, sem comentários adicionais.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000, // 15 perguntas podem ser longas
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Resposta vazia da OpenAI')
  }

  // Rastrear uso de tokens (se userId fornecido)
  if (userId && response.usage) {
    await trackTokenUsage({
      userId,
      feature: 'Geração de Quiz',
      endpoint: endpoint || '/api/quiz/gerar',
      model,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      metadata: {
        tecnologia,
        nivel,
      },
    })
  }

  // Validar que o texto contém pelo menos algumas perguntas
  const questionCount = (content.match(/^\d+\.\s/gm) || []).length
  if (questionCount < 10) {
    console.error('⚠️ Quiz gerado com menos de 10 perguntas:', questionCount)
    // Não falhar, mas logar o problema
  }

  return {
    texto: content.trim()
  }
}

// -----------------------------
// Norte Tech Test - Análise de respostas e sugestão de formação
// -----------------------------

const NORTE_TECH_FORMACOES_VALIDAS: NorteTechTestFormacaoSugerida[] = [
  'android',
  'frontend',
  'backend',
  'ios',
  'analise-dados',
  'ainda_explorando',
]

function buildTextoFeedbackAreasParaPrompt(
  areaRespostas: Record<NorteTechTestAreaId, NorteTechTestAreaRespostasData>
): string {
  const areaLabels: Record<NorteTechTestAreaId, string> = {
    android: 'Android',
    frontend: 'Web Frontend',
    backend: 'Backend',
    ios: 'iOS',
    'analise-dados': 'Análise de Dados',
  }
  const lines: string[] = []
  ;(Object.entries(areaRespostas) as [NorteTechTestAreaId, NorteTechTestAreaRespostasData][]).forEach(
    ([areaId, r]) => {
      if (!r || typeof r !== 'object') return
      const label = areaLabels[areaId]
      const parts: string[] = []
      if (r.curti_praticar != null) parts.push(`curtiu praticar: ${r.curti_praticar}/5`)
      if (r.energia != null) parts.push(`energia: ${r.energia}/5`)
      if (r.dificuldade != null) parts.push(`dificuldade: ${r.dificuldade}/5`)
      if (r.confianca != null) parts.push(`confiança: ${r.confianca}/5`)
      if (r.me_vejo_6_meses) parts.push(`me vejo 6 meses: ${r.me_vejo_6_meses}`)
      if (r.o_que_mais_gostei?.trim()) parts.push(`o que mais gostei: ${r.o_que_mais_gostei.trim()}`)
      if (r.o_que_foi_mais_dificil?.trim()) parts.push(`o que foi mais difícil: ${r.o_que_foi_mais_dificil.trim()}`)
      if (r.comentario_livre?.trim()) parts.push(`comentário: ${r.comentario_livre.trim()}`)
      if (parts.length) lines.push(`[${label}] ${parts.join('; ')}`)
    }
  )
  return lines.length ? lines.join('\n') : ''
}

function buildTextoRespostasParaPrompt(respostas: NorteTechTestRespostasData): string {
  const lines: string[] = []

  if (respostas.por_que_entrei?.trim()) lines.push(`Por que entrou no Norte Tech: ${respostas.por_que_entrei.trim()}`)
  if (respostas.o_que_assusta?.trim()) lines.push(`O que mais assusta hoje: ${respostas.o_que_assusta.trim()}`)
  if (respostas.areas_interesse?.length) lines.push(`Áreas que acha que pode gostar: ${respostas.areas_interesse.join(', ')}`)
  if (respostas.avaliacoes_areas?.length) {
    lines.push(`Avaliações por área: ${respostas.avaliacoes_areas.map(a => `${a.area}=${a.avaliacao}`).join('; ')}`)
  }

  if (respostas.o_que_aprendi?.trim()) lines.push(`O que aprendeu sobre programação: ${respostas.o_que_aprendi.trim()}`)
  if (respostas.o_que_surpreendeu?.trim()) lines.push(`O que mais surpreendeu: ${respostas.o_que_surpreendeu.trim()}`)
  if (respostas.mais_confiante !== undefined && respostas.mais_confiante !== null) {
    lines.push(`Sente mais confiante que no começo: ${respostas.mais_confiante ? 'Sim' : 'Não'}`)
  }

  if (respostas.area_mais_gostei_praticar?.trim()) lines.push(`Área que mais gostou de praticar: ${respostas.area_mais_gostei_praticar.trim()}`)
  if (respostas.area_mais_energia?.trim()) lines.push(`Área que deu mais energia: ${respostas.area_mais_energia.trim()}`)
  if (respostas.area_dificil_interessante?.trim()) lines.push(`Área difícil mas interessante: ${respostas.area_dificil_interessante.trim()}`)
  if (respostas.area_menos_gostei?.trim()) lines.push(`Área que menos gostou: ${respostas.area_menos_gostei.trim()}`)
  if (respostas.area_uma_so_6_meses?.trim()) lines.push(`Se pudesse estudar só uma área por 6 meses: ${respostas.area_uma_so_6_meses.trim()}`)

  if (respostas.area_escolhida?.trim()) lines.push(`Área que escolhe focar agora: ${respostas.area_escolhida.trim()}`)
  if (respostas.porque_escolhi?.trim()) lines.push(`Por quê: ${respostas.porque_escolhi.trim()}`)

  if (respostas.o_que_aprender?.trim()) lines.push(`O que precisa aprender a seguir: ${respostas.o_que_aprender.trim()}`)
  if (respostas.proximo_passo_concreto?.trim()) lines.push(`Próximo passo concreto: ${respostas.proximo_passo_concreto.trim()}`)
  if (respostas.quando_comeco?.trim()) lines.push(`Quando começa: ${respostas.quando_comeco.trim()}`)
  if (respostas.texto_compromisso?.trim()) lines.push(`Compromisso: ${respostas.texto_compromisso.trim()}`)

  return lines.length ? lines.join('\n') : '(Nenhuma resposta preenchida)'
}

/**
 * Analisa as respostas do Norte Tech Test e sugere uma formação usando OpenAI.
 * Inclui feedback por área (obrigatório). Formações possíveis: android, frontend, backend, ios, analise-dados, ainda_explorando.
 */
export async function analisarNorteTechTest(
  respostas: NorteTechTestRespostasData,
  areaRespostas: Record<NorteTechTestAreaId, NorteTechTestAreaRespostasData>,
  userId?: string,
  endpoint?: string
): Promise<NorteTechTestResultadoIA> {
  const textoRespostas = buildTextoRespostasParaPrompt(respostas)
  const textoAreas = buildTextoFeedbackAreasParaPrompt(areaRespostas)

  const prompt = `Você é um orientador de carreira em programação. Um aluno concluiu o "Norte Tech Test" (reflexão sobre áreas de programação). Com base APENAS nas respostas abaixo, indique qual formação da nossa escola melhor combina com o perfil dele.

IMPORTANTE: A sugestão é para o PRÓPRIO ALUNO ler — para ajudá-lo a escolher sua formação. Escreva sempre em segunda pessoa, dirigindo-se a ele diretamente (ex.: "Você demonstrou...", "Sua experiência em...", "Com base no que você indicou..."). NUNCA escreva em terceira pessoa ("o aluno demonstrou", "ele indicou") — o texto é para o aluno, não para a escola.

FORMATIONS DISPONÍVEIS (retorne o slug exatamente como está):
- android (Android)
- frontend (Web Frontend)
- backend (Backend)
- ios (iOS)
- analise-dados (Análise de Dados)
- ainda_explorando (use só se as respostas forem muito vagas ou contraditórias; o aluno ainda não tem direção clara)

FEEDBACK POR ÁREA (avaliação do aluno em cada área - use como sinal forte):
${textoAreas || '(Nenhum)'}

RESPOSTAS GERAIS DO ALUNO:
${textoRespostas}

REGRAS:
- Baseie-se no que o aluno escreveu e no feedback por área. Dê peso ao feedback por área (curtiu praticar, energia, me_vejo_6_meses).
- Se as respostas forem vagas ou contraditórias, use formacao_sugerida "ainda_explorando" e confianca entre 1 e 4.
- resumo: 2 a 3 frases em SEGUNDA PESSOA dirigidas ao aluno (ex.: "Você mostrou interesse em...", "Com base no seu feedback..."). Explicando por que essa formação faz sentido para ELE.
- proximos_passos: 1 ou 2 sugestões práticas em uma frase, em segunda pessoa (ex.: "Você pode...", "Experimente..."). Opcional; pode ser null se não houver o que sugerir.

Retorne APENAS um JSON válido, sem texto adicional:
{
  "formacao_sugerida": "android" | "frontend" | "backend" | "ios" | "analise-dados" | "ainda_explorando",
  "confianca": 1 a 10,
  "resumo": "string com 2-3 frases em segunda pessoa para o aluno",
  "proximos_passos": "string ou null em segunda pessoa"
}`

  const model = 'gpt-4o-mini'
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Você é um orientador que sugere formações em programação. O texto (resumo e próximos_passos) deve ser dirigido AO ALUNO em segunda pessoa (você, seu, sua). Responda apenas com JSON válido.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Resposta vazia da OpenAI')
  }

  if (userId && response.usage) {
    await trackTokenUsage({
      userId,
      feature: 'Norte Tech Test - Análise',
      endpoint: endpoint || '/api/norte-tech-test/analisar',
      model,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      metadata: {},
    })
  }

  try {
    const parsed = JSON.parse(content) as {
      formacao_sugerida?: string
      confianca?: number
      resumo?: string | null
      proximos_passos?: string | null
    }

    const formacao = String(parsed.formacao_sugerida || 'ainda_explorando').toLowerCase().replace(/\s+/g, '-')
    const formacaoValida: NorteTechTestFormacaoSugerida = NORTE_TECH_FORMACOES_VALIDAS.includes(formacao as NorteTechTestFormacaoSugerida)
      ? (formacao as NorteTechTestFormacaoSugerida)
      : 'ainda_explorando'

    const confianca = Math.min(10, Math.max(1, Number(parsed.confianca) || 5))

    return {
      formacao_sugerida: formacaoValida,
      confianca,
      resumo: parsed.resumo ? String(parsed.resumo).trim() || null : null,
      proximos_passos: parsed.proximos_passos ? String(parsed.proximos_passos).trim() || null : null,
      analisado_em: new Date().toISOString(),
    }
  } catch (e) {
    console.error('Erro ao parsear resposta Norte Tech Test:', content, e)
    throw new Error('Erro ao processar análise da IA')
  }
}
