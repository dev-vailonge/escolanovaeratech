import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { insertXpEntry } from '@/lib/server/gamification'

/**
 * POST /api/admin/bonificacao
 * Concede XP (bonificação) a um ou mais alunos por email.
 * Body: { emails: string, motivo: string, amount: number }
 * - emails: um ou mais emails separados por vírgula
 * - motivo: descrição do motivo da bonificação (gravado em description)
 * - amount: quantidade de XP a conceder
 * Requer: Admin
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const emailsRaw = typeof body.emails === 'string' ? body.emails : ''
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)

    if (!emailsRaw.trim()) {
      return NextResponse.json(
        { error: 'Informe ao menos um email.' },
        { status: 400 }
      )
    }
    if (!motivo) {
      return NextResponse.json(
        { error: 'Informe o motivo da bonificação.' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(amount) || amount < 1) {
      return NextResponse.json(
        { error: 'Informe uma quantidade de XP válida (número maior que zero).' },
        { status: 400 }
      )
    }

    const emails = emailsRaw
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean)

    const notFoundEmails: string[] = []
    const found: { email: string; userId: string }[] = []

    for (const email of emails) {
      const { data: u } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      if (u?.id) {
        found.push({ email, userId: u.id })
      } else {
        notFoundEmails.push(email)
      }
    }

    for (const { userId: targetUserId } of found) {
      await insertXpEntry({
        userId: targetUserId,
        source: 'bonificacao',
        sourceId: userId,
        amount,
        description: motivo,
        accessToken: accessToken ?? undefined,
      })
    }

    return NextResponse.json({
      success: true,
      rewardedCount: found.length,
      notFoundEmails,
    })
  } catch (err: unknown) {
    console.error('[api/admin/bonificacao]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar bonificação.' },
      { status: 500 }
    )
  }
}
