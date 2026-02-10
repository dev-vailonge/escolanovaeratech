import OpenAI from 'openai'
import { getSupabaseAdmin } from './server/supabaseAdmin'

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

    console.log(`📊 [trackTokenUsage] Iniciando rastreamento:`, {
      userId,
      feature,
      endpoint,
      model,
      promptTokens,
      completionTokens
    })

    // Calcular custo estimado
    const pricing = OPENAI_PRICING[model as keyof typeof OPENAI_PRICING] || {
      input: 0,
      output: 0,
    }

    const inputCost = (promptTokens * pricing.input) / 1_000_000
    const outputCost = (completionTokens * pricing.output) / 1_000_000
    const totalCost = inputCost + outputCost
    const totalTokens = promptTokens + completionTokens

    // Verificar se SUPABASE_SERVICE_ROLE_KEY está configurado
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ [trackTokenUsage] SUPABASE_SERVICE_ROLE_KEY não configurado! Não é possível salvar tokens.')
      return
    }

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
    
    console.log(`📤 [trackTokenUsage] Tentando inserir no banco:`, {
      user_id: userId,
      feature,
      total_tokens: totalTokens,
      cost: totalCost
    })

    const { data, error } = await supabase
      .from('openai_token_usage')
      .insert(insertData)
      .select()

    if (error) {
      console.error('❌ [trackTokenUsage] Erro ao inserir no banco:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        insertData
      })
      // Não lançar erro para não quebrar o fluxo principal
    } else {
      console.log(
        `✅ [trackTokenUsage] Token usage tracked com sucesso: ${totalTokens} tokens ($${totalCost.toFixed(6)}) - ${feature} - ID: ${data?.[0]?.id}`
      )
    }
  } catch (error: any) {
    console.error('❌ [trackTokenUsage] Erro ao rastrear uso de tokens:', {
      message: error?.message,
      stack: error?.stack,
      params
    })
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
