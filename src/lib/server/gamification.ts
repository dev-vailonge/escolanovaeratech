import type { SupabaseClient } from '@supabase/supabase-js'
import { XP_CONSTANTS } from '@/lib/gamification/constants'
import { calculateLevel } from '@/lib/gamification'
import { getSupabaseClient } from './getSupabaseClient'
import { getSupabaseAdmin } from './supabaseAdmin'

/**
 * Já existe XP de bonificação por concluir um plano deste módulo (`cursos_desafios.id`).
 * Histórico antigo: `source_id` = id de `aluno_planos_estudo`; atual: `source_id` = módulo.
 */
export async function userAlreadyHasBonificacaoXpForCursoDesafioModule(params: {
  supabase: SupabaseClient
  userId: string
  cursosDesafioId: string
}): Promise<boolean> {
  const { supabase, userId, cursosDesafioId } = params

  const { data: byModuleId } = await supabase
    .from('user_xp_history')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'bonificacao')
    .eq('source_id', cursosDesafioId)
    .maybeSingle()
  if (byModuleId) return true

  const { data: planos } = await supabase
    .from('aluno_planos_estudo')
    .select('id')
    .eq('user_id', userId)
    .eq('cursos_desafio_id', cursosDesafioId)

  const planIds = (planos ?? []).map((p) => p.id).filter(Boolean)
  if (planIds.length === 0) return false

  const { data: xpRows } = await supabase
    .from('user_xp_history')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'bonificacao')
    .in('source_id', planIds)
    .limit(1)

  return (xpRows?.length ?? 0) > 0
}

export type XPSource = 'aula' | 'quiz' | 'desafio' | 'comunidade' | 'bonificacao'

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

/**
 * Sincroniza o nível do usuário baseado no XP atual
 */
async function syncUserLevel(userId: string, accessToken?: string) {
  const supabase = await getSupabaseClient(accessToken)
  
  // Buscar XP atual do usuário
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('xp, level')
    .eq('id', userId)
    .single()

  if (userError || !user) return

  // Calcular nível correto
  const correctLevel = calculateLevel(user.xp || 0)

  // Atualizar apenas se necessário
  if (user.level !== correctLevel) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ level: correctLevel })
      .eq('id', userId)

    if (updateError) {
      // Falha silenciosa ao atualizar nível
    }
  }
}

export async function insertXpEntry(params: {
  userId: string
  source: XPSource
  sourceId: string
  amount: number
  description?: string
  accessToken?: string
}) {
  const supabase = await getSupabaseClient(params.accessToken)

  // Tentar usar função SQL com SECURITY DEFINER primeiro (permite admins concederem XP a outros usuários)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('award_xp_to_user', {
      p_user_id: params.userId,
      p_source: params.source,
      p_source_id: params.sourceId,
      p_amount: params.amount,
      p_description: params.description || null,
    })

    if (!rpcError && rpcData) {
      await syncUserLevel(params.userId, params.accessToken)
      return
    }
  } catch {
    // RPC falhou, tentar INSERT direto
  }
  
  // Fallback: INSERT direto (funciona quando user_id = auth.uid())
  const { data, error } = await supabase.from('user_xp_history').insert({
    user_id: params.userId,
    source: params.source,
    source_id: params.sourceId,
    amount: params.amount,
    description: params.description || null,
  }).select()

  if (error) throw error

  // Atualizar nível automaticamente após inserir XP
  await syncUserLevel(params.userId, params.accessToken)
}


