import { NextResponse } from 'next/server'
import { requireAdminGate } from '@/lib/server/requireAdminGate'
import { PayloadError } from '@/lib/admin/formacaoCursosPayload'
import { buildModuloCursosDesafioPatch } from '@/lib/admin/buildModuloCursosDesafioRow'

type RouteCtx = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/cursos-desafios/[id] — atualiza módulo (cursos_desafios)
 */
export async function PATCH(request: Request, context: RouteCtx) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { supabase } = gate

  try {
    const body = (await request.json()) as Record<string, unknown>
    const patch = buildModuloCursosDesafioPatch(body)

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cursos_desafios')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Conflito de slug único neste curso.' },
          { status: 409 }
        )
      }
      console.error('[admin/cursos-desafios/[id] PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ modulo: data })
  } catch (e: unknown) {
    if (e instanceof PayloadError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('[admin/cursos-desafios/[id] PATCH]', e)
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/cursos-desafios/[id]
 */
export async function DELETE(request: Request, context: RouteCtx) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { supabase } = gate

  const { data: row } = await supabase.from('cursos_desafios').select('id, curso_id').eq('id', id).maybeSingle()

  if (!row) {
    return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
  }

  await supabase.from('cursos').update({ desafio_destaque_id: null }).eq('desafio_destaque_id', id)

  const { error } = await supabase.from('cursos_desafios').delete().eq('id', id)

  if (error) {
    console.error('[admin/cursos-desafios/[id] DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
