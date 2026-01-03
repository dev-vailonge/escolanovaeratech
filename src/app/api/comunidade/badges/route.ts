import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    const supabase = await getSupabaseClient(accessToken)
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const badges: Array<{ type: string; earnedAt?: string; metadata?: any }> = []

    // Calcular badge "Top Member"
    // Buscar todas as perguntas e contar votos por autor

    // Contar votos por autor
    const votosPorAutor = new Map<string, number>()
    
    // Buscar todas as perguntas e seus votos
    const { data: todasPerguntas } = await supabase
      .from('perguntas')
      .select('id, autor_id')

    if (todasPerguntas && todasPerguntas.length > 0) {
      const perguntaIds = todasPerguntas.map((p) => p.id)
      const { data: votos } = await supabase
        .from('pergunta_votos')
        .select('pergunta_id')
        .in('pergunta_id', perguntaIds)

      // Agrupar por autor
      todasPerguntas.forEach((p) => {
        const votosDaPergunta = votos?.filter((v) => v.pergunta_id === p.id) || []
        const atual = votosPorAutor.get(p.autor_id) || 0
        votosPorAutor.set(p.autor_id, atual + votosDaPergunta.length)
      })
    }

    // Contar curtidas do usuário atual
    const curtidasDoUsuario = votosPorAutor.get(userId) || 0

    // Badge "Top Member" só aparece com 50+ curtidas
    if (curtidasDoUsuario >= 50) {
      // Verificar se é o top member (mais curtidas)
      let topMemberId: string | null = null
      let maxVotos = 0

      votosPorAutor.forEach((votos, autorId) => {
        if (votos > maxVotos) {
          maxVotos = votos
          topMemberId = autorId
        }
      })

      // Se o usuário é o top member E tem 50+ curtidas, adicionar badge
      if (topMemberId === userId && maxVotos >= 50) {
        badges.push({
          type: 'top_member',
          metadata: {
            totalCurtidas: maxVotos,
          },
        })
      }
    }

    return NextResponse.json({ success: true, badges })
  } catch (error: any) {
    console.error('Erro ao buscar badges:', error)
    console.error('Stack trace:', error?.stack)
    // Se for erro de RLS ou permissão, retornar array vazio em vez de erro 500
    // Isso permite que a página carregue mesmo sem badges
    if (String(error?.message || '').includes('permission') || String(error?.message || '').includes('RLS')) {
      console.warn('⚠️ Erro de RLS ao buscar badges, retornando array vazio')
      return NextResponse.json({ success: true, badges: [] })
    }
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Erro ao buscar badges'
      : 'Erro ao buscar badges'
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

