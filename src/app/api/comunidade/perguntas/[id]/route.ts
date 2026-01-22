import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair token se disponível
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null
    
    const supabase = await getSupabaseClient(accessToken || undefined)
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'ID da pergunta inválido' }, { status: 400 })
    }

    // Buscar pergunta
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select(`
        id,
        titulo,
        descricao,
        autor_id,
        tags,
        categoria,
        votos,
        visualizacoes,
        resolvida,
        melhor_resposta_id,
        imagem_url,
        created_at,
        updated_at
      `)
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Buscar autor
    const { data: autor } = await supabase
      .from('users')
      .select('id, name, level, avatar_url')
      .eq('id', pergunta.autor_id)
      .single()

    // Buscar respostas diretas (resposta_pai_id IS NULL)
    const { data: respostas, error: respostasError } = await supabase
      .from('respostas')
      .select(`
        id,
        pergunta_id,
        autor_id,
        conteudo,
        votos,
        melhor_resposta,
        resposta_pai_id,
        mencoes,
        imagem_url,
        created_at,
        updated_at,
        autor:users!respostas_autor_id_fkey(id, name, level, avatar_url)
      `)
      .eq('pergunta_id', perguntaId)
      .is('resposta_pai_id', null)
      .order('melhor_resposta', { ascending: false })
      .order('created_at', { ascending: true })

    if (respostasError) {
      console.error('Erro ao buscar respostas:', respostasError)
    }

    // Buscar comentários para cada resposta
    const respostaIds = respostas?.map((r) => r.id) || []
    const { data: comentarios } = await supabase
      .from('respostas')
      .select(`
        id,
        pergunta_id,
        autor_id,
        conteudo,
        votos,
        melhor_resposta,
        resposta_pai_id,
        mencoes,
        imagem_url,
        created_at,
        updated_at,
        autor:users!respostas_autor_id_fkey(id, name, level, avatar_url)
      `)
      .in('resposta_pai_id', respostaIds.length > 0 ? respostaIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: true })

    // Organizar comentários por resposta
    const comentariosMap = new Map<string, any[]>()
    comentarios?.forEach((c) => {
      const paiId = c.resposta_pai_id
      if (paiId) {
        const lista = comentariosMap.get(paiId) || []
        lista.push(c)
        comentariosMap.set(paiId, lista)
      }
    })

    // Formatar respostas
    const respostasFormatadas = respostas?.map((r) => {
      const autor = Array.isArray(r.autor) ? r.autor[0] : r.autor
      const melhorResposta = Boolean(r.melhor_resposta)
      // Debug: verificar se o campo está vindo corretamente
      if (melhorResposta) {
        console.log(`[API] Resposta ${r.id} marcada como melhor: melhor_resposta=${r.melhor_resposta}, melhorResposta=${melhorResposta}`)
      }
      return {
        id: r.id,
        perguntaId: r.pergunta_id,
        conteudo: r.conteudo,
        votos: r.votos || 0,
        melhorResposta,
        dataCriacao: r.created_at,
        imagemUrl: r.imagem_url || null,
        comentarios: (comentariosMap.get(r.id) || []).map((c) => {
          const autorComentario = Array.isArray(c.autor) ? c.autor[0] : c.autor
          return {
            id: c.id,
            conteudo: c.conteudo,
            mencoes: c.mencoes || [],
            dataCriacao: c.created_at,
            imagemUrl: c.imagem_url || null,
            autor: autorComentario
              ? {
                  id: autorComentario.id,
                  nome: autorComentario.name,
                  nivel: autorComentario.level || 1,
                  avatar: autorComentario.avatar_url,
                }
              : null,
          }
        }),
        autor: autor
          ? {
              id: autor.id,
              nome: autor.name,
              nivel: autor.level || 1,
              avatar: autor.avatar_url,
            }
          : null,
      }
    }) || []

    // Formatar pergunta
    const perguntaFormatada = {
      ...pergunta,
      imagemUrl: pergunta.imagem_url, // Mapear imagem_url para imagemUrl
      updated_at: pergunta.updated_at, // Incluir updated_at
      autor: autor
        ? {
            id: autor.id,
            nome: autor.name,
            nivel: autor.level || 1,
            avatar: autor.avatar_url,
          }
        : null,
      respostas: respostasFormatadas,
    }

    return NextResponse.json({ success: true, pergunta: perguntaFormatada })
  } catch (error: any) {
    console.error('Erro ao buscar pergunta:', error)
    return NextResponse.json({ error: 'Erro ao buscar pergunta' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { requireUserIdFromBearer } = await import('@/lib/server/requestAuth')
    const userId = await requireUserIdFromBearer(request)
    
    // Extrair token para usar no cliente
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null
    
    const supabase = await getSupabaseClient(accessToken || undefined)
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'ID da pergunta inválido' }, { status: 400 })
    }

    // Verificar se a pergunta pertence ao usuário
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, autor_id')
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    if (pergunta.autor_id !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para editar esta pergunta' }, { status: 403 })
    }

    const body = await request.json()
    const titulo = String(body?.titulo || '').trim()
    const descricao = String(body?.descricao || '').trim()
    const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : []
    const categoria = String(body?.categoria || '').trim() || null
    const imagemUrl = String(body?.imagem_url || '').trim() || null

    if (titulo.length < 3) {
      return NextResponse.json({ error: 'Título muito curto (mínimo 3 caracteres)' }, { status: 400 })
    }

    if (descricao.length < 10) {
      return NextResponse.json({ error: 'Descrição muito curta (mínimo 10 caracteres)' }, { status: 400 })
    }

    const tagsArray = Array.isArray(tags) && tags.length > 0 ? tags : []

    // Atualizar pergunta
    const { data: perguntaAtualizada, error: updateError } = await supabase
      .from('perguntas')
      .update({
        titulo,
        descricao,
        tags: tagsArray,
        categoria: categoria || null,
        imagem_url: imagemUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', perguntaId)
      .select('id, titulo, descricao, tags, categoria, imagem_url, updated_at')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar pergunta:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar pergunta' }, { status: 500 })
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