export async function completarDesafio(params: { userId: string; desafioId: string; accessToken?: string }) {
  const supabase = await getSupabaseClient(params.accessToken)

  let rpcErrorInfo: any = null
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('complete_desafio_for_user', {
      p_user_id: params.userId,
      p_desafio_id: params.desafioId,
    })

    if (!rpcError && rpcData) {
      await syncUserLevel(params.userId, params.accessToken)
      const xpDesafio = XP_CONSTANTS.desafio.completo
      return { awarded: true as const, xp: xpDesafio, rpcUsed: true }
    }

    // Se RPC falhar (função não existe ou erro), tentar método direto
    // IMPORTANTE: Se rpcError existe OU se rpcData é null/undefined, a função falhou
    if (rpcError || !rpcData) {
      rpcErrorInfo = rpcError ? {
        message: rpcError?.message || 'Função RPC retornou erro',
        code: rpcError?.code,
        details: rpcError?.details,
        hint: rpcError?.hint,
      } : {
        message: 'Função RPC retornou null/undefined',
        code: 'RPC_NO_DATA',
        details: '',
        hint: '',
      }
    }
  } catch (rpcError: any) {
    rpcErrorInfo = {
      message: rpcError?.message,
      code: rpcError?.code,
      stack: rpcError?.stack,
    }
    if (rpcError?.message?.includes('já recebeu XP')) {
      return { awarded: false as const, reason: 'already_received_xp' as const, xp: 0, rpcError: rpcErrorInfo }
    }
  }
  const { data: existing, error: existingError } = await supabase
    .from('user_desafio_progress')
    .select('id, completo')
    .eq('user_id', params.userId)
    .eq('desafio_id', params.desafioId)
    .maybeSingle()

  if (existingError) {
    // Se falhar, lançar erro com informações do RPC se disponível
    const errorToThrow: any = existingError
    if (rpcErrorInfo) {
      errorToThrow.rpcError = rpcErrorInfo
    }
    throw errorToThrow
  }
  
  // Verificar se o usuário já recebeu XP deste desafio específico
  const { data: xpHistory, error: xpHistoryError } = await supabase
    .from('user_xp_history')
    .select('amount')
    .eq('user_id', params.userId)
    .eq('source', 'desafio')
    .eq('source_id', params.desafioId)

  if (xpHistoryError) throw xpHistoryError
  
  // Se já recebeu XP deste desafio, não dar novamente
  const xpTotalGanho = (xpHistory || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)
  if (xpTotalGanho > 0) {
    return { awarded: false as const, reason: 'already_received_xp' as const, xp: 0 }
  }

  // Se já está marcado como completo mas não recebeu XP, re-marcar e dar XP
  // (pode acontecer em casos de bug ou dados inconsistentes)
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

  if (upsertError) {
    // Incluir informações do RPC se disponível
    const errorToThrow: any = upsertError
    if (rpcErrorInfo) {
      errorToThrow.rpcError = rpcErrorInfo
    }
    throw errorToThrow
  }

  // Usar valor oficial de XP para desafios (50 XP)
  const xpDesafio = XP_CONSTANTS.desafio.completo
  
  // Remover nível de dificuldade do título (iniciante, intermediário, avançado)
  const tituloLimpo = desafio.titulo
    .replace(/\s*-\s*(Iniciante|Intermediário|Intermediario|Avançado|Avancado)$/i, '')
    .replace(/\s*\(Iniciante|Intermediário|Intermediario|Avançado|Avancado\)$/i, '')
    .trim()
  
  try {
    await insertXpEntry({
      userId: params.userId,
      source: 'desafio',
      sourceId: params.desafioId,
      amount: xpDesafio,
      description: `Desafio concluído: ${tituloLimpo}`,
      accessToken: params.accessToken,
    })
  } catch (xpError: any) {
    throw xpError
  }

  // Atualizar nível automaticamente após inserir XP
  await syncUserLevel(params.userId, params.accessToken)

  return { awarded: true as const, xp: xpDesafio }
}

