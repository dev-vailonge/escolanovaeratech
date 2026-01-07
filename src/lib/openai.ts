import OpenAI from 'openai'
import { getSupabaseAdmin } from './server/supabaseAdmin'

// Cliente OpenAI - usar apenas no servidor (API routes)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Tipo para desafio gerado pela IA
export interface DesafioGerado {
  titulo: string
  descricao: string
  requisitos: string[]
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

    // Salvar no banco de dados usando Supabase Admin (bypass RLS)
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('openai_token_usage').insert({
      user_id: userId,
      feature,
      endpoint,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: totalCost,
      metadata,
    })

    if (error) {
      console.error('❌ Erro ao rastrear uso de tokens:', error)
      // Não lançar erro para não quebrar o fluxo principal
    } else {
      console.log(
        `✅ Token usage tracked: ${totalTokens} tokens ($${totalCost.toFixed(6)}) - ${feature}`
      )
    }
  } catch (error) {
    console.error('❌ Erro ao rastrear uso de tokens:', error)
    // Não lançar erro para não quebrar o fluxo principal
  }
}

// Prompt para gerar desafios (XP é fixo em 50, não precisa da IA sugerir)
const PROMPT_GERAR_DESAFIO = `Você é um instrutor de programação experiente. Gere um desafio prático de programação.

Tecnologia: {tecnologia}
Nível: {nivel}

Requisitos do desafio:
- Deve ser implementável em 1-3 horas
- Título claro e objetivo (máximo 60 caracteres)
- Descrição detalhada do que o aluno deve fazer
- 3-5 requisitos específicos e verificáveis
- Desafiador mas alcançável para o nível indicado
- Deve resultar em código que possa ser hospedado no GitHub

Níveis de referência:
- iniciante: conceitos básicos, sintaxe simples, sem bibliotecas complexas
- intermediario: conceitos mais avançados, uso de APIs, padrões de projeto simples
- avancado: arquitetura, otimização, padrões complexos, integração de sistemas

IMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional:
{
  "titulo": "string",
  "descricao": "string detalhada",
  "requisitos": ["req1", "req2", "req3"]
}`

/**
 * Gera um desafio de programação usando OpenAI
 * 
 * @param tecnologia - Tecnologia do desafio (ex: 'JavaScript', 'React', 'Android')
 * @param nivel - Nível de dificuldade
 * @param userId - ID do usuário que solicitou (para rastreamento de tokens)
 * @param endpoint - Endpoint da API que chamou (para rastreamento)
 */
export async function gerarDesafioComIA(
  tecnologia: string,
  nivel: 'iniciante' | 'intermediario' | 'avancado',
  userId?: string,
  endpoint?: string
): Promise<DesafioGerado> {
  const prompt = PROMPT_GERAR_DESAFIO
    .replace('{tecnologia}', tecnologia)
    .replace('{nivel}', nivel)

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
    const desafio = JSON.parse(content) as DesafioGerado
    
    // Validar campos obrigatórios
    if (!desafio.titulo || !desafio.descricao || !desafio.requisitos) {
      throw new Error('Resposta incompleta da IA')
    }
    
    return desafio
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
