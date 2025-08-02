import ClientSidebar from '../dashboard/ClientSidebar'
import TopProductsChart from '@/components/TopProductsChart'
import SalesGraph from '@/components/SalesGraph'
import MonthlySalesChart from '@/components/MonthlySalesChart'
import TopPaymentMethodsChart from '@/components/TopPaymentMethodsChart'
import ExportSalesButton from '@/components/ExportSalesButton'

async function fetchSalesData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sales`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch sales data')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching sales data:', error)
    return {
      stats: { totalSales: 0, totalRevenueBRL: 0, totalRevenueUSD: 0, totalRevenue: 0, conversionRate: 0 },
      dailySales: [],
      monthlySales: [],
      topProducts: [],
      topPaymentMethods: []
    }
  }
}

export default async function VendasPage() {
  const { stats, dailySales, monthlySales, topProducts, topPaymentMethods } = await fetchSalesData()

  return (
    <ClientSidebar>
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Vendas</h1>
                <p className="text-gray-400">Gerencie suas vendas e acompanhe o desempenho</p>
              </div>
              <ExportSalesButton />
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm font-medium">Total de Vendas</h3>
              <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm font-medium">Receita Total (BRL)</h3>
              <p className="text-2xl font-bold text-white">
                R$ {stats.totalRevenueBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm font-medium">Receita Total (USD)</h3>
              <p className="text-2xl font-bold text-white">
                $ {stats.totalRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-gray-400 text-sm font-medium">Taxa de Conversão</h3>
              <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
            </div>
          </div>

          {/* Sales Graph */}
          <div className="mb-6">
            <SalesGraph data={dailySales} />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Products Chart */}
            <div>
              <TopProductsChart data={topProducts} />
            </div>
            
            {/* Top Payment Methods Chart */}
            <div>
              <TopPaymentMethodsChart data={topPaymentMethods} />
            </div>
          </div>

          {/* Monthly Sales Chart */}
          <div className="mb-6">
            <MonthlySalesChart data={monthlySales} />
          </div>
        </div>
      </div>
    </ClientSidebar>
  )
} 