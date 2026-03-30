import { NextResponse } from 'next/server'
import { requireAdminGate } from '@/lib/server/requireAdminGate'
import { calculateLevel } from '@/lib/gamification'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

/**
 * DELETE /api/admin/curso-desafio-conclusoes/[id]
 * Remove um envio de conclusão de módulo (somente admin).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.info('[admin delete envio] start')
  const gate = await requireAdminGate(request)
  if (!gate.ok) return gate.response
  const db = (() => {
    try {
      return getSupabaseAdmin()
    } catch {
      return gate.supabase
    }
  })()

  const { id } = await params
  const conclusaoId = typeof id === 'string' ? id.trim() : ''
  console.info('[admin delete envio] params', { conclusaoId, adminUserId: gate.userId })
  if (!conclusaoId) {
    console.warn('[admin delete envio] invalid id')
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { data: conclusao, error: conclusaoErr } = await db
    .from('curso_desafio_conclusoes')
    .select('id, user_id, cursos_desafio_id')
    .eq('id', conclusaoId)
    .maybeSingle()
  if (conclusaoErr) {
    console.error('[admin delete envio] fetch conclusao error', conclusaoErr)
    return NextResponse.json({ error: 'Não foi possível localizar o envio' }, { status: 500 })
  }
  if (!conclusao) {
    console.warn('[admin delete envio] conclusao not found', { conclusaoId })
    return NextResponse.json({ error: 'Envio não encontrado' }, { status: 404 })
  }
  console.info('[admin delete envio] conclusao found', {
    conclusaoId: conclusao.id,
    userId: conclusao.user_id,
    cursosDesafioId: conclusao.cursos_desafio_id,
  })

  const { data: deletedRows, error } = await db
    .from('curso_desafio_conclusoes')
    .delete()
    .eq('id', conclusaoId)
    .select('id')
  if (error) {
    console.error('[admin delete envio] delete conclusao error', error)
    return NextResponse.json({ error: 'Não foi possível excluir o envio' }, { status: 500 })
  }
  const deletedCount = deletedRows?.length ?? 0
  console.info('[admin delete envio] conclusao deleted', { conclusaoId, deletedCount })
  if (deletedCount === 0) {
    console.error('[admin delete envio] delete returned zero rows', { conclusaoId })
    return NextResponse.json(
      { error: 'Não foi possível confirmar a exclusão do envio.' },
      { status: 500 }
    )
  }

  const { data: stillThere, error: verifyErr } = await db
    .from('curso_desafio_conclusoes')
    .select('id')
    .eq('id', conclusaoId)
    .maybeSingle()
  if (verifyErr) {
    console.error('[admin delete envio] verify delete error', verifyErr)
    return NextResponse.json(
      { error: 'Exclusão executada, mas não foi possível verificar o resultado.' },
      { status: 500 }
    )
  }
  if (stillThere) {
    console.error('[admin delete envio] row still exists after delete', { conclusaoId })
    return NextResponse.json(
      { error: 'A base não confirmou a exclusão do envio.' },
      { status: 500 }
    )
  }

  const { data: xpByModulo, error: xpByModuloErr } = await db
    .from('user_xp_history')
    .select('id, amount')
    .eq('user_id', conclusao.user_id)
    .eq('source', 'bonificacao')
    .eq('source_id', conclusao.cursos_desafio_id)

  if (xpByModuloErr) {
    console.error('[admin delete envio] find xp by modulo error', xpByModuloErr)
    return NextResponse.json(
      { error: 'Envio excluído, mas não foi possível processar a remoção do XP' },
      { status: 500 }
    )
  }

  // Compatibilidade legado: havia histórico com source_id = aluno_planos_estudo.id.
  const { data: planos, error: planosErr } = await db
    .from('aluno_planos_estudo')
    .select('id')
    .eq('user_id', conclusao.user_id)
    .eq('cursos_desafio_id', conclusao.cursos_desafio_id)

  if (planosErr) {
    console.error('[admin delete envio] find planos error', planosErr)
    return NextResponse.json(
      { error: 'Envio excluído, mas não foi possível processar a remoção do XP' },
      { status: 500 }
    )
  }

  const planIds = (planos ?? []).map((p) => p.id).filter(Boolean)
  let xpByPlanIds: Array<{ id: string; amount: number | null }> = []
  if (planIds.length > 0) {
    const { data: xpLegacy, error: xpLegacyErr } = await db
      .from('user_xp_history')
      .select('id, amount')
      .eq('user_id', conclusao.user_id)
      .eq('source', 'bonificacao')
      .in('source_id', planIds)

    if (xpLegacyErr) {
      console.error('[admin delete envio] find xp by planIds error', xpLegacyErr)
      return NextResponse.json(
        { error: 'Envio excluído, mas não foi possível processar a remoção do XP' },
        { status: 500 }
      )
    }
    xpByPlanIds = xpLegacy ?? []
  }

  const xpMap = new Map<string, number>()
  for (const row of [...(xpByModulo ?? []), ...xpByPlanIds]) {
    xpMap.set(row.id, typeof row.amount === 'number' ? row.amount : 0)
  }

  const xpIds = [...xpMap.keys()]
  const xpTotalRemovido = [...xpMap.values()].reduce((acc, amount) => acc + amount, 0)
  console.info('[admin delete envio] xp rows', {
    count: xpIds.length,
    xpTotalRemovido,
    userId: conclusao.user_id,
    sourceId: conclusao.cursos_desafio_id,
    legacyPlanIdsCount: planIds.length,
  })

  if (xpIds.length > 0) {
    const { error: xpDeleteErr } = await db.from('user_xp_history').delete().in('id', xpIds)
    if (xpDeleteErr) {
      console.error('[admin delete envio] delete xp error', xpDeleteErr)
      return NextResponse.json(
        { error: 'Envio excluído, mas não foi possível remover o XP associado' },
        { status: 500 }
      )
    }
    console.info('[admin delete envio] xp deleted', { count: xpIds.length })

    const { data: profile, error: profileErr } = await db
      .from('users')
      .select('xp, xp_mensal')
      .eq('id', conclusao.user_id)
      .maybeSingle()

    if (profileErr || !profile) {
      console.error('[admin delete envio] profile fetch error', { profileErr, profile })
      return NextResponse.json(
        { error: 'Envio e XP removidos, mas não foi possível sincronizar o perfil do aluno' },
        { status: 500 }
      )
    }

    const currentXp = typeof profile.xp === 'number' ? profile.xp : 0
    const currentXpMensal = typeof profile.xp_mensal === 'number' ? profile.xp_mensal : 0
    const nextXp = Math.max(0, currentXp - xpTotalRemovido)
    const nextXpMensal = Math.max(0, currentXpMensal - xpTotalRemovido)
    const nextLevel = calculateLevel(nextXp)

    const { error: syncErr } = await db
      .from('users')
      .update({ xp: nextXp, xp_mensal: nextXpMensal, level: nextLevel })
      .eq('id', conclusao.user_id)

    if (syncErr) {
      console.error('[admin delete envio] profile sync error', syncErr)
      return NextResponse.json(
        { error: 'Envio e XP removidos, mas não foi possível sincronizar o perfil do aluno' },
        { status: 500 }
      )
    }
    console.info('[admin delete envio] profile synced', {
      userId: conclusao.user_id,
      nextXp,
      nextXpMensal,
      nextLevel,
    })
  }

  console.info('[admin delete envio] done', { conclusaoId, xpTotalRemovido })
  return NextResponse.json({ success: true, xp_removed: xpTotalRemovido })
}
