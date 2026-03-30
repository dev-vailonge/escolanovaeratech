import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

const MAX_IDS = 40

export type DesafioSubmitterSummary = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

/**
 * GET /api/desafios/submitters-summary?ids=uuid,uuid
 * Alunos autenticados: quem já enviou solução (pendente/aprovado/rejeitado), por desafio, com avatar para facepile.
 */
export async function GET(request: Request) {
  try {
    await requireUserIdFromBearer(request)
    const supabase = await getSupabaseClient()

    const url = new URL(request.url)
    const raw = url.searchParams.get('ids') || ''
    const ids = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]

    if (ids.length === 0) {
      return NextResponse.json({ byDesafio: {} as Record<string, { count: number; submitters: DesafioSubmitterSummary[] }> })
    }
    if (ids.length > MAX_IDS) {
      return NextResponse.json({ error: `Máximo de ${MAX_IDS} desafios por requisição` }, { status: 400 })
    }

    const { data: rows, error } = await supabase
      .from('desafio_submissions')
      .select(
        `
        user_id,
        desafio_id,
        created_at,
        status,
        users:user_id (
          id,
          name,
          avatar_url
        )
      `
      )
      .in('desafio_id', ids)
      .in('status', ['pendente', 'aprovado', 'rejeitado'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('submitters-summary:', error)
      return NextResponse.json({ error: 'Não foi possível carregar os envios' }, { status: 500 })
    }

    type Row = {
      user_id: string
      desafio_id: string
      created_at: string
      users: { id: string; name: string | null; avatar_url: string | null } | { id: string; name: string | null; avatar_url: string | null }[] | null
    }

    const byDesafio: Record<string, { order: string[]; map: Map<string, DesafioSubmitterSummary> }> = {}

    for (const id of ids) {
      byDesafio[id] = { order: [], map: new Map() }
    }

    for (const r of (rows || []) as Row[]) {
      const bucket = byDesafio[r.desafio_id]
      if (!bucket || bucket.map.has(r.user_id)) continue

      const u = r.users
      const userRow = Array.isArray(u) ? u[0] : u
      const summary: DesafioSubmitterSummary = {
        userId: r.user_id,
        name: userRow?.name ?? null,
        avatarUrl: userRow?.avatar_url ?? null,
      }
      bucket.map.set(r.user_id, summary)
      bucket.order.push(r.user_id)
    }

    const payload: Record<string, { count: number; submitters: DesafioSubmitterSummary[] }> = {}
    for (const id of ids) {
      const b = byDesafio[id]
      const submitters = b.order.map((uid) => b.map.get(uid)).filter(Boolean) as DesafioSubmitterSummary[]
      payload[id] = { count: submitters.length, submitters }
    }

    return NextResponse.json({ byDesafio: payload })
  } catch (e: any) {
    if (e?.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('submitters-summary:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
