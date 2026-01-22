import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Extrair token se disponível
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null
    
    const supabase = await getSupabaseClient(accessToken || undefined)
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'perguntaId inválido' }, { status: 400 })
    }

    const { data: respostas, error } = await supabase
      .from('respostas')
      .select(`
        id,
        pergunta_id,
        autor_id,
        conteudo,
        votos,
        melhor_resposta,
        created_at,
        updated_at,
        autor:users!respostas_autor_id_fkey(id, name, level, avatar_url)
      `)
      .eq('pergunta_id', perguntaId)
      .order('melhor_resposta', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar respostas:', error)
      return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
    }

    const respostasFormatadas = respostas?.map((r) => {
      const autor = Array.isArray(r.autor) ? r.autor[0] : r.autor
      return {
        id: r.id,
        perguntaId: r.pergunta_id,
        conteudo: r.conteudo,
        votos: r.votos || 0,
        melhorResposta: Boolean(r.melhor_resposta),
        dataCriacao: r.created_at,
        autor: autor
          ? {
              id: autor.id,
              nome: autor.name,
              nivel: autor.level || 1,
              avatar: autor.avatar_url,
            }
          : null,
      }
    })

    return NextResponse.json({ success: true, respostas: respostasFormatadas || [] })
  } catch (error: any) {
    console.error('Erro ao buscar respostas:', error)
    return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
  }
}


