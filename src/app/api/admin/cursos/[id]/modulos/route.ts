import { NextResponse } from 'next/server'
import { requireAdminGate } from '@/lib/server/requireAdminGate'
import { PayloadError } from '@/lib/admin/formacaoCursosPayload'
import { buildModuloCursosDesafioInsert } from '@/lib/admin/buildModuloCursosDesafioRow'

type RouteCtx = { params: Promise<{ id: string }> }

/**
 * POST /api/admin/cursos/[id]/modulos — cria linha em cursos_desafios
 */
export async function POST(request: Request, context: RouteCtx) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { id: curso_id } = await context.params
  if (!curso_id) {
    return NextResponse.json({ error: 'ID do curso inválido' }, { status: 400 })
  }

  const { supabase } = gate

  const { data: curso } = await supabase.from('cursos').select('id').eq('id', curso_id).maybeSingle()
  if (!curso) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const row = buildModuloCursosDesafioInsert(curso_id, body)

    const { data, error } = await supabase.from('cursos_desafios').insert(row).select('*').single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Já existe um módulo com este slug neste curso.' },
          { status: 409 }
        )
      }
      console.error('[admin/cursos/[id]/modulos POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ modulo: data })
  } catch (e: unknown) {
    if (e instanceof PayloadError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('[admin/cursos/[id]/modulos POST]', e)
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }
}
