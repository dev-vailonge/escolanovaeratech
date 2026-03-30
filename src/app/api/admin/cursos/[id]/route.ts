import { NextResponse } from 'next/server'
import { requireAdminGate } from '@/lib/server/requireAdminGate'
import {
  asStringArrayJsonb,
  PayloadError,
  slugifyCursoSlug,
} from '@/lib/admin/formacaoCursosPayload'

type RouteCtx = { params: Promise<{ id: string }> }

/**
 * GET /api/admin/cursos/[id] — curso + módulos (cursos_desafios)
 */
export async function GET(request: Request, context: RouteCtx) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { supabase } = gate

  const { data: curso, error: cursoErr } = await supabase.from('cursos').select('*').eq('id', id).maybeSingle()

  if (cursoErr) {
    console.error('[admin/cursos/[id] GET]', cursoErr)
    return NextResponse.json({ error: cursoErr.message }, { status: 500 })
  }

  if (!curso) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const { data: modulos, error: modErr } = await supabase
    .from('cursos_desafios')
    .select('*')
    .eq('curso_id', id)
    .order('ordem', { ascending: true })

  if (modErr) {
    console.error('[admin/cursos/[id] GET modulos]', modErr)
    return NextResponse.json({ error: modErr.message }, { status: 500 })
  }

  return NextResponse.json({ curso, modulos: modulos ?? [] })
}

/**
 * PATCH /api/admin/cursos/[id]
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
    const body = await request.json()
    const patch: Record<string, unknown> = {}

    if (body.slug !== undefined) {
      patch.slug = slugifyCursoSlug(String(body.slug))
    }
    if (body.nome !== undefined) {
      const nome = String(body.nome).trim()
      if (!nome) {
        return NextResponse.json({ error: 'nome não pode ser vazio' }, { status: 400 })
      }
      patch.nome = nome
    }
    if (body.descricao_curta !== undefined) {
      patch.descricao_curta =
        body.descricao_curta === null ? null : String(body.descricao_curta).trim() || null
    }
    if (body.ativo !== undefined) {
      patch.ativo = Boolean(body.ativo)
    }
    if (body.ordem !== undefined) {
      patch.ordem =
        body.ordem === null ? null : Number.isFinite(Number(body.ordem)) ? Number(body.ordem) : null
    }
    if (body.xp_maximo !== undefined) {
      patch.xp_maximo = Math.max(0, Math.floor(Number(body.xp_maximo)))
    }
    if (body.tags !== undefined) {
      try {
        patch.tags = asStringArrayJsonb(body.tags, [])
      } catch (e) {
        if (e instanceof PayloadError) {
          return NextResponse.json({ error: e.message }, { status: 400 })
        }
        throw e
      }
    }
    if (body.desafio_destaque_id !== undefined) {
      patch.desafio_destaque_id =
        body.desafio_destaque_id === null ? null : String(body.desafio_destaque_id).trim() || null
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase.from('cursos').update(patch).eq('id', id).select('*').single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe um curso com este slug.' }, { status: 409 })
      }
      console.error('[admin/cursos/[id] PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ curso: data })
  } catch (e: unknown) {
    if (e instanceof PayloadError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('[admin/cursos/[id] PATCH]', e)
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/cursos/[id] — remove módulos e o curso
 */
export async function DELETE(request: Request, context: RouteCtx) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { supabase } = gate

  const { data: exists } = await supabase.from('cursos').select('id').eq('id', id).maybeSingle()
  if (!exists) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const { error: delModErr } = await supabase.from('cursos_desafios').delete().eq('curso_id', id)

  if (delModErr) {
    console.error('[admin/cursos/[id] DELETE modulos]', delModErr)
    return NextResponse.json({ error: delModErr.message }, { status: 500 })
  }

  const { error: delCursoErr } = await supabase.from('cursos').delete().eq('id', id)

  if (delCursoErr) {
    console.error('[admin/cursos/[id] DELETE]', delCursoErr)
    return NextResponse.json({ error: delCursoErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
