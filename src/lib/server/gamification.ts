import { XP_CONSTANTS } from '@/lib/gamification/constants'
import { calculateLevel } from '@/lib/gamification'
import { getSupabaseClient } from './getSupabaseClient'
import { getSupabaseAdmin } from './supabaseAdmin'

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

  if (userError || !user) {
    console.warn('⚠️ Não foi possível buscar XP do usuário para sincronizar nível:', userError)
    return
  }

  // Calcular nível correto
  const correctLevel = calculateLevel(user.xp || 0)

  // Atualizar apenas se necessário
  if (user.level !== correctLevel) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ level: correctLevel })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Erro ao atualizar nível do usuário:', updateError)
    } else {
      console.log(`✅ Nível do usuário ${userId} atualizado de ${user.level} para ${correctLevel}`)
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
  
  console.log(`📤 [insertXpEntry] Inserindo XP: userId=${params.userId}, source=${params.source}, amount=${params.amount}, sourceId=${params.sourceId}`)
  
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
      console.log(`✅ [insertXpEntry] XP inserido com sucesso via RPC:`, rpcData)
      // Atualizar nível automaticamente após inserir XP
      await syncUserLevel(params.userId, params.accessToken)
      return
    }

    // Se RPC falhar, tentar INSERT direto (fallback para caso a função não exista)
    console.log(`⚠️ [insertXpEntry] RPC falhou, tentando INSERT direto:`, rpcError?.message)
  } catch (rpcError: any) {
    console.log(`⚠️ [insertXpEntry] Erro ao chamar RPC, tentando INSERT direto:`, rpcError?.message)
  }
  
  // Fallback: INSERT direto (funciona quando user_id = auth.uid())
  const { data, error } = await supabase.from('user_xp_history').insert({
    user_id: params.userId,
    source: params.source,
    source_id: params.sourceId,
    amount: params.amount,
    description: params.description || null,
  }).select()

  if (error) {
    console.error(`❌ [insertXpEntry] Erro ao inserir XP:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    throw error
  }

  console.log(`✅ [insertXpEntry] XP inserido com sucesso:`, data?.[0]?.id)

  // Atualizar nível automaticamente após inserir XP
  await syncUserLevel(params.userId, params.accessToken)
}


export async function completarDesafio(params: { userId: string; desafioId: string; accessToken?: string }) {
  const supabase = await getSupabaseClient(params.accessToken)

  // Tentar usar função SQL com SECURITY DEFINER primeiro (permite admins completarem desafios para alunos)
  console.log(`🔍 [completarDesafio] Tentando chamar função SQL complete_desafio_for_user para userId=${params.userId}, desafioId=${params.desafioId}`)
  
  let rpcErrorInfo: any = null
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('complete_desafio_for_user', {
      p_user_id: params.userId,
      p_desafio_id: params.desafioId,
    })

    console.log(`📊 [completarDesafio] Resposta RPC - data:`, rpcData, `error:`, rpcError, `data type:`, typeof rpcData, `error type:`, typeof rpcError)

    if (!rpcError && rpcData) {
      console.log(`✅ [completarDesafio] Desafio completado com sucesso via RPC para usuário ${params.userId}`)
      // Atualizar nível automaticamente após inserir XP
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
        message: 'Função RPC retornou null/undefined (função não existe ou não retornou valor)',
        code: 'RPC_NO_DATA',
        details: `rpcData: ${rpcData}, rpcError: ${rpcError}`,
        hint: 'Verifique se a função complete_desafio_for_user existe no banco de dados',
      }
      console.error(`❌ [completarDesafio] RPC falhou - error:`, rpcErrorInfo)
      console.log(`⚠️ [completarDesafio] RPC falhou, tentando método direto`)
    }
  } catch (rpcError: any) {
    // Se a função não existe ou retornar erro esperado (já recebeu XP), tratar
    rpcErrorInfo = {
      message: rpcError?.message,
      code: rpcError?.code,
      stack: rpcError?.stack,
    }
    console.error(`❌ [completarDesafio] Exceção ao chamar RPC:`, rpcErrorInfo)
    if (rpcError?.message?.includes('já recebeu XP')) {
      console.log(`⚠️ [completarDesafio] Usuário já recebeu XP para este desafio`)
      return { awarded: false as const, reason: 'already_received_xp' as const, xp: 0, rpcError: rpcErrorInfo }
    }
    console.log(`⚠️ [completarDesafio] Erro ao chamar RPC, tentando método direto:`, rpcError?.message)
  }

  // Fallback: método direto (funciona quando user_id = auth.uid())
  // Se chegou aqui, a função RPC falhou - tentar método direto
  console.log(`⚠️ [completarDesafio] Usando fallback (método direto) - RPC não funcionou`)
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
    console.log(`✅ [completarDesafio] XP concedido com sucesso: ${xpDesafio} XP para usuário ${params.userId}`)
  } catch (xpError: any) {
    console.error(`❌ [completarDesafio] Erro ao inserir XP:`, xpError)
    throw xpError // Relança o erro para que a rota de aprovação possa tratá-lo
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

  if (xpHistoryError) {
    console.error(`❌ [completarQuiz] Erro ao buscar histórico de XP:`, xpHistoryError)
    throw xpHistoryError
  }

  // Log detalhado do histórico encontrado
  console.log(`🔍 [completarQuiz] Histórico de XP encontrado:`, {
    quizId: params.quizId,
    quizIdType: typeof params.quizId,
    totalEntries: xpHistory?.length || 0,
    entries: xpHistory?.map(e => ({
      id: e.id,
      source_id: e.source_id,
      source_id_type: typeof e.source_id,
      amount: e.amount,
      description: e.description,
      created_at: e.created_at
    })) || []
  })

  // Calcular XP total já ganho
  // IMPORTANTE: Filtrar apenas entradas onde source_id corresponde EXATAMENTE ao quizId
  // Isso previne bugs onde XP de outros quizzes seja contado incorretamente
  let entradasFiltradas = 0
  const xpTotalGanho = (xpHistory || []).reduce((sum, entry) => {
    // Verificar se o source_id realmente corresponde ao quizId
    // Comparar como string para garantir matching correto
    const entrySourceId = entry.source_id?.toString() || ''
    const quizIdStr = params.quizId.toString()
    const sourceIdMatch = entrySourceId === quizIdStr
    
    if (!sourceIdMatch) {
      entradasFiltradas++
      console.warn(`⚠️ [completarQuiz] source_id não corresponde ao quizId - IGNORANDO entrada:`, {
        entry_source_id: entry.source_id,
        entry_source_id_str: entrySourceId,
        quizId: params.quizId,
        quizId_str: quizIdStr,
        entry: entry
      })
      // NÃO somar esta entrada - ela não pertence a este quiz
      return sum
    }
    
    // Somar apenas se source_id corresponder exatamente
    return sum + (entry.amount || 0)
  }, 0)
  
  if (entradasFiltradas > 0) {
    console.warn(`⚠️ [completarQuiz] ${entradasFiltradas} entradas de XP foram filtradas (source_id não corresponde ao quizId)`)
  }
  
  // Calcular XP remanescente (limite máximo oficial de 20 XP menos o que já foi ganho)
  const xpRemanescente = Math.max(0, xpMaximoQuiz - xpTotalGanho)
  
  // Log detalhado para debug
  console.log(`📊 [completarQuiz] Cálculo de XP:`, {
    userId: params.userId,
    quizId: params.quizId,
    pontuacao: params.pontuacao,
    xpMaximoQuiz,
    xpHistoryEntries: xpHistory?.length || 0,
    xpTotalGanho,
    xpRemanescente,
    historicoDetalhado: xpHistory?.map(e => e.amount) || []
  })
  
  // Se não há XP remanescente, não conceder XP
  if (xpRemanescente <= 0) {
    console.log(`⚠️ [completarQuiz] Limite de XP atingido para quiz ${params.quizId}`)
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
  
  console.log(`✅ [completarQuiz] XP calculado:`, {
    xpGanho,
    calculo: `(${params.pontuacao}% / 100) * ${xpRemanescente} = ${xpGanho}`,
    novoXpTotal: xpTotalGanho + xpGanho
  })
  
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

  // Extrair e validar menções
  const mentions = extractMentions(params.conteudo)
  console.log('🔍 [responderComunidade] Menções extraídas:', mentions)
  const userMentions: string[] = []
  const mentionedUsers: Array<{ id: string; name: string }> = []

  if (mentions.length > 0) {
    // Buscar usuários mencionados (case-insensitive)
    let query = supabase
      .from('users')
      .select('id, name')
    
    const conditions = mentions.map((m) => `name.ilike.%${m}%`).join(',')
    if (conditions) {
      query = query.or(conditions)
    }
    
    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('❌ [responderComunidade] Erro ao buscar usuários:', usersError)
    }

    console.log('👥 [responderComunidade] Usuários encontrados na busca:', users?.length || 0)

    if (users) {
      // Filtrar para pegar apenas matches exatos (ignorando case)
      const mentionSet = new Set(mentions.map(m => m.toLowerCase()))
      const matchedUsers = users.filter(u => 
        mentionSet.has(u.name.toLowerCase())
      )
      console.log('✅ [responderComunidade] Usuários matched:', matchedUsers.map(u => `${u.name} (${u.id})`))
      userMentions.push(...matchedUsers.map((u) => u.id))
      mentionedUsers.push(...matchedUsers)
    }
  }

  console.log('📝 [responderComunidade] Total de usuários mencionados:', mentionedUsers.length)

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

  if (respostaError) {
    console.error('Erro ao criar resposta:', respostaError)
    throw respostaError
  }

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
  } catch (xpError: any) {
    console.error('Erro ao inserir XP (resposta já criada):', xpError)
    // Não falhar - a resposta já foi criada com sucesso
    // O XP pode ser concedido manualmente ou via outro mecanismo
  }

  // Criar notificações para usuários mencionados
  console.log('🔔 [responderComunidade] Verificando se deve criar notificações...', {
    mentionedUsersLength: mentionedUsers.length,
    respostaId: resposta.id
  })
  
  if (mentionedUsers.length > 0 && resposta.id) {
    console.log('🔔 [responderComunidade] Criando notificações para', mentionedUsers.length, 'usuário(s)')
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

      if (autorError) {
        console.error('❌ [responderComunidade] Erro ao buscar autor:', autorError)
      }

      const autorNome = autor?.name || 'Alguém'
      console.log('👤 [responderComunidade] Nome do autor:', autorNome)
      const actionUrl = `/aluno/comunidade/pergunta/${params.perguntaId}`

      for (const mentionedUser of mentionedUsers) {
        // Não notificar o próprio autor
        if (mentionedUser.id === params.userId) {
          console.log('⏭️ [responderComunidade] Pulando notificação para próprio autor:', mentionedUser.id)
          continue
        }

        console.log(`📤 [responderComunidade] Criando notificação para ${mentionedUser.name} (${mentionedUser.id})`)
        console.log(`📋 [responderComunidade] Dados da notificação:`, {
          titulo: '💬 Você foi mencionado',
          mensagem: `${autorNome} mencionou você em uma resposta.`,
          target_user_id: mentionedUser.id,
          autor_id: params.userId,
          autor_nome: autorNome
        })
        
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

        if (notifError) {
          console.error(`❌ [responderComunidade] Erro ao criar notificação para usuário ${mentionedUser.id}:`, notifError)
          console.error('❌ [responderComunidade] Detalhes do erro:', JSON.stringify(notifError, null, 2))
          console.error('❌ [responderComunidade] Código do erro:', notifError.code)
          console.error('❌ [responderComunidade] Mensagem:', notifError.message)
        } else {
          console.log(`✅ [responderComunidade] Notificação criada com sucesso!`, {
            notificacao_id: notifData?.[0]?.id,
            target_user_id: notifData?.[0]?.target_user_id,
            usuario_mentionado: mentionedUser.name
          })
        }
      }
    } catch (notifErr: any) {
      // Não falhar a criação da resposta se notificação falhar
      console.error('❌ [responderComunidade] Erro ao criar notificações de menção:', notifErr)
      console.error('❌ [responderComunidade] Stack trace:', notifErr?.stack)
    }
  } else {
    console.log('⚠️ [responderComunidade] Não criando notificações:', {
      mentionedUsersLength: mentionedUsers.length,
      respostaId: resposta.id,
      reason: mentionedUsers.length === 0 ? 'Nenhum usuário mencionado' : 'Resposta ID não disponível'
    })
  }

  return { awarded: true as const, respostaId: resposta.id, xp: xpResposta }
}

export async function getRanking(params: { type: RankingType; limit?: number; accessToken?: string }) {
  const limit = params.limit || 50

  // Tentar usar admin primeiro (se disponível) - sempre preferir service role key
  let supabase
  try {
    supabase = getSupabaseAdmin()
    console.log('[getRanking] Usando Supabase Admin (service role key)')
  } catch (adminError) {
    // Se não tiver service role key, usar anon key
    // IMPORTANTE: Isso pode falhar se RLS estiver habilitado na tabela users
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !anonKey) {
      throw new Error('Supabase não configurado')
    }
    
    console.log('[getRanking] Usando Supabase com anon key (pode ter limitações RLS)')
    
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

    // Se tiver token do usuário, definir na sessão
    if (params.accessToken) {
      try {
        await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: '', // Não temos refresh token aqui
        } as any)
      } catch (sessionError) {
        console.warn('[getRanking] Erro ao definir sessão com token:', sessionError)
      }
    }
  }

  // Query otimizada: apenas campos necessários, ordenado pelo XP, com limite
  const orderColumn = params.type === 'mensal' ? 'xp_mensal' : 'xp'
  
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id,name,level,xp,xp_mensal,avatar_url')
    .in('role', ['aluno', 'admin'])
    .eq('access_level', 'full')
    .order(orderColumn, { ascending: false })
    .limit(limit)

  if (usersError) {
    const errorDetails = {
      message: usersError.message,
      details: usersError.details,
      hint: usersError.hint,
      code: usersError.code,
    }
    console.error('Erro ao buscar ranking do Supabase:', errorDetails)
    
    // Se for erro de permissão (RLS), dar mensagem mais clara
    if (usersError.code === 'PGRST301' || usersError.message?.includes('permission') || usersError.message?.includes('RLS')) {
      throw new Error(
        'Erro de permissão ao buscar ranking. ' +
        'Configure SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente da Vercel ' +
        'ou ajuste as políticas RLS no Supabase para permitir leitura pública da tabela users. ' +
        `Detalhes: ${usersError.message}`
      )
    }
    
    throw usersError
  }
  
  console.log(`[getRanking] Ranking ${params.type} encontrado: ${users?.length || 0} usuários`)
  
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


