import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import {
  createUserScopedSupabaseClient,
  getSupabaseClient,
} from '@/lib/server/getSupabaseClient'
import type { DatabaseAlunoPlanoEstudo } from '@/types/database'
import {
  isPlanFullyCompleted,
  mergeToggleCompletedDay,
  normalizeProgress,
} from '@/lib/planoEstudoAluno'

/**
 * GET /api/aluno/plano-estudo-ativo — plano ativo do usuário (ou null)
 */
export async function GET(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const supabase =
      createUserScopedSupabaseClient(accessToken) ?? (await getSupabaseClient(accessToken))

    const { data, error } = await supabase
      .from('aluno_planos_estudo')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('[plano-estudo-ativo GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plan: (data as DatabaseAlunoPlanoEstudo | null) ?? null })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}

/**
 * PATCH /api/aluno/plano-estudo-ativo — progresso (toggle dia ou lista de dias concluídos)
 * Body: { toggle_day?: number } | { set_completed_days?: number[] }
 */
export async function PATCH(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const supabase =
      createUserScopedSupabaseClient(accessToken) ?? (await getSupabaseClient(accessToken))
    const body = await request.json().catch(() => ({}))

    const { data: active, error: findErr } = await supabase
      .from('aluno_planos_estudo')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (findErr) {
      console.error('[plano-estudo-ativo PATCH find]', findErr)
      return NextResponse.json({ error: findErr.message }, { status: 500 })
    }

    if (!active) {
      return NextResponse.json({ error: 'Nenhum plano de estudos ativo' }, { status: 404 })
    }

    const row = active as DatabaseAlunoPlanoEstudo
    let progress = normalizeProgress(row.progress)

    if (typeof body.toggle_day === 'number') {
      const day = Math.floor(body.toggle_day)
      if (!Number.isFinite(day) || day < 1 || day > row.dias) {
        return NextResponse.json({ error: 'toggle_day inválido' }, { status: 400 })
      }
      progress = mergeToggleCompletedDay(progress, day)
    } else if (Array.isArray(body.set_completed_days)) {
      const days: number[] = body.set_completed_days
        .map((d: unknown) => (typeof d === 'number' ? Math.floor(d) : NaN))
        .filter((d: number): d is number => Number.isFinite(d) && d >= 1 && d <= row.dias)
      progress = { completedDays: [...new Set(days)].sort((a, b) => a - b) }
    } else {
      return NextResponse.json(
        { error: 'Envie toggle_day (número) ou set_completed_days (array)' },
        { status: 400 }
      )
    }

    const fully = isPlanFullyCompleted(row.dias, progress)
    const hasGithub =
      typeof row.github_repo_url === 'string' && row.github_repo_url.trim().length > 0
    const status = fully && hasGithub ? 'completed' : 'active'

    const { data: updated, error: upErr } = await supabase
      .from('aluno_planos_estudo')
      .update({ progress, status })
      .eq('id', row.id)
      .select('*')
      .single()

    if (upErr) {
      console.error('[plano-estudo-ativo PATCH]', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ plan: updated as DatabaseAlunoPlanoEstudo })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
