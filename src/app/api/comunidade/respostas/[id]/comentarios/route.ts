import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { extractMentions } from '@/lib/mentionParser'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
    const respostaId = params.id

    if (!respostaId) {
      return NextResponse.json({ error: 'ID da resposta inválido' }, { status: 400 })
    }

    // Buscar comentários (respostas com resposta_pai_id = respostaId)
    const { data: comentarios, error } = await supabase
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
        created_at,
        updated_at,
        autor:users!respostas_autor_id_fkey(id, name, level, avatar_url)
      `)
      .eq('resposta_pai_id', respostaId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar comentários:', error)
      return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
    }

    const comentariosFormatados = comentarios?.map((c) => {
      const autor = Array.isArray(c.autor) ? c.autor[0] : c.autor
      return {
        id: c.id,
        conteudo: c.conteudo,
        mencoes: c.mencoes || [],
        dataCriacao: c.created_at,
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

    return NextResponse.json({ success: true, comentarios: comentariosFormatados })
  } catch (error: any) {
    console.error('Erro ao buscar comentários:', error)
    return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const supabase = getSupabaseAdmin()
    const respostaId = params.id

    if (!respostaId) {
      return NextResponse.json({ error: 'ID da resposta inválido' }, { status: 400 })
    }

    // Verificar se a resposta existe e obter pergunta_id
    const { data: respostaPai, error: respostaError } = await supabase
      .from('respostas')
      .select('id, pergunta_id')
      .eq('id', respostaId)
      .single()

    if (respostaError || !respostaPai) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const conteudo = String(body?.conteudo || '').trim()

    if (conteudo.length < 3) {
      return NextResponse.json({ error: 'Comentário muito curto (mínimo 3 caracteres)' }, { status: 400 })
    }

    // Extrair e validar menções
    const mentions = extractMentions(conteudo)
    const userMentions: string[] = []

    if (mentions.length > 0) {
      // Buscar usuários mencionados
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('name', mentions.map((m) => m.toLowerCase()))

      if (users) {
        userMentions.push(...users.map((u) => u.id))
      }
    }

    // Criar comentário (resposta com resposta_pai_id)
    // IMPORTANTE: Comentários NÃO dão XP (apenas respostas diretas dão 1 XP)
    const { data: comentario, error: comentarioError } = await supabase
      .from('respostas')
      .insert({
        pergunta_id: respostaPai.pergunta_id,
        autor_id: userId,
        conteudo,
        resposta_pai_id: respostaId,
        mencoes: userMentions,
        votos: 0,
        melhor_resposta: false,
      })
      .select('id, conteudo, mencoes, created_at')
      .single()

    if (comentarioError) {
      console.error('Erro ao criar comentário:', comentarioError)
      return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
    }

    // Buscar dados do autor
    const { data: autor } = await supabase
      .from('users')
      .select('id, name, level, avatar_url')
      .eq('id', userId)
      .single()

    const comentarioFormatado = {
      id: comentario.id,
      conteudo: comentario.conteudo,
      mencoes: comentario.mencoes || [],
      dataCriacao: comentario.created_at,
      autor: autor
        ? {
            id: autor.id,
            nome: autor.name,
            nivel: autor.level || 1,
            avatar: autor.avatar_url,
          }
        : null,
    }

    return NextResponse.json({ success: true, comentario: comentarioFormatado })
  } catch (error: any) {
    console.error('Erro ao criar comentário:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
  }
}

