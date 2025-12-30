import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
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
        melhorResposta: r.melhor_resposta || false,
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


