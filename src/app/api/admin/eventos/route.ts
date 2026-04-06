import { NextResponse } from 'next/server'
import { requireAdminGate } from '@/lib/server/requireAdminGate'
import { ALUNO_EVENTO_TIPOS, type AlunoEventoTipo } from '@/data/aluno-eventos'
import type { DatabaseAlunoEvento } from '@/types/database'

export const runtime = 'nodejs'

function isTipo(v: unknown): v is AlunoEventoTipo {
  return typeof v === 'string' && (ALUNO_EVENTO_TIPOS as readonly string[]).includes(v)
}

function parseCreateBody(body: Record<string, unknown>): {
  ok: true
  payload: {
    tipo: AlunoEventoTipo
    start_at: string
    end_at: string
    title: string
    series_label: string | null
    description: string
    publicado: boolean
  }
} | { ok: false; message: string } {
  const tipo = body.tipo
  const start_at = body.start_at
  const end_at = body.end_at
  const title = body.title
  const description = body.description

  if (!isTipo(tipo)) {
    return { ok: false, message: 'tipo inválido' }
  }
  if (typeof start_at !== 'string' || !start_at.trim()) {
    return { ok: false, message: 'start_at é obrigatório' }
  }
  if (typeof end_at !== 'string' || !end_at.trim()) {
    return { ok: false, message: 'end_at é obrigatório' }
  }
  if (typeof title !== 'string' || !title.trim()) {
    return { ok: false, message: 'title é obrigatório' }
  }
  if (typeof description !== 'string' || !description.trim()) {
    return { ok: false, message: 'description é obrigatório' }
  }

  const startMs = Date.parse(start_at)
  const endMs = Date.parse(end_at)
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { ok: false, message: 'Datas inválidas' }
  }
  if (endMs <= startMs) {
    return { ok: false, message: 'end_at deve ser posterior a start_at' }
  }

  const seriesRaw = body.series_label
  const series_label =
    typeof seriesRaw === 'string' && seriesRaw.trim() ? seriesRaw.trim() : null

  const pub = body.publicado
  const publicado = pub === false ? false : true

  return {
    ok: true,
    payload: {
      tipo,
      start_at: new Date(start_at).toISOString(),
      end_at: new Date(end_at).toISOString(),
      title: title.trim(),
      series_label,
      description: description.trim(),
      publicado,
    },
  }
}

/** GET — lista todos os eventos (inclui rascunhos não publicados). */
export async function GET(request: Request) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { data, error } = await gate.supabase
    .from('aluno_eventos')
    .select('*')
    .order('start_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message, eventos: [] }, { status: 500 })
  }

  return NextResponse.json({ eventos: (data || []) as DatabaseAlunoEvento[] })
}

/** POST — cria evento. */
export async function POST(request: Request) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = parseCreateBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 })
  }

  const { data, error } = await gate.supabase
    .from('aluno_eventos')
    .insert(parsed.payload)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ evento: data as DatabaseAlunoEvento })
}
