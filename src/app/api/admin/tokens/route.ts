import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

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
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se é admin
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

    // Parsear query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const filterUserId = searchParams.get('userId')

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
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filtros
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (filterUserId) {
      query = query.eq('user_id', filterUserId)
    }

    // Se não houver filtros de data, buscar apenas os últimos 30 dias por padrão
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('created_at', thirtyDaysAgo.toISOString())
    }

    // Buscar todos os registros usando paginação (Supabase tem limite padrão de 1000)
    // Vamos buscar em lotes de 1000 até obter todos
    let allRecords: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true
    let totalCount = 0
    let queryError: any = null

    // Primeiro, obter o count total
    const countQuery = supabase
      .from('openai_token_usage')
      .select('*', { count: 'exact', head: true })
    
    // Aplicar os mesmos filtros
    if (startDate) {
      countQuery.gte('created_at', startDate)
    }
    if (endDate) {
      countQuery.lte('created_at', endDate)
    }
    if (filterUserId) {
      countQuery.eq('user_id', filterUserId)
    }
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      countQuery.gte('created_at', thirtyDaysAgo.toISOString())
    }
    
    const { count: initialCount } = await countQuery
    totalCount = initialCount || 0
    console.log(`[API /admin/tokens] Total de registros no banco: ${totalCount}`)

    // Agora buscar em páginas
    while (hasMore) {
      // Construir query para esta página
      let pageQuery = supabase
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
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      // Aplicar os mesmos filtros
      if (startDate) {
        pageQuery = pageQuery.gte('created_at', startDate)
      }
      if (endDate) {
        pageQuery = pageQuery.lte('created_at', endDate)
      }
      if (filterUserId) {
        pageQuery = pageQuery.eq('user_id', filterUserId)
      }
      if (!startDate && !endDate) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        pageQuery = pageQuery.gte('created_at', thirtyDaysAgo.toISOString())
      }

      const { data: pageRecords, error: pageError } = await pageQuery

      if (pageError) {
        console.error(`[API /admin/tokens] Erro na página ${page}:`, pageError)
        queryError = pageError
        // Se for erro na primeira página, retornar erro
        if (page === 0) {
          break
        }
        // Se for erro em página subsequente, parar e retornar o que temos
        break
      }

      if (!pageRecords || pageRecords.length === 0) {
        hasMore = false
      } else {
        allRecords = [...allRecords, ...pageRecords]
        const oldestRecord = pageRecords[pageRecords.length - 1]
        const oldestDate = oldestRecord ? new Date(oldestRecord.created_at).toLocaleDateString('pt-BR') : 'N/A'
        console.log(`[API /admin/tokens] Página ${page + 1}: ${pageRecords.length} registros (Total acumulado: ${allRecords.length}, Registro mais antigo: ${oldestDate})`)
        
        // Se retornou menos que pageSize, não há mais páginas
        if (pageRecords.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      }
    }

    const records = allRecords
    const error = queryError
    
    console.log(`[API /admin/tokens] Total de registros carregados: ${records.length} de ${totalCount}`)
    
    if (error) {
      console.error('Erro ao buscar tokens:', error)
      console.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: 'Erro ao buscar dados de tokens',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }

    // ====================================================
    // BUSCAR DADOS DOS USUÁRIOS (QUERY SEPARADA)
    // ====================================================

    // Coletar todos os user_ids únicos
    const userIds = [...new Set((records || []).map((r: any) => r.user_id).filter(Boolean))]
    
    // Buscar dados dos usuários
    let usersMap = new Map<string, { name: string; email: string }>()
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError)
        console.error('Detalhes do erro de usuários:', {
          message: usersError.message,
          details: usersError.details,
          hint: usersError.hint,
          code: usersError.code
        })
        // Continuar mesmo se falhar, usando valores padrão
      } else if (users) {
        users.forEach((user) => {
          usersMap.set(user.id, {
            name: user.name || 'Desconhecido',
            email: user.email || 'N/A',
          })
        })
      }
    }

    // ====================================================
    // PROCESSAR E FORMATAR DADOS
    // ====================================================

    const formattedRecords = (records || []).map((record: any) => {
      const userData = usersMap.get(record.user_id) || {
        name: 'Desconhecido',
        email: 'N/A',
      }

      return {
        id: record.id,
        user_name: userData.name,
        user_email: userData.email,
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
      }
    })

    // ====================================================
    // CALCULAR ESTATÍSTICAS GERAIS
    // ====================================================

    console.log(`[API /admin/tokens] Calculando summary com ${formattedRecords.length} registros formatados`)

    const totalRequests = formattedRecords.length
    const totalTokens = formattedRecords.reduce(
      (sum, r) => sum + r.total_tokens,
      0
    )
    const totalCost = formattedRecords.reduce(
      (sum, r) => sum + r.estimated_cost_usd,
      0
    )

    console.log(`[API /admin/tokens] Summary calculado: ${totalRequests} requisições, ${totalTokens} tokens, $${totalCost.toFixed(6)} custo`)

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

    console.log(`[API /admin/tokens] Top alunos: ${byUser.length} usuários únicos`)

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

    console.log(`[API /admin/tokens] Features: ${byFeature.length} features únicas`)

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
    console.error('Erro detalhado:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    
    if (error.message?.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    
    // Retornar mensagem de erro mais detalhada em desenvolvimento
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro ao buscar estatísticas de tokens: ${error?.message || 'Erro desconhecido'}`
      : 'Erro ao buscar estatísticas de tokens'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}




