import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

/**
 * GET /api/admin/tokens
 * Retorna estatísticas de consumo de tokens da OpenAI
 * 
 * Query params:
 *   - startDate: Data inicial (ISO string) - opcional
 *   - endDate: Data final (ISO string) - opcional
 *   - userId: Filtrar por usuário específico - opcional
 * 
 * Requer: Admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticar usuário
    const adminId = await requireUserIdFromBearer(request)
    const supabase = getSupabaseAdmin()

    // Verificar se é admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (adminError || admin?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    // Parsear query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')

    // ====================================================
    // BUSCAR REGISTROS DE TOKEN USAGE
    // ====================================================

    let query = supabase
      .from('openai_token_usage')
      .select(`
        id,
        user_id,
        feature,
        endpoint,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated_cost_usd,
        metadata,
        created_at,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Filtros
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('Erro ao buscar tokens:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar dados de tokens' },
        { status: 500 }
      )
    }

    // ====================================================
    // PROCESSAR E FORMATAR DADOS
    // ====================================================

    const formattedRecords = (records || []).map((record: any) => ({
      id: record.id,
      user_name: record.users?.name || 'Desconhecido',
      user_email: record.users?.email || 'N/A',
      user_id: record.user_id,
      feature: record.feature,
      endpoint: record.endpoint,
      model: record.model,
      prompt_tokens: record.prompt_tokens,
      completion_tokens: record.completion_tokens,
      total_tokens: record.total_tokens,
      estimated_cost_usd: parseFloat(record.estimated_cost_usd),
      metadata: record.metadata,
      created_at: record.created_at,
    }))

    // ====================================================
    // CALCULAR ESTATÍSTICAS GERAIS
    // ====================================================

    const totalRequests = formattedRecords.length
    const totalTokens = formattedRecords.reduce(
      (sum, r) => sum + r.total_tokens,
      0
    )
    const totalCost = formattedRecords.reduce(
      (sum, r) => sum + r.estimated_cost_usd,
      0
    )

    // ====================================================
    // AGRUPAR POR USUÁRIO
    // ====================================================

    const byUserMap = new Map<
      string,
      { user_name: string; user_email: string; requests: number; tokens: number; cost: number }
    >()

    formattedRecords.forEach((record) => {
      const key = record.user_id
      const existing = byUserMap.get(key) || {
        user_name: record.user_name,
        user_email: record.user_email,
        requests: 0,
        tokens: 0,
        cost: 0,
      }
      existing.requests++
      existing.tokens += record.total_tokens
      existing.cost += record.estimated_cost_usd
      byUserMap.set(key, existing)
    })

    const byUser = Array.from(byUserMap.values()).sort(
      (a, b) => b.cost - a.cost
    )

    // ====================================================
    // AGRUPAR POR FEATURE
    // ====================================================

    const byFeatureMap = new Map<
      string,
      { feature: string; requests: number; tokens: number; cost: number }
    >()

    formattedRecords.forEach((record) => {
      const key = record.feature
      const existing = byFeatureMap.get(key) || {
        feature: key,
        requests: 0,
        tokens: 0,
        cost: 0,
      }
      existing.requests++
      existing.tokens += record.total_tokens
      existing.cost += record.estimated_cost_usd
      byFeatureMap.set(key, existing)
    })

    const byFeature = Array.from(byFeatureMap.values()).sort(
      (a, b) => b.cost - a.cost
    )

    // ====================================================
    // RETORNAR RESPOSTA
    // ====================================================

    return NextResponse.json({
      success: true,
      records: formattedRecords,
      summary: {
        total_requests: totalRequests,
        total_tokens: totalTokens,
        total_cost_usd: totalCost,
        by_user: byUser,
        by_feature: byFeature,
      },
    })
  } catch (error: any) {
    console.error('Erro na API de tokens:', error)
    if (error.message?.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas de tokens' },
      { status: 500 }
    )
  }
}



