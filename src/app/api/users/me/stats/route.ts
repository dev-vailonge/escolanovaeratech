import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

export async function GET(request: NextRequest) {
  try {
    // Obter userId autenticado via Bearer token
    const userId = await requireUserIdFromBearer(request)

    // Extrair token para usar no cliente
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null

    // Usar helper com fallback para anon key se necessário
    const supabaseAdmin = await getSupabaseClient(accessToken || undefined)

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
      perguntasRespondidasResult,
      perguntasFeitasResult,
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
      
      // Total de perguntas respondidas (todas as respostas)
      supabaseAdmin
        .from('respostas')
        .select('id')
        .eq('autor_id', userId),
      
      // Total de perguntas feitas pelo usuário
      supabaseAdmin
        .from('perguntas')
        .select('id')
        .eq('autor_id', userId),
    ])

    // Debug logs detalhados
    console.log('[API /users/me/stats] userId:', userId)
    console.log('[API /users/me/stats] aulas (source=aula):', aulasResult.data?.length || 0, aulasResult.error?.message || 'OK')
    if (aulasResult.error) {
      console.error('[API /users/me/stats] Erro ao buscar aulas:', aulasResult.error)
    }
    console.log('[API /users/me/stats] quizzes:', quizzesResult.data?.length || 0, quizzesResult.error?.message || 'OK')
    if (quizzesResult.error) {
      console.error('[API /users/me/stats] Erro ao buscar quizzes:', quizzesResult.error)
      console.error('[API /users/me/stats] Erro detalhado quizzes:', JSON.stringify(quizzesResult.error, null, 2))
    }
    console.log('[API /users/me/stats] desafios:', desafiosResult.data?.length || 0, desafiosResult.error?.message || 'OK')
    if (desafiosResult.error) {
      console.error('[API /users/me/stats] Erro ao buscar desafios:', desafiosResult.error)
      console.error('[API /users/me/stats] Erro detalhado desafios:', JSON.stringify(desafiosResult.error, null, 2))
    }
    console.log('[API /users/me/stats] perguntas respondidas:', perguntasRespondidasResult.data?.length || 0, perguntasRespondidasResult.error?.message || 'OK')
    if (perguntasRespondidasResult.error) {
      console.error('[API /users/me/stats] Erro ao buscar perguntas respondidas:', perguntasRespondidasResult.error)
    }
    console.log('[API /users/me/stats] perguntas feitas:', perguntasFeitasResult.data?.length || 0, perguntasFeitasResult.error?.message || 'OK')
    if (perguntasFeitasResult.error) {
      console.error('[API /users/me/stats] Erro ao buscar perguntas feitas:', perguntasFeitasResult.error)
    }

    // Contar aulas únicas (cada source_id diferente conta como uma aula)
    const aulasUnicas = new Set<string>()
    
    // Aulas com source='aula'
    if (aulasResult.data) {
      aulasResult.data
        .filter(item => item.source_id)
        .forEach(item => aulasUnicas.add(item.source_id as string))
    }
    
    const aulasCompletas = aulasUnicas.size

    const quizCompletos = quizzesResult.data?.length || 0
    const desafiosConcluidos = desafiosResult.data?.length || 0
    const participacaoComunidade = comunidadeResult.data?.length || 0
    const perguntasRespondidas = perguntasRespondidasResult.data?.length || 0
    const perguntasFeitas = perguntasFeitasResult.data?.length || 0

    // Estimativa de tempo de estudo (30 min por aula, 10 min por quiz, 15 min por desafio)
    const tempoEstudo = (aulasCompletas * 30) + (quizCompletos * 10) + (desafiosConcluidos * 15)

    const stats = {
      aulasCompletas,
      quizCompletos,
      desafiosConcluidos,
      tempoEstudo,
      participacaoComunidade,
      perguntasRespondidas,
      perguntasFeitas,
    }

    console.log('[API /users/me/stats] Stats finais:', stats)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('[API /users/me/stats] Erro ao buscar estatísticas:', error)
    
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    // Retornar stats vazios em vez de erro 500 para não quebrar a página
    return NextResponse.json({
      aulasCompletas: 0,
      quizCompletos: 0,
      desafiosConcluidos: 0,
      tempoEstudo: 0,
      participacaoComunidade: 0,
      perguntasRespondidas: 0,
      perguntasFeitas: 0,
    }, { status: 200 })
  }
}
