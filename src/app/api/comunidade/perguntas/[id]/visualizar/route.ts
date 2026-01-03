import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair accessToken se disponível (não é obrigatório para visualização)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    const supabase = await getSupabaseClient(accessToken)
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'ID da pergunta inválido' }, { status: 400 })
    }

    // Verificar se a pergunta existe
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, visualizacoes')
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Incrementar visualizações usando RPC (função SQL) se disponível, caso contrário UPDATE direto
    // Tentar usar função SQL primeiro (mais eficiente e bypassa RLS se configurada corretamente)
    const { data: rpcData, error: rpcError } = await supabase.rpc('incrementar_visualizacoes_pergunta', {
      pergunta_id: perguntaId
    })

    if (!rpcError && rpcData !== null) {
      // Função RPC funcionou, retornar o novo valor
      return NextResponse.json({
        success: true,
        visualizacoes: rpcData || (pergunta.visualizacoes || 0) + 1
      })
    }

    // Se RPC não estiver disponível, tentar UPDATE direto (pode falhar se RLS bloquear)
    const { data: perguntaAtualizada, error: updateError } = await supabase
      .from('perguntas')
      .update({ visualizacoes: (pergunta.visualizacoes || 0) + 1 })
      .eq('id', perguntaId)
      .select('visualizacoes')
      .single()

    if (updateError) {
      // Se for erro de RLS/permissão, logar mas não falhar (visualizações são não-críticas)
      const isPermissionError = updateError.code === '42501' || 
                                updateError.message?.includes('permission') || 
                                updateError.message?.includes('policy') ||
                                updateError.message?.includes('RLS')
      
      if (isPermissionError) {
        console.warn('⚠️ Aviso: Não foi possível incrementar visualizações (RLS bloqueado). Isso é normal se as políticas RLS não permitirem UPDATE público. Visualizações são não-críticas.')
        // Retornar sucesso mesmo com erro - não queremos quebrar a experiência do usuário
        // As visualizações podem ser incrementadas via função SQL no Supabase
        return NextResponse.json({
          success: true,
          visualizacoes: pergunta.visualizacoes || 0, // Retornar valor atual (não incrementado)
          warning: 'Visualizações não foram incrementadas (requer política RLS ou função SQL)'
        })
      }
      
      console.error('Erro ao incrementar visualizações:', updateError)
      // Para outros erros, também retornar sucesso mas com valor não incrementado
      return NextResponse.json({
        success: true,
        visualizacoes: pergunta.visualizacoes || 0,
        warning: 'Visualizações não foram incrementadas'
      })
    }

    return NextResponse.json({
      success: true,
      visualizacoes: perguntaAtualizada?.visualizacoes || 0
    })
  } catch (error: any) {
    console.error('Erro ao registrar visualização:', error)
    return NextResponse.json({ error: 'Erro ao registrar visualização' }, { status: 500 })
  }
}




