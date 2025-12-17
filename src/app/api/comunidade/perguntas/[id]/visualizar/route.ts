import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
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

    // Incrementar visualizações
    const { data: perguntaAtualizada, error: updateError } = await supabase
      .from('perguntas')
      .update({ visualizacoes: (pergunta.visualizacoes || 0) + 1 })
      .eq('id', perguntaId)
      .select('visualizacoes')
      .single()

    if (updateError) {
      console.error('Erro ao incrementar visualizações:', updateError)
      return NextResponse.json({ error: 'Erro ao incrementar visualizações' }, { status: 500 })
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

