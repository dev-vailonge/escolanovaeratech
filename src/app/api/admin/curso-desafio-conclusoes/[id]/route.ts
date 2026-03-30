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
  if (!conclusaoId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const { data: conclusao, error: conclusaoErr } = await db
    .from('curso_desafio_conclusoes')
    .select('id, user_id, cursos_desafio_id')
    .eq('id', conclusaoId)
    .maybeSingle()
  if (conclusaoErr) {
    return NextResponse.json({ error: 'Não foi possível localizar o envio' }, { status: 500 })
  }
  if (!conclusao) {
    return NextResponse.json({ error: 'Envio não encontrado' }, { status: 404 })
  }

  const { data: deletedRows, error } = await db
    .from('curso_desafio_conclusoes')
    .delete()
    .eq('id', conclusaoId)
    .select('id')
  if (error) {
    return NextResponse.json({ error: 'Não foi possível excluir o envio' }, { status: 500 })
  }
  const deletedCount = deletedRows?.length ?? 0
  if (deletedCount === 0) {
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
    return NextResponse.json(
      { error: 'Exclusão executada, mas não foi possível verificar o resultado.' },
      { status: 500 }
    )
  }
  if (stillThere) {
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

  if (xpIds.length > 0) {
    const { error: xpDeleteErr } = await db.from('user_xp_history').delete().in('id', xpIds)
    if (xpDeleteErr) {
      return NextResponse.json(
        { error: 'Envio excluído, mas não foi possível remover o XP associado' },
        { status: 500 }
      )
    }
    const { data: profile, error: profileErr } = await db
      .from('users')
      .select('xp, xp_mensal')
      .eq('id', conclusao.user_id)
      .maybeSingle()

    if (profileErr || !profile) {
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
      return NextResponse.json(
        { error: 'Envio e XP removidos, mas não foi possível sincronizar o perfil do aluno' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true, xp_removed: xpTotalRemovido })
}
