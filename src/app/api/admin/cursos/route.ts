import { NextResponse } from 'next/server'
import { requireAdminGate } from '@/lib/server/requireAdminGate'
import { asStringArrayJsonb, PayloadError, slugifyCursoSlug } from '@/lib/admin/formacaoCursosPayload'

/**
 * GET /api/admin/cursos — lista cursos (admin)
 */
export async function GET(request: Request) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { supabase } = gate

  const { data, error } = await supabase
    .from('cursos')
    .select(
      'id, slug, nome, descricao_curta, ativo, ordem, xp_maximo, tags, desafio_destaque_id, created_at, updated_at'
    )
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('[admin/cursos GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cursos: data ?? [] })
}

/**
 * POST /api/admin/cursos — cria curso
 */
export async function POST(request: Request) {
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response

  const { supabase } = gate

  try {
    const body = await request.json()

    const slug = slugifyCursoSlug(String(body.slug ?? ''))
    const nome = String(body.nome ?? '').trim()
    if (!nome) {
      return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 })
    }

    const descricao_curta =
      body.descricao_curta === undefined || body.descricao_curta === null
        ? null
        : String(body.descricao_curta).trim() || null

    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)
    const ordem =
      body.ordem === undefined || body.ordem === null ? null : Number(body.ordem)
    const xp_maximo =
      body.xp_maximo === undefined || body.xp_maximo === null
        ? 0
        : Math.max(0, Math.floor(Number(body.xp_maximo)))

    let tags: unknown = []
    try {
      tags = asStringArrayJsonb(body.tags, [])
    } catch (e) {
      if (e instanceof PayloadError) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
      throw e
    }

    const desafio_destaque_id =
      body.desafio_destaque_id === undefined || body.desafio_destaque_id === null
        ? null
        : String(body.desafio_destaque_id).trim() || null

    const row = {
      slug,
      nome,
      descricao_curta,
      ativo,
      ordem: Number.isFinite(ordem as number) ? ordem : null,
      xp_maximo,
      tags,
      desafio_destaque_id,
    }

    const { data, error } = await supabase.from('cursos').insert(row).select('*').single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe um curso com este slug.' }, { status: 409 })
      }
      console.error('[admin/cursos POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ curso: data })
  } catch (e: unknown) {
    if (e instanceof PayloadError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('[admin/cursos POST]', e)
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }
}
