import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

const IMAGEM_BUCKET = 'comunidade-imagens'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'ID da pergunta inválido' }, { status: 400 })
    }

    // Buscar pergunta
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, titulo, imagem_url, autor_id')
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Verificar se há imagens no bucket para esta pergunta
    const { data: files, error: listError } = await supabase.storage
      .from(IMAGEM_BUCKET)
      .list(perguntaId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    return NextResponse.json({
      success: true,
      pergunta: {
        id: pergunta.id,
        titulo: pergunta.titulo,
        imagem_url: pergunta.imagem_url,
      },
      arquivosNoBucket: files || [],
      bucketExiste: !listError || listError.message?.includes('not found') === false,
      erroListagem: listError?.message,
    })
  } catch (error: any) {
    console.error('Erro ao verificar imagem:', error)
    return NextResponse.json({ error: 'Erro ao verificar imagem' }, { status: 500 })
  }
}



