import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

export async function GET(request: NextRequest) {
  try {
    // Obter userId autenticado via Bearer token
    const userId = await requireUserIdFromBearer(request)

    // Usar supabaseAdmin para ter permissões completas (bypass RLS)
    const supabaseAdmin = getSupabaseAdmin()

    // Início do mês atual para filtrar participação na comunidade
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Buscar todas as estatísticas em paralelo
    const [
      aulasResult,
      quizzesResult,
      desafiosResult,
      comunidadeResult,
    ] = await Promise.all([
      // Aulas completas (baseado em XP history com source='aula')
      supabaseAdmin
        .from('user_xp_history')
        .select('source_id')
        .eq('user_id', userId)
        .eq('source', 'aula'),
      
      // Quizzes completos
      supabaseAdmin
        .from('user_quiz_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('completo', true),
      
      // Desafios concluídos
      supabaseAdmin
        .from('user_desafio_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('completo', true),
      
      // Participação na comunidade este mês (respostas)
      supabaseAdmin
        .from('respostas')
        .select('id')
        .eq('autor_id', userId)
        .gte('created_at', startOfMonth.toISOString()),
    ])

    // Debug logs
    console.log('API stats - userId:', userId)
    console.log('API stats - quizzes:', quizzesResult.data?.length, quizzesResult.error)
    console.log('API stats - desafios:', desafiosResult.data?.length, desafiosResult.error)

    // Contar aulas únicas (cada source_id diferente conta como uma aula)
    const aulasUnicas = new Set(
      (aulasResult.data || [])
        .filter(item => item.source_id)
        .map(item => item.source_id)
    )
    const aulasCompletas = aulasUnicas.size

    const quizCompletos = quizzesResult.data?.length || 0
    const desafiosConcluidos = desafiosResult.data?.length || 0
    const participacaoComunidade = comunidadeResult.data?.length || 0

    // Estimativa de tempo de estudo (30 min por aula, 10 min por quiz, 15 min por desafio)
    const tempoEstudo = (aulasCompletas * 30) + (quizCompletos * 10) + (desafiosConcluidos * 15)

    return NextResponse.json({
      aulasCompletas,
      quizCompletos,
      desafiosConcluidos,
      tempoEstudo,
      participacaoComunidade,
    })
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
