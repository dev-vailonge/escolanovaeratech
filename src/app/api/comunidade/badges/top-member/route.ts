import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Buscar todas as perguntas
    const { data: todasPerguntas } = await supabase
      .from('perguntas')
      .select('id, autor_id')

    if (!todasPerguntas || todasPerguntas.length === 0) {
      return NextResponse.json({ success: true, userId: null })
    }

    const perguntaIds = todasPerguntas.map((p) => p.id)

    // Buscar todos os votos
    const { data: votos } = await supabase
      .from('pergunta_votos')
      .select('pergunta_id')
      .in('pergunta_id', perguntaIds)

    // Contar votos por autor
    const votosPorAutor = new Map<string, number>()

    todasPerguntas.forEach((p) => {
      const votosDaPergunta = votos?.filter((v) => v.pergunta_id === p.id) || []
      const atual = votosPorAutor.get(p.autor_id) || 0
      votosPorAutor.set(p.autor_id, atual + votosDaPergunta.length)
    })

    // Encontrar o top member (apenas usuários com 50+ curtidas)
    let topMemberId: string | null = null
    let maxVotos = 0

    votosPorAutor.forEach((votos, autorId) => {
      // Só considerar usuários com pelo menos 50 curtidas
      if (votos >= 50 && votos > maxVotos) {
        maxVotos = votos
        topMemberId = autorId
      }
    })

    return NextResponse.json({ 
      success: true, 
      userId: topMemberId, 
      totalCurtidas: maxVotos,
      hasMinimum: maxVotos >= 50 
    })
  } catch (error: any) {
    console.error('Erro ao calcular top member:', error)
    return NextResponse.json({ error: 'Erro ao calcular top member' }, { status: 500 })
  }
}

