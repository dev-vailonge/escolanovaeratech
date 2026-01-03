import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { insertXpEntry } from '@/lib/server/gamification'
import { XP_CONSTANTS } from '@/lib/gamification/constants'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const respostaId = params.id
    if (!respostaId) {
      return NextResponse.json({ error: 'respostaId inválido' }, { status: 400 })
    }

    // Buscar a resposta e a pergunta relacionada
    const { data: resposta, error: respostaError } = await supabase
      .from('respostas')
      .select('id, pergunta_id, autor_id, melhor_resposta')
      .eq('id', respostaId)
      .single()

    if (respostaError || !resposta) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 })
    }

    // Buscar a pergunta para verificar se o usuário é o autor
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, autor_id, melhor_resposta_id, resolvida')
      .eq('id', resposta.pergunta_id)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Apenas o autor da pergunta pode marcar uma resposta como certa
    if (pergunta.autor_id !== userId) {
      return NextResponse.json(
        { error: 'Apenas o autor da pergunta pode marcar uma resposta como certa' },
        { status: 403 }
      )
    }

    // Não pode marcar sua própria resposta
    if (resposta.autor_id === userId) {
      return NextResponse.json(
        { error: 'Você não pode marcar sua própria resposta como certa' },
        { status: 400 }
      )
    }

    // Se já está marcada como melhor resposta, não permitir desmarcar
    // Uma vez marcada como válida, não pode ser desmarcada (XP já foi dado)
    const isAlreadyBest = resposta.melhor_resposta === true

    if (isAlreadyBest) {
      console.log('⚠️ [API] Resposta já está marcada como certa. Não é possível desmarcar.')
      return NextResponse.json({ 
        success: false,
        error: 'Esta resposta já está marcada como certa.',
        marcada: true
      }, { status: 400 })
    } else {
      // Se já existe outra melhor resposta, desmarcar ela
      if (pergunta.melhor_resposta_id) {
        await supabase
          .from('respostas')
          .update({ melhor_resposta: false })
          .eq('id', pergunta.melhor_resposta_id)
      }

      // Marcar esta resposta como melhor
      await supabase
        .from('respostas')
        .update({ melhor_resposta: true })
        .eq('id', respostaId)

      // Atualizar a pergunta
      await supabase
        .from('perguntas')
        .update({ melhor_resposta_id: respostaId, resolvida: true })
        .eq('id', pergunta.id)

      // Dar XP ao autor da resposta (apenas se ainda não foi dado)
      // IMPORTANTE: Verificar se já existe XP para esta resposta específica
      // Isso previne dar XP múltiplas vezes mesmo se a resposta for marcada/desmarcada várias vezes
      console.log('💰 [API] Verificando se XP já foi dado para esta resposta...')
      console.log('🔍 [API] Buscando XP:', { 
        userId: resposta.autor_id,
        source: 'comunidade',
        sourceId: respostaId
      })
      
      // Verificar se já existe XP para esta resposta específica
      // Usar COUNT para garantir que não há múltiplos registros
      const { count: xpCount, error: xpCountError } = await supabase
        .from('user_xp_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', resposta.autor_id)
        .eq('source', 'comunidade')
        .eq('source_id', respostaId)

      if (xpCountError && xpCountError.code !== 'PGRST116') {
        console.error('❌ [API] Erro ao verificar XP:', xpCountError)
      }

      // Também buscar o registro para logs
      const { data: existingXp } = await supabase
        .from('user_xp_history')
        .select('id, amount, created_at')
        .eq('user_id', resposta.autor_id)
        .eq('source', 'comunidade')
        .eq('source_id', respostaId)
        .maybeSingle()

      console.log('📊 [API] Resultado da verificação de XP:', { 
        respostaId, 
        autorId: resposta.autor_id,
        xpCount: xpCount || 0,
        temXp: !!existingXp,
        xpId: existingXp?.id,
        xpAmount: existingXp?.amount,
        xpData: existingXp?.created_at
      })

      // Buscar TODOS os registros de XP para esta resposta (pode ter múltiplos)
      const { data: todosXp } = await supabase
        .from('user_xp_history')
        .select('amount')
        .eq('user_id', resposta.autor_id)
        .eq('source', 'comunidade')
        .eq('source_id', respostaId)
      
      // Calcular XP total já dado para esta resposta
      const xpTotalJaDado = (todosXp || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)
      
      // Verificar se já foi dado XP por "resposta marcada como certa" (100 XP)
      // Procurar por entrada com descrição que indica "marcada como certa"
      const { data: xpJaDadoMarcadaCerta } = await supabase
        .from('user_xp_history')
        .select('id, amount')
        .eq('user_id', resposta.autor_id)
        .eq('source', 'comunidade')
        .eq('source_id', respostaId)
        .ilike('description', '%marcada como certa%')
        .maybeSingle()
      
      // Se já foi dado XP por "marcada como certa", não dar novamente
      if (xpJaDadoMarcadaCerta) {
        console.log('⚠️ [API] XP por resposta marcada como certa já foi dado anteriormente. Não dando novamente.')
        console.log('📝 [API] XP original foi dado em:', xpJaDadoMarcadaCerta.id)
      } else {
        // Dar 100 XP quando marcada como certa (além do 1 XP da criação da resposta)
        const xpMarcadaCerta = XP_CONSTANTS.comunidade.respostaCerta
        console.log(`✅ [API] Dando ${xpMarcadaCerta} XP ao autor da resposta (marcada como certa). Total: ${xpTotalJaDado + xpMarcadaCerta} XP`)
        
        try {
          await insertXpEntry({
            userId: resposta.autor_id,
            source: 'comunidade',
            sourceId: respostaId,
            amount: xpMarcadaCerta,
            description: 'Resposta marcada como certa na comunidade',
            accessToken: accessToken,
          })

          // O trigger do banco atualiza automaticamente xp, xp_mensal e level
          // Não precisamos atualizar manualmente
          console.log(`✅ [API] XP inserido no histórico. O trigger atualizará xp e xp_mensal automaticamente.`)
        } catch (xpInsertError: any) {
          console.error('❌ [API] Erro ao inserir XP:', xpInsertError)
          // Não falhar a operação se der erro ao inserir XP, apenas logar
        }
      }

      // Buscar XP final após inserção
      const { data: xpFinal } = await supabase
        .from('user_xp_history')
        .select('amount')
        .eq('user_id', resposta.autor_id)
        .eq('source', 'comunidade')
        .eq('source_id', respostaId)
      
      const xpTotalDado = (xpFinal || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)
      const xpFoiDado = !xpJaDadoMarcadaCerta
      
      return NextResponse.json({
        success: true,
        marcada: true,
        xp: xpTotalDado,
        xpFoiDado,
        mensagem: xpFoiDado 
          ? `Resposta marcada como certa! O autor ganhou ${XP_CONSTANTS.comunidade.respostaCerta} XP (total: ${xpTotalDado} XP).`
          : `Resposta marcada como certa! O autor já tinha ${xpTotalDado} XP.`
      })
    }
  } catch (error: any) {
    console.error('Erro ao votar na resposta:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao votar na resposta' }, { status: 500 })
  }
}

