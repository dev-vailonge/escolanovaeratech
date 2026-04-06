import { NextResponse } from 'next/server'
import { requireAdminGate } from '@/lib/server/requireAdminGate'
import { ALUNO_EVENTO_TIPOS, type AlunoEventoTipo } from '@/data/aluno-eventos'
import type { DatabaseAlunoEvento } from '@/types/database'

export const runtime = 'nodejs'

function isTipo(v: unknown): v is AlunoEventoTipo {
  return typeof v === 'string' && (ALUNO_EVENTO_TIPOS as readonly string[]).includes(v)
}

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Ctx) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.tipo !== undefined) {
    if (!isTipo(body.tipo)) {
      return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
    }
    updates.tipo = body.tipo
  }
  if (body.start_at !== undefined) {
    if (typeof body.start_at !== 'string' || !body.start_at.trim()) {
      return NextResponse.json({ error: 'start_at inválido' }, { status: 400 })
    }
    updates.start_at = new Date(body.start_at).toISOString()
  }
  if (body.end_at !== undefined) {
    if (typeof body.end_at !== 'string' || !body.end_at.trim()) {
      return NextResponse.json({ error: 'end_at inválido' }, { status: 400 })
    }
    updates.end_at = new Date(body.end_at).toISOString()
  }
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'title inválido' }, { status: 400 })
    }
    updates.title = body.title.trim()
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || !body.description.trim()) {
      return NextResponse.json({ error: 'description inválido' }, { status: 400 })
    }
    updates.description = body.description.trim()
  }
  if (body.series_label !== undefined) {
    const s = body.series_label
    if (s === null || s === '') {
      updates.series_label = null
    } else if (typeof s === 'string') {
      updates.series_label = s.trim() || null
    } else {
      return NextResponse.json({ error: 'series_label inválido' }, { status: 400 })
    }
  }
  if (body.publicado !== undefined) {
    if (typeof body.publicado !== 'boolean') {
      return NextResponse.json({ error: 'publicado deve ser boolean' }, { status: 400 })
    }
    updates.publicado = body.publicado
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const { data: current } = await gate.supabase
    .from('aluno_eventos')
    .select('start_at,end_at')
    .eq('id', id)
    .single()

  const start =
    (updates.start_at as string | undefined) ?? (current as { start_at?: string } | null)?.start_at
  const end =
    (updates.end_at as string | undefined) ?? (current as { end_at?: string } | null)?.end_at
  if (start && end && Date.parse(end) <= Date.parse(start)) {
    return NextResponse.json(
      { error: 'end_at deve ser posterior a start_at' },
      { status: 400 }
    )
  }

  const { data, error } = await gate.supabase
    .from('aluno_eventos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ evento: data as DatabaseAlunoEvento })
}

export async function DELETE(request: Request, context: Ctx) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  }

  const { data: deleted, error } = await gate.supabase
    .from('aluno_eventos')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!deleted?.length) {
    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
