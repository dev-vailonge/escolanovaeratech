import { fetchDashboardData } from '@/lib/fetchDashboardData'
import ClientSidebar from './ClientSidebar'
import DashboardContent from './DashboardContent'


export default async function DashboardPage() {
  const data = await fetchDashboardData()
  console.log('Dashboard fetched data:', JSON.stringify(data, null, 2))
  return (
    <ClientSidebar>
      <DashboardContent
        stats={data.stats}
        topSources={data.topSources}
        topAffiliates={data.topAffiliates}
        leadsGraph={data.leadsGraph}
        leadsTable={data.leadsTable}
      />
    </ClientSidebar>
  )
} 