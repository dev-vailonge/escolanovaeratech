import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

const XP_PENALIDADE = 20 // XP perdido ao desistir

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const { id: desafioId } = await params

    if (!desafioId) {
      return NextResponse.json({ error: 'ID do desafio é obrigatório' }, { status: 400 })
    }

    // Obter accessToken e criar cliente Supabase
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se o desafio foi atribuído ao usuário
    const { data: atribuicao } = await supabase
      .from('user_desafio_atribuido')
      .select('id')
      .eq('user_id', userId)
      .eq('desafio_id', desafioId)
      .single()

    if (!atribuicao) {
      return NextResponse.json({ error: 'Desafio não encontrado para este usuário' }, { status: 404 })
    }

    // Verificar se já tem submissão
    const { data: submissaoExistente } = await supabase
      .from('desafio_submissions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('desafio_id', desafioId)
      .single()

    // Se já foi aprovado, não pode desistir
    if (submissaoExistente?.status === 'aprovado') {
      return NextResponse.json({ error: 'Não é possível desistir de um desafio já aprovado' }, { status: 400 })
    }

    // Se já desistiu, não pode desistir de novo
    if (submissaoExistente?.status === 'desistiu') {
      return NextResponse.json({ error: 'Você já desistiu deste desafio' }, { status: 400 })
    }

    // Deletar a submissão se existir (limpa histórico)
    if (submissaoExistente) {
      await supabase
        .from('desafio_submissions')
        .delete()
        .eq('id', submissaoExistente.id)
    }

    // Remover atribuição do desafio ao usuário (sai da lista "Meus Desafios")
    await supabase
      .from('user_desafio_atribuido')
      .delete()
      .eq('user_id', userId)
      .eq('desafio_id', desafioId)

    // Buscar XP atual do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('xp, xp_mensal')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Erro ao buscar XP do usuário:', userError)
    }

    const xpAtual = userData?.xp || 0
    const xpMensalAtual = userData?.xp_mensal || 0
    const novoXp = Math.max(0, xpAtual - XP_PENALIDADE)
    const novoXpMensal = Math.max(0, xpMensalAtual - XP_PENALIDADE)

    // Atualizar XP na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        xp: novoXp,
        xp_mensal: novoXpMensal,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Erro ao atualizar XP:', updateError)
      // Continua mesmo com erro - o desafio já foi marcado como desistiu
    }

    // Registrar no histórico de XP (para auditoria)
    await supabase
      .from('user_xp_history')
      .insert({
        user_id: userId,
        amount: -XP_PENALIDADE,
        source: 'desafio_desistencia',
        source_id: desafioId,
        description: 'Desistência de desafio'
      })

    return NextResponse.json({
      success: true,
      message: `Você desistiu do desafio e perdeu ${XP_PENALIDADE} XP.`,
      xp_perdido: XP_PENALIDADE,
      xp_anterior: xpAtual,
      xp_atual: novoXp
    })

  } catch (error: any) {
    console.error('Erro ao desistir do desafio:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao desistir do desafio' },
      { status: 500 }
    )
  }
}
