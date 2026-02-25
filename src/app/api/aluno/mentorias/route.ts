import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * GET /api/aluno/mentorias
 * Retorna a mentoria ativa do aluno logado (onde ele é mentorado), com steps e tarefas.
 * Se não tiver mentoria, retorna 200 com { mentoria: null }.
 */
export async function GET(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const { data: mentoria, error } = await supabase
      .from('mentorias')
      .select(`
        *,
        mentor:users!mentorias_mentor_id_fkey(id, name, email, avatar_url),
        mentorado:users!mentorias_mentorado_id_fkey(id, name, email, avatar_url)
      `)
      .eq('mentorado_id', userId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!mentoria) {
      return NextResponse.json({ mentoria: null })
    }

    const { data: steps } = await supabase
      .from('mentoria_steps')
      .select(`
        *,
        tarefas:mentoria_tarefas(*)
      `)
      .eq('mentoria_id', mentoria.id)
      .order('ordem', { ascending: true })

    const stepsWithTarefas = (steps || []).map((s: any) => ({
      ...s,
      tarefas: s.tarefas || [],
    }))

    const enabledSteps = stepsWithTarefas.filter((s: any) => s.habilitado)
    const doneSteps = enabledSteps.filter((s: any) => s.status === 'concluido')
    const progressPercent =
      enabledSteps.length === 0 ? 0 : Math.round((doneSteps.length / enabledSteps.length) * 100)

    return NextResponse.json({
      mentoria: {
        ...mentoria,
        steps: stepsWithTarefas,
        progressPercent,
      },
    })
  } catch (e: any) {
    if (e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