export async function completarQuiz(params: { 
  userId: string; 
  quizId: string; 
  pontuacao: number; 
  respostas?: { questionId: string; selectedOptionId: string; correct: boolean }[];
  accessToken?: string 
}) {
  const supabase = await getSupabaseClient(params.accessToken)

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('xp, titulo')
    .eq('id', params.quizId)
    .single()

  if (quizError) throw quizError

  // Usar valor oficial de XP para quizzes (20 XP máximo)
  const xpMaximoQuiz = XP_CONSTANTS.quiz.maximo

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upsertPayload: any = {
    user_id: params.userId,
    quiz_id: params.quizId,
    completo: true,
    pontuacao: params.pontuacao,
    tentativas: newTentativas,
    melhor_pontuacao: bestScore,
  }

  // Adicionar respostas se fornecidas
  if (params.respostas && params.respostas.length > 0) {
    upsertPayload.respostas = params.respostas
  }

  const { error: upsertError } = await supabase
    .from('user_quiz_progress')
    .upsert(upsertPayload, { onConflict: 'user_id,quiz_id' })

  if (upsertError) throw upsertError

  // Buscar XP total já ganho deste quiz específico
  // IMPORTANTE: Garantir que source_id seja comparado como UUID/text corretamente
  // Usar casting explícito para garantir matching correto
  const { data: xpHistory, error: xpHistoryError } = await supabase
    .from('user_xp_history')
    .select('id, amount, source_id, description, created_at')
    .eq('user_id', params.userId)
    .eq('source', 'quiz')
    // Usar filtro mais específico: garantir que source_id seja exatamente o quizId
    .eq('source_id', params.quizId)
    // Adicionar filtro adicional para garantir que não há entradas com source_id NULL ou incorreto
    .not('source_id', 'is', null)

  if (xpHistoryError) throw xpHistoryError

  let xpTotalGanho = 0
  for (const entry of xpHistory || []) {
    const entrySourceId = entry.source_id?.toString() || ''
    const quizIdStr = params.quizId.toString()
    if (entrySourceId !== quizIdStr) continue
    xpTotalGanho += entry.amount || 0
  }

  const xpRemanescente = Math.max(0, xpMaximoQuiz - xpTotalGanho)

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

  // Remover nível de dificuldade do título (iniciante, intermediário, avançado)
  const tituloLimpo = quiz.titulo
    .replace(/\s*-\s*(Iniciante|Intermediário|Intermediario|Avançado|Avancado)$/i, '')
    .replace(/\s*\(Iniciante|Intermediário|Intermediario|Avançado|Avancado\)$/i, '')
    .trim()
  
  // Registrar XP ganho
  await insertXpEntry({
    userId: params.userId,
    source: 'quiz',
    sourceId: params.quizId,
    amount: xpGanho,
    description: `Quiz concluído: ${tituloLimpo} (${params.pontuacao}% - tentativa ${newTentativas})`,
    accessToken: params.accessToken,
  })

  return { 
    awarded: true as const, 
    xp: xpGanho, 
    xpRemanescente: xpRemanescente - xpGanho,
    tentativas: newTentativas, 
    melhorPontuacao: bestScore 
  }
}

export async function responderComunidade(params: { userId: string; perguntaId: string; conteudo: string; accessToken?: string }) {
  // Usar getSupabaseClient com accessToken para que RLS funcione corretamente
  const { getSupabaseClient } = await import('./getSupabaseClient')
  const { extractMentions } = await import('@/lib/mentionParser')
  const supabase = await getSupabaseClient(params.accessToken)

  const mentions = extractMentions(params.conteudo)
  const userMentions: string[] = []
  const mentionedUsers: Array<{ id: string; name: string }> = []

  if (mentions.length > 0) {
    let query = supabase
      .from('users')
      .select('id, name')

    const conditions = mentions.map((m) => `name.ilike.%${m}%`).join(',')
    if (conditions) {
      query = query.or(conditions)
    }

    const { data: users, error: usersError } = await query

    if (!usersError && users) {
      const mentionSet = new Set(mentions.map(m => m.toLowerCase()))
      const matchedUsers = users.filter(u =>
        mentionSet.has(u.name.toLowerCase())
      )
      userMentions.push(...matchedUsers.map((u) => u.id))
      mentionedUsers.push(...matchedUsers)
    }
  }

  const { data: resposta, error: respostaError } = await supabase
    .from('respostas')
    .insert({
      pergunta_id: params.perguntaId,
      autor_id: params.userId,
      conteudo: params.conteudo,
      mencoes: userMentions.length > 0 ? userMentions : null,
    })
    .select('id')
    .single()

  if (respostaError) throw respostaError

  // Dar 1 XP ao responder (valor oficial)
  const xpResposta = XP_CONSTANTS.comunidade.resposta
  
  // Tentar inserir XP, mas não falhar se der erro (resposta já foi criada)
  try {
    await insertXpEntry({
      userId: params.userId,
      source: 'comunidade',
      sourceId: resposta.id,
      amount: xpResposta,
      description: 'Resposta criada na comunidade',
      accessToken: params.accessToken,
    })
  } catch {
    // Resposta já criada; XP pode ser concedido manualmente se necessário
  }

  if (mentionedUsers.length > 0 && resposta.id) {
    try {
      // Usar o mesmo supabase client (já tem accessToken) para criar notificações
      const agora = new Date()
      const dataFim = new Date()
      dataFim.setDate(dataFim.getDate() + 7) // Notificação válida por 7 dias

      // Buscar dados do autor
      const { data: autor, error: autorError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', params.userId)
        .single()

      const autorNome = autor?.name || 'Alguém'
      const actionUrl = `/aluno/comunidade/pergunta/${params.perguntaId}`

      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id === params.userId) continue

        const { data: notifData, error: notifError } = await supabase
          .from('notificacoes')
          .insert({
            titulo: '💬 Você foi mencionado',
            mensagem: `${autorNome} mencionou você em uma resposta.`,
            tipo: 'info',
            data_inicio: agora.toISOString(),
            data_fim: dataFim.toISOString(),
            publico_alvo: 'todos',
            target_user_id: mentionedUser.id,
            action_url: actionUrl,
            created_by: null,
          })
          .select('id, target_user_id')

        // Erro ao criar notificação não falha a resposta
        if (notifError) {
          // silenciar
        }
      }
    } catch {
      // Não falhar a criação da resposta se notificação falhar
    }
  }

  return { awarded: true as const, respostaId: resposta.id, xp: xpResposta }
}

