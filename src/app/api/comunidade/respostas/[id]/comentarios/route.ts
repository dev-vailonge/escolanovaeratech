import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { extractMentions } from '@/lib/mentionParser'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair accessToken do header para usar com getSupabaseClient
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    const supabase = await getSupabaseClient(accessToken)
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
        imagem_url,
        created_at,
        updated_at,
        autor:users!respostas_autor_id_fkey(id, name, level, avatar_url)
      `)
      .eq('resposta_pai_id', respostaId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
    }

    const comentariosFormatados = comentarios?.map((c) => {
      const autor = Array.isArray(c.autor) ? c.autor[0] : c.autor
      return {
        id: c.id,
        conteudo: c.conteudo,
        mencoes: c.mencoes || [],
        dataCriacao: c.created_at,
        imagemUrl: c.imagem_url || null,
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
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    
    // Extrair accessToken do header para usar com getSupabaseClient
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    const supabase = await getSupabaseClient(accessToken)
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

    // Verificar se a pergunta já está resolvida (tem melhor resposta marcada)
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, resolvida, melhor_resposta_id')
      .eq('id', respostaPai.pergunta_id)
      .single()

    if (perguntaError) {
      return NextResponse.json({ error: 'Erro ao verificar status da pergunta' }, { status: 500 })
    }

    if (pergunta?.resolvida === true) {
      return NextResponse.json(
        { error: 'Esta pergunta já foi marcada como resolvida. Não é possível adicionar novos comentários.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const conteudo = String(body?.conteudo || '').trim()

    if (conteudo.length < 3) {
      return NextResponse.json({ error: 'Comentário muito curto (mínimo 3 caracteres)' }, { status: 400 })
    }

    // Extrair e validar menções
    const mentions = extractMentions(conteudo)
    const userMentions: string[] = []
    const mentionedUsers: Array<{ id: string; name: string }> = []

    if (mentions.length > 0) {
      // Buscar usuários mencionados (case-insensitive)
      // Criar query com OR para buscar cada menção
      let query = supabase
        .from('users')
        .select('id, name')
      
      const conditions = mentions.map((m) => `name.ilike.%${m}%`).join(',')
      if (conditions) {
        query = query.or(conditions)
      }
      
      const { data: users } = await query

      if (users) {
        // Filtrar para pegar apenas matches exatos (ignorando case)
        const mentionSet = new Set(mentions.map(m => m.toLowerCase()))
        const matchedUsers = users.filter(u => 
          mentionSet.has(u.name.toLowerCase())
        )
        userMentions.push(...matchedUsers.map((u) => u.id))
        mentionedUsers.push(...matchedUsers)
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
      return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
    }

    // Buscar dados do autor
    const { data: autor } = await supabase
      .from('users')
      .select('id, name, level, avatar_url')
      .eq('id', userId)
      .single()

    // Criar notificações para usuários mencionados
    if (mentionedUsers.length > 0 && comentario.id) {
      try {
        // Usar getSupabaseClient com accessToken (não precisa de service role key)
        const notifSupabase = await getSupabaseClient(accessToken)
        const agora = new Date()
        const dataFim = new Date()
        dataFim.setDate(dataFim.getDate() + 7) // Notificação válida por 7 dias

        const autorNome = autor?.name || 'Alguém'
        const actionUrl = `/aluno/comunidade/pergunta/${respostaPai.pergunta_id}`

        for (const mentionedUser of mentionedUsers) {
          // Não notificar o próprio autor
          if (mentionedUser.id === userId) continue

          await notifSupabase.from('notificacoes').insert({
            titulo: '💬 Você foi mencionado',
            mensagem: `${autorNome} mencionou você em um comentário.`,
            tipo: 'info',
            data_inicio: agora.toISOString(),
            data_fim: dataFim.toISOString(),
            publico_alvo: 'todos',
            target_user_id: mentionedUser.id,
            action_url: actionUrl,
            created_by: null,
          })
        }
      } catch {
        // Não falhar a criação do comentário se notificação falhar
      }
    }

    const comentarioFormatado = {
      id: comentario.id,
      conteudo: comentario.conteudo,
      mencoes: comentario.mencoes || [],
      dataCriacao: comentario.created_at,
      imagemUrl: null, // Será atualizado após upload de imagem se houver
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
  } catch (error: unknown) {
    if (String((error as Error)?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
  }
}

