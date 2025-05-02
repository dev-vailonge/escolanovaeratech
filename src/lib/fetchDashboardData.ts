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

  let waitingList = []
  let iscas = []
  try {
    const { data: waitingListRes } = await supabase.from('waiting_list').select('*')
    const { data: iscasRes } = await supabase.from('iscas').select('*')
    waitingList = waitingListRes || []
    iscas = iscasRes || []
  } catch (error) {
    console.error('Error fetching data from Supabase:', error)
    return {
      stats: { totalLeads: 0, monthlyLeads: 0, weeklyLeads: 0 },
      leadsGraph: [],
      topSources: [],
      topAffiliates: [],
      leadsTable: []
    }
  }

  // Stats
  const totalLeads = waitingList.length + iscas.length
  const monthlyLeads = waitingList.filter(l => l.created_at >= startOfMonth.toISOString() && l.created_at <= endOfMonth.toISOString()).length +
    iscas.filter(l => l.created_at >= startOfMonth.toISOString() && l.created_at <= endOfMonth.toISOString()).length
  const weeklyLeads = waitingList.filter(l => l.created_at >= startOfWeek.toISOString() && l.created_at <= endOfWeek.toISOString()).length +
    iscas.filter(l => l.created_at >= startOfWeek.toISOString() && l.created_at <= endOfWeek.toISOString()).length
  const stats = { totalLeads, monthlyLeads, weeklyLeads }

  // Leads Graph (last 15 days)
  const leadsGraph = []
  for (let i = 0; i < 15; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (14 - i))
    const dateStr = formatDate(date)
    const iscasCount = iscas.filter((item) => item.created_at?.split('T')[0] === dateStr).length
    const waitingListCount = waitingList.filter((item) => item.created_at?.split('T')[0] === dateStr).length
    leadsGraph.push({ date: dateStr, iscas: iscasCount, waiting_list: waitingListCount })
  }

  // Top Sources
  const allSources = [...waitingList, ...iscas].map(item => item.source || 'Não informado')
  const sourceCounts = allSources.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count: Number(count) }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5)

  // Top Affiliates
  const allAffiliates = [...waitingList, ...iscas].map(item => item.affiliate || 'Não informado')
  const affiliateCounts = allAffiliates.reduce((acc, affiliate) => {
    acc[affiliate] = (acc[affiliate] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topAffiliates = Object.entries(affiliateCounts)
    .map(([affiliate, count]) => ({ affiliate, count: Number(count) }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5)

  // Leads Table (paginated, sorted by created_at desc)
  const allLeads = [
    ...waitingList.map(lead => ({ ...lead, table: 'waiting_list' })),
    ...iscas.map(lead => ({ ...lead, table: 'iscas' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const leadsTable = allLeads.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return { stats, leadsGraph, topSources, topAffiliates, leadsTable }
} 