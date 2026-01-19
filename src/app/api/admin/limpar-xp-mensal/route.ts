import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

/**
 * API para limpar e recalcular XP mensal de um usuário
 * 
 * Endpoint: POST /api/admin/limpar-xp-mensal
 * 
 * Body:
 * - email: string - Email do usuário
 * - mes: number (opcional) - Mês a recalcular (1-12, padrão: mês atual)
 * - ano: number (opcional) - Ano a recalcular (padrão: ano atual)
 * - dryRun: boolean - Se true, apenas mostra o que seria feito
 * 
 * Retorna:
 * - xpMensalAnterior: XP mensal antes da correção
 * - xpMensalNovo: XP mensal após recalcular
 * - entradasContadas: Array de entradas que foram contadas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const userId = await requireUserIdFromBearer(request)
    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se o usuário é admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas admins podem executar esta ação.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { email, mes, ano, dryRun = false } = body

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Buscar usuário
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, xp, xp_mensal')
      .eq('email', email)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Determinar mês e ano
    const agora = new Date()
    const mesRecalcular = mes || agora.getMonth() + 1
    const anoRecalcular = ano || agora.getFullYear()

    // Buscar XP mensal atual
    const xpMensalAnterior = targetUser.xp_mensal || 0

    // Buscar TODAS as entradas de XP do mês especificado
    const { data: xpHistory, error: xpError } = await supabaseAdmin
      .from('user_xp_history')
      .select('id, source, source_id, amount, description, created_at')
      .eq('user_id', targetUser.id)

    if (xpError) {
      console.error('Erro ao buscar histórico de XP:', xpError)
      return NextResponse.json({ error: 'Erro ao buscar histórico de XP' }, { status: 500 })
    }

    // Filtrar apenas entradas do mês especificado
    // IMPORTANTE: Incluir todas as entradas do mês, mesmo que source_id não corresponda
    // O problema pode ser que há entradas com source_id incorreto que precisam ser contadas
    const entradasDoMes = (xpHistory || []).filter(entry => {
      const entryDate = new Date(entry.created_at)
      const entryYear = entryDate.getFullYear()
      const entryMonth = entryDate.getMonth() + 1
      return entryYear === anoRecalcular && entryMonth === mesRecalcular
    })
    
    console.log(`📊 [limpar-xp-mensal] Encontradas ${entradasDoMes.length} entradas de XP para ${mesRecalcular}/${anoRecalcular}`)

    // Calcular XP mensal correto
    const xpMensalNovo = entradasDoMes.reduce((sum, entry) => sum + (entry.amount || 0), 0)

    // Preparar resposta
    const entradasContadas = entradasDoMes.map(entry => ({
      id: entry.id,
      source: entry.source,
      source_id: entry.source_id,
      amount: entry.amount,
      description: entry.description,
      created_at: entry.created_at
    }))

    // Aplicar correção se não for dry run
    if (!dryRun) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ xp_mensal: xpMensalNovo })
        .eq('id', targetUser.id)

      if (updateError) {
        console.error('Erro ao atualizar XP mensal:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar XP mensal' }, { status: 500 })
      }
    }

    return NextResponse.json({
      dryRun,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      },
      mes: mesRecalcular,
      ano: anoRecalcular,
      xpMensalAnterior,
      xpMensalNovo,
      diferenca: xpMensalNovo - xpMensalAnterior,
      totalEntradas: entradasContadas.length,
      entradasContadas,
      message: dryRun 
        ? `XP mensal seria recalculado de ${xpMensalAnterior} para ${xpMensalNovo} (dry run)`
        : `XP mensal recalculado de ${xpMensalAnterior} para ${xpMensalNovo}`
    })

  } catch (error: any) {
    console.error('Erro ao limpar XP mensal:', error)
    return NextResponse.json({ 
      error: 'Erro ao limpar XP mensal',
      details: error.message 
    }, { status: 500 })
  }
}
