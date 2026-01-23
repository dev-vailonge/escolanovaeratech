import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { invalidateRankingCache } from '@/lib/server/rankingCache'
import { XP_CONSTANTS } from '@/lib/gamification/constants'

/**
 * DELETE /api/comunidade/respostas/[id]/delete
 * 
 * REGRAS DE NEGÓCIO:
 * - Apenas o autor da resposta pode deletá-la
 * - Não pode deletar se for a melhor resposta (resposta certa)
 * - Não pode deletar se tiver comentários
 * - Ao deletar, reverte o XP ganho:
 *   - Se for melhor resposta: perde 100 XP (respostaCerta)
 *   - Se for resposta normal: perde 1 XP (resposta)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const respostaId = params.id
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    if (!respostaId) {
      return NextResponse.json({ error: 'ID da resposta inválido' }, { status: 400 })
    }

    // Buscar a resposta
    const { data: resposta, error: respostaError } = await supabase
      .from('respostas')
      .select('id, autor_id, pergunta_id, melhor_resposta, resposta_pai_id')
      .eq('id', respostaId)
      .single()

    if (respostaError || !resposta) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 })
    }

    // Verificar se o usuário é o autor
    if (resposta.autor_id !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar esta resposta' },
        { status: 403 }
      )
    }

    // Verificar se é melhor resposta (não pode deletar)
    if (resposta.melhor_resposta) {
      return NextResponse.json(
        { error: 'Não é possível deletar uma resposta marcada como certa. Primeiro, desmarque-a como resposta certa.' },
        { status: 400 }
      )
    }

    // Verificar se tem comentários (respostas filhas)
    const { data: comentarios, error: comentariosError } = await supabase
      .from('respostas')
      .select('id')
      .eq('resposta_pai_id', respostaId)

    if (comentariosError) {
      console.error('Erro ao verificar comentários:', comentariosError)
      return NextResponse.json(
        { error: 'Erro ao verificar comentários' },
        { status: 500 }
      )
    }

    if (comentarios && comentarios.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar uma resposta que possui comentários. Delete os comentários primeiro.' },
        { status: 400 }
      )
    }

    // Buscar histórico de XP para esta resposta
    const { data: xpHistory, error: xpError } = await supabase
      .from('user_xp_history')
      .select('id, amount, description')
      .eq('user_id', userId)
      .eq('source', 'comunidade')
      .eq('source_id', respostaId)

    if (xpError) {
      console.error('Erro ao buscar histórico de XP:', xpError)
    }

    // Calcular XP total a ser revertido
    const xpTotal = (xpHistory || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)

    // Deletar a resposta
    const { error: deleteError } = await supabase
      .from('respostas')
      .delete()
      .eq('id', respostaId)

    if (deleteError) {
      console.error('Erro ao deletar resposta:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar resposta' },
        { status: 500 }
      )
    }

    // Reverter XP se houver
    if (xpTotal > 0) {
      try {
        // Buscar XP atual do usuário
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('xp, xp_mensal')
          .eq('id', userId)
          .single()

        if (!userError && user) {
          // Calcular novos valores
          const novoXP = Math.max(0, (user.xp || 0) - xpTotal)
          const novoXPMensal = Math.max(0, (user.xp_mensal || 0) - xpTotal)

          // Atualizar XP do usuário
          await supabase
            .from('users')
            .update({
              xp: novoXP,
              xp_mensal: novoXPMensal,
            })
            .eq('id', userId)

          // Deletar entradas do histórico de XP relacionadas a esta resposta
          if (xpHistory && xpHistory.length > 0) {
            await supabase
              .from('user_xp_history')
              .delete()
              .in('id', xpHistory.map(e => e.id))
          }

          // Invalidar cache do ranking
          invalidateRankingCache()

          console.log(`✅ XP revertido: ${xpTotal} XP removido do usuário ${userId}`)
        }
      } catch (xpRevertError) {
        console.error('Erro ao reverter XP:', xpRevertError)
        // Continuar mesmo com erro - a resposta já foi deletada
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Resposta deletada com sucesso',
      xpRevertido: xpTotal,
    })
  } catch (error: any) {
    console.error('Erro ao deletar resposta:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: error?.message || 'Erro ao deletar resposta' },
      { status: 500 }
    )
  }
}
