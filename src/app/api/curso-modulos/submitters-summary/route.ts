import { NextResponse } from 'next/server'
import { getAccessTokenFromBearer, requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

const MAX_IDS = 40

export type ModuloSubmitterSummary = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

/**
 * GET /api/curso-modulos/submitters-summary?ids=uuid,uuid[&somenteAprovados=1]
 * Resumo por módulo (uma entrada por aluno). Ordem: `created_at` desc (conclusões mais recentes primeiro).
 * Com `somenteAprovados=1`, só linhas com status `aprovado`. Caso contrário: pendente, aprovado e rejeitado.
 */
export async function GET(request: Request) {
  try {
    await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const url = new URL(request.url)
    const raw = url.searchParams.get('ids') || ''
    const ids = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]
    const somenteAprovados =
      url.searchParams.get('somenteAprovados') === '1' ||
      url.searchParams.get('somenteAprovados') === 'true'

    if (ids.length === 0) {
      return NextResponse.json({
        byModulo: {} as Record<string, { count: number; submitters: ModuloSubmitterSummary[] }>,
      })
    }
    if (ids.length > MAX_IDS) {
      return NextResponse.json({ error: `Máximo de ${MAX_IDS} módulos por requisição` }, { status: 400 })
    }

    let q = supabase
      .from('curso_desafio_conclusoes')
      .select('user_id, cursos_desafio_id, created_at, status')
      .in('cursos_desafio_id', ids)
      .order('created_at', { ascending: false })
    if (somenteAprovados) {
      q = q.eq('status', 'aprovado')
    } else {
      q = q.in('status', ['pendente', 'aprovado', 'rejeitado'])
    }
    const { data: rows, error } = await q

    if (error) {
      console.error('curso-modulos submitters-summary:', error)
      return NextResponse.json({ error: 'Não foi possível carregar os envios' }, { status: 500 })
    }

    const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter(Boolean))]
    const userMap = new Map<string, { name: string | null; avatar_url: string | null }>()
    if (userIds.length > 0) {
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds)
      if (uErr) {
        console.error('curso-modulos submitters-summary users:', uErr)
        return NextResponse.json({ error: 'Não foi possível carregar dados dos alunos' }, { status: 500 })
      }
      for (const u of users ?? []) {
        userMap.set(u.id, { name: u.name ?? null, avatar_url: u.avatar_url ?? null })
      }
    }

    const byModulo: Record<string, { order: string[]; map: Map<string, ModuloSubmitterSummary> }> = {}
    for (const id of ids) {
      byModulo[id] = { order: [], map: new Map() }
    }

    for (const r of rows ?? []) {
      const bucket = byModulo[r.cursos_desafio_id]
      if (!bucket || bucket.map.has(r.user_id)) continue
      const u = userMap.get(r.user_id)
      bucket.map.set(r.user_id, {
        userId: r.user_id,
        name: u?.name ?? null,
        avatarUrl: u?.avatar_url ?? null,
      })
      bucket.order.push(r.user_id)
    }

    const payload: Record<string, { count: number; submitters: ModuloSubmitterSummary[] }> = {}
    for (const id of ids) {
      const b = byModulo[id]
      const submitters = b.order.map((uid) => b.map.get(uid)).filter(Boolean) as ModuloSubmitterSummary[]
      payload[id] = { count: submitters.length, submitters }
    }

    return NextResponse.json({ byModulo: payload })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('curso-modulos submitters-summary:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
