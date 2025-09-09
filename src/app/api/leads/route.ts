import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const source = searchParams.get('source')
    const utm_source = searchParams.get('utm_source')
    const utm_campaign = searchParams.get('utm_campaign')
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (source) {
      query = query.eq('source', source)
    }
    if (utm_source) {
      query = query.eq('utm_source', utm_source)
    }
    if (utm_campaign) {
      query = query.eq('utm_campaign', utm_campaign)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar leads' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('leads')
      .select('source, utm_source, utm_campaign, created_at')

    // Calculate statistics
    const totalLeads = count || 0
    const today = new Date().toISOString().split('T')[0]
    const todayLeads = stats?.filter(lead => 
      lead.created_at?.startsWith(today)
    ).length || 0

    const sourceStats = stats?.reduce((acc, lead) => {
      const source = lead.source || 'unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const utmSourceStats = stats?.reduce((acc, lead) => {
      const utmSource = lead.utm_source || 'unknown'
      acc[utmSource] = (acc[utmSource] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      leads: data || [],
      pagination: {
        page,
        limit,
        total: totalLeads,
        totalPages: Math.ceil(totalLeads / limit)
      },
      statistics: {
        totalLeads,
        todayLeads,
        sourceStats,
        utmSourceStats
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
