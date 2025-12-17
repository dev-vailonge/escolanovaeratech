import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { XP_CONSTANTS } from '@/lib/gamification/constants'

export type XPSource = 'aula' | 'quiz' | 'desafio' | 'comunidade'

export type RankingType = 'mensal' | 'geral'

export type RankingRow = {
  id: string
  name: string
  level: number
  xp: number
  xp_mensal: number
  avatar_url?: string | null
  desafiosConcluidos: number
  quizzesCompletos: number
  quizTentativas: number
  respostasComunidade: number
}

export async function insertXpEntry(params: {
  userId: string
  source: XPSource
  sourceId: string
  amount: number
  description?: string
}) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_xp_history').insert({
    user_id: params.userId,
    source: params.source,
    source_id: params.sourceId,
    amount: params.amount,
    description: params.description || null,
  })

  if (error) throw error
}

export async function completarDesafio(params: { userId: string; desafioId: string }) {
  const supabase = getSupabaseAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('user_desafio_progress')
    .select('id, completo')
    .eq('user_id', params.userId)
    .eq('desafio_id', params.desafioId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing?.completo) {
    return { awarded: false as const, reason: 'already_completed' as const }
  }

  const { data: desafio, error: desafioError } = await supabase
    .from('desafios')
    .select('xp, titulo')
    .eq('id', params.desafioId)
    .single()

  if (desafioError) throw desafioError

  const { error: upsertError } = await supabase.from('user_desafio_progress').upsert(
    {
      user_id: params.userId,
      desafio_id: params.desafioId,
      completo: true,
    },
    { onConflict: 'user_id,desafio_id' }
  )

  if (upsertError) throw upsertError

  await insertXpEntry({
    userId: params.userId,
    source: 'desafio',
    sourceId: params.desafioId,
    amount: desafio.xp,
    description: `Desafio concluído: ${desafio.titulo}`,
  })

  return { awarded: true as const, xp: desafio.xp }
}

export async function completarQuiz(params: { userId: string; quizId: string; pontuacao: number }) {
  const supabase = getSupabaseAdmin()

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('xp, titulo')
    .eq('id', params.quizId)
    .single()

  if (quizError) throw quizError

  const { data: existing, error: existingError } = await supabase
    .from('user_quiz_progress')
    .select('id, tentativas, melhor_pontuacao')
    .eq('user_id', params.userId)
    .eq('quiz_id', params.quizId)
    .maybeSingle()

  if (existingError) throw existingError

  const newTentativas = (existing?.tentativas || 0) + 1
  const bestScore =
    existing?.melhor_pontuacao == null
      ? params.pontuacao
      : Math.max(existing.melhor_pontuacao, params.pontuacao)

  const upsertPayload = {
    user_id: params.userId,
    quiz_id: params.quizId,
    completo: true,
    pontuacao: params.pontuacao,
    tentativas: newTentativas,
    melhor_pontuacao: bestScore,
  }

  const { error: upsertError } = await supabase
    .from('user_quiz_progress')
    .upsert(upsertPayload, { onConflict: 'user_id,quiz_id' })

  if (upsertError) throw upsertError

  // Buscar XP total já ganho deste quiz específico
  const { data: xpHistory, error: xpHistoryError } = await supabase
    .from('user_xp_history')
    .select('amount')
    .eq('user_id', params.userId)
    .eq('source', 'quiz')
    .eq('source_id', params.quizId)

  if (xpHistoryError) throw xpHistoryError

  // Calcular XP total já ganho
  const xpTotalGanho = (xpHistory || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)
  
  // Calcular XP remanescente (limite máximo do quiz menos o que já foi ganho)
  const xpRemanescente = Math.max(0, quiz.xp - xpTotalGanho)
  
  // Se não há XP remanescente, não conceder XP
  if (xpRemanescente <= 0) {
    return { 
      awarded: false as const, 
      reason: 'xp_limit_reached' as const,
      xp: 0,
      tentativas: newTentativas, 
      melhorPontuacao: bestScore 
    }
  }

  // Calcular XP ganho proporcional à pontuação sobre o remanescente
  // Se pontuacao = 100%, ganha 100% do XP remanescente
  // Se pontuacao = 50%, ganha 50% do XP remanescente
  const xpGanho = Math.round((params.pontuacao / 100) * xpRemanescente)
  
  // Registrar XP ganho
  await insertXpEntry({
    userId: params.userId,
    source: 'quiz',
    sourceId: params.quizId,
    amount: xpGanho,
    description: `Quiz concluído: ${quiz.titulo} (${params.pontuacao}% - tentativa ${newTentativas})`,
  })

  return { 
    awarded: true as const, 
    xp: xpGanho, 
    xpRemanescente: xpRemanescente - xpGanho,
    tentativas: newTentativas, 
    melhorPontuacao: bestScore 
  }
}

export async function responderComunidade(params: { userId: string; perguntaId: string; conteudo: string }) {
  const supabase = getSupabaseAdmin()

  const { data: resposta, error: respostaError } = await supabase
    .from('respostas')
    .insert({
      pergunta_id: params.perguntaId,
      autor_id: params.userId,
      conteudo: params.conteudo,
    })
    .select('id')
    .single()

  if (respostaError) throw respostaError

  // XP não é dado imediatamente - apenas quando o proprietário da pergunta
  // marcar a resposta como válida (thumbs up)
  return { awarded: false as const, respostaId: resposta.id }
}

export async function getRanking(params: { type: RankingType; limit?: number }) {
  const supabase = getSupabaseAdmin()
  const limit = params.limit || 50

  // Query otimizada: apenas campos necessários, ordenado pelo XP, com limite
  const orderColumn = params.type === 'mensal' ? 'xp_mensal' : 'xp'
  
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id,name,level,xp,xp_mensal,avatar_url')
    .in('role', ['aluno', 'admin'])
    .eq('access_level', 'full')
    .order(orderColumn, { ascending: false })
    .limit(limit)

  if (usersError) throw usersError
  
  // Retorna direto com posição calculada
  return (users || []).map((u, idx) => ({
    id: u.id,
    name: u.name,
    level: u.level,
    xp: u.xp,
    xp_mensal: u.xp_mensal,
    avatar_url: u.avatar_url,
    position: idx + 1,
  }))
}


