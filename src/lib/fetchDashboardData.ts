import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  return createServerComponentClient({ cookies })
}

export async function fetchDashboardData(page = 1, itemsPerPage = 20) {
  const supabase = createServerSupabaseClient()
  // Get all data for the last 15 days (for graph, stats, etc.)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 14)
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  let leads = []
  try {
    // Fetch all leads with pagination to handle large datasets
    let allLeads: any[] = []
    let page = 0
    const pageSize = 1000
    
    while (true) {
      const { data: leadsRes, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false })
      
      if (leadsError) {
        throw leadsError
      }
      
      if (!leadsRes || leadsRes.length === 0) {
        break
      }
      
      allLeads = allLeads.concat(leadsRes)
      
      if (leadsRes.length < pageSize) {
        break
      }
      
      page++
    }
    
    leads = allLeads || []
  } catch (error) {
    return {
      stats: { totalLeads: 0, monthlyLeads: 0, weeklyLeads: 0 },
      leadsGraph: [],
      topSources: [],
      topAffiliates: [],
      leadsTable: [],
      monthlyComparison: []
    }
  }

  // Stats
  const totalLeads = leads.length
  const monthlyLeads = leads.filter(l => l.created_at >= startOfMonth.toISOString() && l.created_at <= endOfMonth.toISOString()).length
  const weeklyLeads = leads.filter(l => l.created_at >= startOfWeek.toISOString() && l.created_at <= endOfWeek.toISOString()).length
  const stats = { totalLeads, monthlyLeads, weeklyLeads }

  // Leads Graph (last 15 days)
  const leadsGraph = []
  for (let i = 0; i < 15; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (14 - i))
    const dateStr = formatDate(date)
    const leadsCount = leads.filter((item) => item.created_at?.split('T')[0] === dateStr).length
    leadsGraph.push({ date: dateStr, leads: leadsCount })
  }

  // Top Sources
  const allSources = leads.map(item => item.source || 'Não informado')
  const sourceCounts = allSources.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count: Number(count) }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5)

  // Top UTM Sources
  const allUtmSources = leads.map(item => item.utm_source || 'Não informado')
  const utmSourceCounts = allUtmSources.reduce((acc, utmSource) => {
    acc[utmSource] = (acc[utmSource] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topAffiliates = Object.entries(utmSourceCounts)
    .map(([utmSource, count]) => ({ utmSource, count: Number(count) }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5)

  // Leads Table (paginated, sorted by created_at desc)
  const sortedLeads = leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const leadsTable = sortedLeads.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Monthly Comparison (last 12 months)
  const monthlyComparison = []
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    
    const monthLeads = leads.filter(l => 
      l.created_at >= startOfMonth.toISOString() && l.created_at <= endOfMonth.toISOString()
    ).length
    
    monthlyComparison.push({
      month: monthNames[date.getMonth()],
      total: monthLeads
    })
  }

  return { stats, leadsGraph, topSources, topAffiliates, leadsTable, monthlyComparison }
} 