export async function getRanking(params: { type: RankingType; limit?: number; accessToken?: string }) {
  const limit = params.limit || 50

  // Tentar usar admin primeiro (se disponível) - sempre preferir service role key
  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (adminError) {
    // Se não tiver service role key, usar anon key
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      throw new Error('Supabase não configurado')
    }

    supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: params.accessToken ? {
          Authorization: `Bearer ${params.accessToken}`
        } : {},
      },
    })
  }

  if (params.type === 'mensal') {
    // Ranking mensal: calcular XP do mês atual a partir de user_xp_history (não usar users.xp_mensal)
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth() + 1
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    const startIso = startOfMonth.toISOString()
    const endIso = endOfMonth.toISOString()

    const { data: xpHistory, error: xpError } = await supabase
      .from('user_xp_history')
      .select('user_id, amount')
      .gte('created_at', startIso)
      .lte('created_at', endIso)

    if (xpError) throw xpError

    const xpMensalPorUsuario = new Map<string, number>()
    if (xpHistory && xpHistory.length > 0) {
      for (const entry of xpHistory) {
        const current = xpMensalPorUsuario.get(entry.user_id) || 0
        xpMensalPorUsuario.set(entry.user_id, current + (entry.amount || 0))
      }
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id,name,level,xp,avatar_url')
      .in('role', ['aluno', 'formacao'])
      .eq('access_level', 'full')

    if (usersError) throw usersError

    const comXpMensal = (users || []).map((u) => ({
      ...u,
      xp_mensal: xpMensalPorUsuario.get(u.id) || 0,
    }))
    comXpMensal.sort((a, b) => (b.xp_mensal || 0) - (a.xp_mensal || 0))
    const limited = comXpMensal.slice(0, limit)

    return limited.map((u, idx) => ({
      id: u.id,
      name: u.name,
      level: u.level,
      xp: u.xp,
      xp_mensal: u.xp_mensal ?? 0,
      avatar_url: u.avatar_url,
      position: idx + 1,
    }))
  }

  // Ranking geral: ordenar por users.xp
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id,name,level,xp,xp_mensal,avatar_url')
    .in('role', ['aluno', 'formacao'])
    .eq('access_level', 'full')
    .order('xp', { ascending: false })
    .limit(limit)

  if (usersError) {
    if (usersError.code === 'PGRST301' || usersError.message?.includes('permission') || usersError.message?.includes('RLS')) {
      throw new Error(
        'Erro de permissão ao buscar ranking. ' +
        'Configure SUPABASE_SERVICE_ROLE_KEY ou ajuste as políticas RLS. ' +
        `Detalhes: ${usersError.message}`
      )
    }

    throw usersError
  }

  return (users || []).map((u, idx) => ({
    id: u.id,
    name: u.name,
    level: u.level,
    xp: u.xp,
    xp_mensal: u.xp_mensal ?? 0,
    avatar_url: u.avatar_url,
    position: idx + 1,
  }))
}


