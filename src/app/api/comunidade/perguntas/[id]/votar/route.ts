import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const supabase = getSupabaseAdmin()
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'ID da pergunta inválido' }, { status: 400 })
    }

    // Verificar se a pergunta existe
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, autor_id')
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Verificar se o usuário já curtiu esta pergunta
    const { data: votoExistente, error: votoError } = await supabase
      .from('pergunta_votos')
      .select('id')
      .eq('pergunta_id', perguntaId)
      .eq('user_id', userId)
      .maybeSingle()

    if (votoError && votoError.code !== 'PGRST116') {
      console.error('Erro ao verificar voto:', votoError)
      return NextResponse.json({ error: 'Erro ao verificar voto' }, { status: 500 })
    }

    if (votoExistente) {
      // Descurtir: remover o voto
      const { error: deleteError } = await supabase
        .from('pergunta_votos')
        .delete()
        .eq('id', votoExistente.id)

      if (deleteError) {
        console.error('Erro ao remover voto:', deleteError)
        return NextResponse.json({ error: 'Erro ao remover voto' }, { status: 500 })
      }

      // Buscar novo contador de votos
      const { data: perguntaAtualizada } = await supabase
        .from('perguntas')
        .select('votos')
        .eq('id', perguntaId)
        .single()

      return NextResponse.json({
        success: true,
        curtida: false,
        votos: perguntaAtualizada?.votos || 0,
        mensagem: 'Curtida removida'
      })
    } else {
      // Curtir: adicionar o voto
      const { error: insertError } = await supabase
        .from('pergunta_votos')
        .insert({
          pergunta_id: perguntaId,
          user_id: userId,
        })

      if (insertError) {
        console.error('Erro ao adicionar voto:', insertError)
        return NextResponse.json({ error: 'Erro ao adicionar voto' }, { status: 500 })
      }

      // Buscar novo contador de votos
      const { data: perguntaAtualizada } = await supabase
        .from('perguntas')
        .select('votos')
        .eq('id', perguntaId)
        .single()

      return NextResponse.json({
        success: true,
        curtida: true,
        votos: perguntaAtualizada?.votos || 0,
        mensagem: 'Pergunta curtida!'
      })
    }
  } catch (error: any) {
    console.error('Erro ao votar na pergunta:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao votar na pergunta' }, { status: 500 })
  }
}

