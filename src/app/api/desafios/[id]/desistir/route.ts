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
    const { data: submissaoExistente, error: submissaoError } = await supabase
      .from('desafio_submissions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('desafio_id', desafioId)
      .maybeSingle()

    if (submissaoError && submissaoError.code !== 'PGRST116') {
      console.error('Erro ao verificar submissão:', submissaoError)
    }

    // Se já foi aprovado, não pode desistir
    if (submissaoExistente?.status === 'aprovado') {
      return NextResponse.json({ error: 'Não é possível desistir de um desafio já aprovado' }, { status: 400 })
    }

    // Se já desistiu, não pode desistir de novo
    if (submissaoExistente?.status === 'desistiu') {
      return NextResponse.json({ error: 'Você já desistiu deste desafio' }, { status: 400 })
    }

    // Criar ou atualizar submissão com status 'desistiu'
    if (submissaoExistente) {
      // Se existe submissão (pendente ou rejeitado), atualizar para 'desistiu'
      const { error: updateError } = await supabase
        .from('desafio_submissions')
        .update({ 
          status: 'desistiu',
          admin_notes: null,
          reviewed_by: null,
          reviewed_at: null
        })
        .eq('id', submissaoExistente.id)

      if (updateError) {
        console.error('Erro ao atualizar submissão para desistiu:', updateError)
        return NextResponse.json(
          { 
            error: 'Erro ao atualizar submissão',
            debug: {
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint,
            }
          },
          { status: 500 }
        )
      }
    } else {
      // Se não existe submissão, criar uma com status 'desistiu'
      // Usar string vazia ao invés de null para github_url (coluna não aceita null)
      const { error: insertError } = await supabase
        .from('desafio_submissions')
        .insert({
          user_id: userId,
          desafio_id: desafioId,
          status: 'desistiu',
          github_url: '' // String vazia ao invés de null
        })

      if (insertError) {
        console.error('Erro ao criar submissão de desistência:', insertError)
        return NextResponse.json(
          { 
            error: 'Erro ao registrar desistência',
            debug: {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint,
            }
          },
          { status: 500 }
        )
      }
    }

    // Remover atribuição do desafio ao usuário (sai da lista "Meus Desafios")
    const { error: deleteAtribuicaoError } = await supabase
      .from('user_desafio_atribuido')
      .delete()
      .eq('user_id', userId)
      .eq('desafio_id', desafioId)
    
    if (deleteAtribuicaoError) {
      console.error('❌ Erro ao remover atribuição do desafio:', deleteAtribuicaoError)
      // Não falhar a requisição por causa disso, mas logar o erro
      // A submissão já foi criada/atualizada com status 'desistiu'
    }

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
        
        // Retornar informações de debug para o console do navegador
        const errorResponse: any = {
          error: error.message || 'Erro ao desistir do desafio',
          debug: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        }
        
        if (error.message === 'Não autenticado') {
          return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        return NextResponse.json(errorResponse, { status: 500 })
      }
}
