import { fetchDashboardData } from '@/lib/fetchDashboardData'
import ClientSidebar from './ClientSidebar'
import DashboardContent from './DashboardContent'
import ExportButton from '@/components/ExportButton'

export default async function DashboardPage() {
  const { stats, leadsGraph, topSources, topAffiliates, leadsTable, monthlyComparison } = await fetchDashboardData()

  return (
    <ClientSidebar>
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">Acompanhe seus leads e métricas de performance</p>
            </div>
            <ExportButton />
          </div>
          <DashboardContent 
            stats={stats} 
            leadsGraph={leadsGraph} 
            topSources={topSources} 
            topAffiliates={topAffiliates} 
            leadsTable={leadsTable}
            monthlyComparison={monthlyComparison || []}
          />
        </div>
      </div>
    </ClientSidebar>
  )
} 