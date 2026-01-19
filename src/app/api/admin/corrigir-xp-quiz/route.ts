import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

/**
 * API para corrigir XP de quizzes afetados pelo bug
 * 
 * Endpoint: POST /api/admin/corrigir-xp-quiz
 * 
 * Body (opcional):
 * - email: string - Email do usuário específico (se não fornecido, corrige todos)
 * - dryRun: boolean - Se true, apenas mostra o que seria corrigido sem fazer alterações
 * 
 * Retorna:
 * - casosAfetados: Array de casos que precisam de correção
 * - correcoesAplicadas: Array de correções aplicadas (se dryRun = false)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const userId = await requireUserIdFromBearer(request)
    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se o usuário é admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas admins podem executar esta ação.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { email, dryRun = false } = body

    // Buscar casos afetados
    // Primeiro buscar progressos (incluindo updated_at para usar como data original)
    let progressQuery = supabaseAdmin
      .from('user_quiz_progress')
      .select('user_id, quiz_id, melhor_pontuacao, tentativas, updated_at')
      .eq('completo', true)
      .eq('tentativas', 1)
      .not('melhor_pontuacao', 'is', null)

    const { data: progressos, error: progressError } = await progressQuery

    if (progressError) {
      console.error('Erro ao buscar progressos:', progressError)
      return NextResponse.json({ error: 'Erro ao buscar progressos' }, { status: 500 })
    }

    if (!progressos || progressos.length === 0) {
      return NextResponse.json({ 
        casosAfetados: [],
        correcoesAplicadas: [],
        message: 'Nenhum caso afetado encontrado'
      })
    }

    // Buscar usuários e quizzes em batch
    const userIds = [...new Set(progressos.map(p => p.user_id))]
    const quizIds = [...new Set(progressos.map(p => p.quiz_id))]

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .in('id', userIds)
      .eq('role', 'aluno')

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    const { data: quizzes, error: quizzesError } = await supabaseAdmin
      .from('quizzes')
      .select('id, titulo, xp')
      .in('id', quizIds)

    if (quizzesError) {
      console.error('Erro ao buscar quizzes:', quizzesError)
      return NextResponse.json({ error: 'Erro ao buscar quizzes' }, { status: 500 })
    }

    // Criar maps para lookup rápido
    const usersMap = new Map(users?.map(u => [u.id, u]) || [])
    const quizzesMap = new Map(quizzes?.map(q => [q.id, q]) || [])

    // Filtrar por email se fornecido
    let progressosFiltrados = progressos
    if (email) {
      progressosFiltrados = progressos.filter(p => {
        const user = usersMap.get(p.user_id)
        return user?.email === email
      })
    }

    if (progressosFiltrados.length === 0) {
      return NextResponse.json({ 
        casosAfetados: [],
        correcoesAplicadas: [],
        message: email ? `Nenhum caso afetado encontrado para ${email}` : 'Nenhum caso afetado encontrado'
      })
    }

    // Para cada progresso, verificar XP ganho vs XP esperado
    const casosAfetados = []
    const correcoesAplicadas = []

    for (const progresso of progressosFiltrados) {
      const user = usersMap.get(progresso.user_id)
      const quiz = quizzesMap.get(progresso.quiz_id)

      if (!user || !quiz) continue

      const quizId = progresso.quiz_id
      const melhorPontuacao = progresso.melhor_pontuacao
      const xpMaximo = quiz.xp || 20

      // Calcular XP esperado
      const xpEsperado = Math.round((melhorPontuacao / 100) * xpMaximo)

      // Buscar XP já ganho deste quiz específico
      const { data: xpHistory, error: xpError } = await supabaseAdmin
        .from('user_xp_history')
        .select('amount, source_id')
        .eq('user_id', progresso.user_id)
        .eq('source', 'quiz')
        .eq('source_id', quizId)

      if (xpError) {
        console.error(`Erro ao buscar XP para quiz ${quizId}:`, xpError)
        continue
      }

      // Calcular XP já ganho (apenas do quiz correto)
      let xpJaGanho = (xpHistory || []).reduce((sum, entry) => {
        const entrySourceId = entry.source_id?.toString() || ''
        const quizIdStr = quizId.toString()
        if (entrySourceId === quizIdStr) {
          return sum + (entry.amount || 0)
        }
        return sum
      }, 0)

      // Verificar se precisa de correção
      if (xpJaGanho < xpEsperado) {
        const xpFaltante = xpEsperado - xpJaGanho

        casosAfetados.push({
          userId: progresso.user_id,
          userName: user.name,
          userEmail: user.email,
          quizId: quizId,
          quizTitulo: quiz.titulo,
          melhorPontuacao: melhorPontuacao,
          xpJaGanho: xpJaGanho,
          xpEsperado: xpEsperado,
          xpFaltante: xpFaltante
        })

        // Aplicar correção se não for dry run
        if (!dryRun) {
          // Buscar a data original do quiz (quando foi completado)
          // Usar updated_at do progresso como data original
          let dataOriginal = progresso.updated_at
          
          // Se não tiver updated_at, usar a data atual (mas isso não é ideal)
          if (!dataOriginal) {
            // Tentar buscar a primeira entrada de XP do quiz
            const { data: primeiraEntrada } = await supabaseAdmin
              .from('user_xp_history')
              .select('created_at')
              .eq('user_id', progresso.user_id)
              .eq('source', 'quiz')
              .eq('source_id', quizId)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle()
            
            if (primeiraEntrada?.created_at) {
              dataOriginal = primeiraEntrada.created_at
            } else {
              // Se não houver entrada, usar a data atual (será ajustada para janeiro se necessário)
              dataOriginal = new Date().toISOString()
            }
          }

          // Verificar se já existe uma entrada de XP para este quiz (não correção)
          const { data: existingEntry } = await supabaseAdmin
            .from('user_xp_history')
            .select('id, amount, created_at')
            .eq('user_id', progresso.user_id)
            .eq('source', 'quiz')
            .eq('source_id', quizId)
            .not('description', 'ilike', '%Correção%')
            .maybeSingle()

          // Se não existe entrada original E o XP esperado é maior que 0, criar entrada original
          // O XP original seria o que foi ganho na primeira tentativa (4 XP no caso)
          if (!existingEntry && xpEsperado > 0) {
            // Calcular XP original (o que foi ganho na primeira tentativa)
            // Se xpEsperado = 8 e xpFaltante = 4, então xpOriginal = 4
            const xpOriginal = xpEsperado - xpFaltante
            
            if (xpOriginal > 0) {
              // Criar entrada original do quiz
              const { error: insertOriginalError } = await supabaseAdmin
                .from('user_xp_history')
                .insert({
                  user_id: progresso.user_id,
                  source: 'quiz',
                  source_id: quizId,
                  amount: xpOriginal,
                  description: `Quiz concluído: ${quiz.titulo} (${melhorPontuacao}% - tentativa 1)`,
                  created_at: dataOriginal
                })

              if (insertOriginalError) {
                console.error(`Erro ao inserir entrada original para ${user.email}:`, insertOriginalError)
              } else {
                console.log(`✅ Entrada original criada para ${user.email} - quiz ${quiz.titulo}: ${xpOriginal} XP`)
                // Atualizar xpJaGanho para refletir a entrada criada
                xpJaGanho = xpOriginal
              }
            }
          }

          // Verificar se já existe uma correção
          const { data: existingCorrection } = await supabaseAdmin
            .from('user_xp_history')
            .select('id')
            .eq('user_id', progresso.user_id)
            .eq('source', 'quiz')
            .eq('source_id', quizId)
            .ilike('description', '%Correção: XP adicional%')
            .maybeSingle()

          if (!existingCorrection && xpFaltante > 0) {
            // Inserir correção com a data original do quiz
            // Isso fará com que o XP seja contado no ranking mensal correto
            const { data: inserted, error: insertError } = await supabaseAdmin
              .from('user_xp_history')
              .insert({
                user_id: progresso.user_id,
                source: 'quiz',
                source_id: quizId,
                amount: xpFaltante,
                description: `Correção: XP adicional para quiz "${quiz.titulo}" (pontuação: ${melhorPontuacao}% - primeira tentativa)`,
                created_at: dataOriginal
              })
              .select()
              .single()

            if (insertError) {
              console.error(`Erro ao inserir correção para ${user.email}:`, insertError)
              continue
            }

            correcoesAplicadas.push({
              userId: progresso.user_id,
              userEmail: user.email,
              quizTitulo: quiz.titulo,
              xpAdicionado: xpFaltante,
              xpHistoryId: inserted.id
            })
          } else if (existingCorrection) {
            console.log(`Correção já existe para ${user.email} - quiz ${quiz.titulo}`)
          }
        }
      }
    }

    // Se não for dry run e houver correções, atualizar XP total dos usuários
    if (!dryRun && correcoesAplicadas.length > 0) {
      const userIds = [...new Set(correcoesAplicadas.map(c => c.userId))]

      for (const userId of userIds) {
        // Calcular XP total
        const { data: allXp, error: xpError } = await supabaseAdmin
          .from('user_xp_history')
          .select('amount')
          .eq('user_id', userId)

        if (xpError) {
          console.error(`Erro ao calcular XP total para usuário ${userId}:`, xpError)
          continue
        }

        const xpTotal = (allXp || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)

        // Calcular XP mensal de janeiro 2025 (mês do ranking atual)
        // IMPORTANTE: O ranking mensal mostra janeiro até o mês fechar
        const agora = new Date()
        const anoAtual = agora.getFullYear()
        // Se estamos em janeiro, usar janeiro. Se não, usar o mês atual do ranking
        // Por padrão, vamos calcular janeiro 2025 (mês do ranking que o usuário está vendo)
        const mesRanking = 1 // Janeiro
        const anoRanking = 2025
        
        const { data: xpMensalData, error: xpMensalError } = await supabaseAdmin
          .from('user_xp_history')
          .select('amount, created_at')
          .eq('user_id', userId)

        if (xpMensalError) {
          console.error(`Erro ao calcular XP mensal para usuário ${userId}:`, xpMensalError)
        }

        const xpMensal = (xpMensalData || []).reduce((sum, entry) => {
          const entryDate = new Date(entry.created_at)
          const entryYear = entryDate.getFullYear()
          const entryMonth = entryDate.getMonth() + 1
          
          // Somar apenas XP de janeiro 2025 (mês do ranking)
          if (entryYear === anoRanking && entryMonth === mesRanking) {
            return sum + (entry.amount || 0)
          }
          return sum
        }, 0)

        // Atualizar XP total e XP mensal do usuário
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            xp: xpTotal,
            xp_mensal: xpMensal
          })
          .eq('id', userId)

        if (updateError) {
          console.error(`Erro ao atualizar XP para usuário ${userId}:`, updateError)
        } else {
          console.log(`✅ XP atualizado para usuário ${userId}: total=${xpTotal}, mensal=${xpMensal}`)
        }
      }
    }

    return NextResponse.json({
      dryRun,
      totalCasosAfetados: casosAfetados.length,
      totalCorrecoesAplicadas: correcoesAplicadas.length,
      casosAfetados,
      correcoesAplicadas: dryRun ? [] : correcoesAplicadas,
      message: dryRun 
        ? `Encontrados ${casosAfetados.length} casos que precisam de correção (dry run)`
        : `${correcoesAplicadas.length} correções aplicadas com sucesso`
    })

  } catch (error: any) {
    console.error('Erro ao corrigir XP:', error)
    return NextResponse.json({ 
      error: 'Erro ao corrigir XP',
      details: error.message 
    }, { status: 500 })
  }
}
