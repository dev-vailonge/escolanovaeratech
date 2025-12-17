import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

// PUT - Editar pergunta
export async function PUT(
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

    // Buscar a pergunta
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, autor_id, titulo, descricao, tags, categoria')
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Verificar se o usuário é o autor
    if (pergunta.autor_id !== userId) {
      return NextResponse.json(
        { error: 'Apenas o autor pode editar esta pergunta' },
        { status: 403 }
      )
    }

    // Verificar se a pergunta tem respostas
    const { count: respostasCount } = await supabase
      .from('respostas')
      .select('*', { count: 'exact', head: true })
      .eq('pergunta_id', perguntaId)

    if (respostasCount && respostasCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível editar uma pergunta que já possui respostas' },
        { status: 400 }
      )
    }

    // Ler dados do body
    const body = await request.json()
    const titulo = String(body?.titulo || '').trim()
    const descricao = String(body?.descricao || '').trim()
    const tags = Array.isArray(body?.tags) 
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) 
      : []
    const categoria = String(body?.categoria || '').trim() || null

    // Validações
    if (titulo.length < 3) {
      return NextResponse.json(
        { error: 'Título muito curto (mínimo 3 caracteres)' },
        { status: 400 }
      )
    }

    if (descricao.length < 10) {
      return NextResponse.json(
        { error: 'Descrição muito curta (mínimo 10 caracteres)' },
        { status: 400 }
      )
    }

    // Garantir que tags seja um array válido
    const tagsArray = Array.isArray(tags) && tags.length > 0 ? tags : []

    // Atualizar a pergunta
    const { data: perguntaAtualizada, error: updateError } = await supabase
      .from('perguntas')
      .update({
        titulo,
        descricao,
        tags: tagsArray,
        categoria: categoria || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', perguntaId)
      .select('id, titulo, descricao, autor_id, tags, categoria, updated_at')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar pergunta:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar pergunta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, pergunta: perguntaAtualizada })
  } catch (error: any) {
    console.error('Erro ao editar pergunta:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao editar pergunta' }, { status: 500 })
  }
}

// DELETE - Excluir pergunta
export async function DELETE(
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

    // Buscar a pergunta
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, autor_id')
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Verificar se o usuário é o autor
    if (pergunta.autor_id !== userId) {
      return NextResponse.json(
        { error: 'Apenas o autor pode excluir esta pergunta' },
        { status: 403 }
      )
    }

    // Verificar se a pergunta tem respostas
    const { count: respostasCount } = await supabase
      .from('respostas')
      .select('*', { count: 'exact', head: true })
      .eq('pergunta_id', perguntaId)

    if (respostasCount && respostasCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma pergunta que já possui respostas' },
        { status: 400 }
      )
    }

    // Excluir a pergunta
    const { error: deleteError } = await supabase
      .from('perguntas')
      .delete()
      .eq('id', perguntaId)

    if (deleteError) {
      console.error('Erro ao excluir pergunta:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir pergunta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao excluir pergunta:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao excluir pergunta' }, { status: 500 })
  }
}


