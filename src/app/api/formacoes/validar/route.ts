import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { getUsersBySubdomain } from '@/lib/hotmart'
import { FORMACAO_GATE_ADMIN_VALIDATE_MODE_HEADER } from '@/lib/formacao/formacaoGateAdminTest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ValidateBody = {
  email?: string
  subdomain?: string
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token de acesso não fornecido' }, { status: 401 })
    }

    const supabase = await getSupabaseClient(accessToken)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    const body = (await request.json().catch(() => ({}))) as ValidateBody
    const email = String(body.email ?? '').trim().toLowerCase()
    const subdomain = String(body.subdomain ?? '').trim()

    if (!email || !subdomain) {
      return NextResponse.json(
        { error: 'email e subdomain são obrigatórios', validated: false },
        { status: 400 }
      )
    }

    const adminValidateMode = request.headers.get(FORMACAO_GATE_ADMIN_VALIDATE_MODE_HEADER)?.trim()
    const isAdmin = profile?.role === 'admin'

    // Admin: resultado do fluxo é simulado pelo toggle (success/fail), sem Hotmart e sem UPDATE de role.
    if (isAdmin && (adminValidateMode === 'success' || adminValidateMode === 'fail')) {
      if (adminValidateMode === 'fail') {
        return NextResponse.json({
          success: true,
          validated: false,
          reason: 'email_not_found',
          admin_test_matricula_simulada: true,
        })
      }
      return NextResponse.json({
        success: true,
        validated: true,
        role: 'admin',
        admin_test_matricula_simulada: true,
      })
    }

    const users = await getUsersBySubdomain(subdomain)
    const matched = users.find((u) => u.email.trim().toLowerCase() === email)

    if (!matched) {
      return NextResponse.json({
        success: true,
        validated: false,
        reason: 'email_not_found',
      })
    }

    if (matched.status !== 'ACTIVE') {
      return NextResponse.json({
        success: true,
        validated: false,
        reason: 'status_not_active',
        status: matched.status,
      })
    }

    // Admin nunca muda para `formacao`; apenas confirmamos sucesso do fluxo.
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        validated: true,
        role: 'admin',
        admin_test_matricula_simulada: true,
      })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'formacao', updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('[API /formacoes/validar] erro ao atualizar role:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar role do usuário' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      validated: true,
      role: 'formacao',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao validar formação'
    if (message.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('[API /formacoes/validar]', error)
    return NextResponse.json({ error: message, validated: false }, { status: 500 })
  }
}

