'use client'

import { useState, useEffect } from 'react'
import TopProductsChart from './TopProductsChart'
import SalesGraph from './SalesGraph'
import MonthlySalesChart from './MonthlySalesChart'
import TopPaymentMethodsChart from './TopPaymentMethodsChart'
import ExportSalesButton from './ExportSalesButton'
import ErrorPopup from './ErrorPopup'

interface SalesData {
  stats: {
    totalSales: number
    totalRevenueBRL: number
    totalRevenueUSD: number
    totalRevenue: number
    conversionRate: number
  }
  dailySales: any[]
  monthlySales: any[]
  topProducts: any[]
  topPaymentMethods: any[]
}

export default function SalesDashboard() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showErrorPopup, setShowErrorPopup] = useState(false)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/sales')
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados de vendas')
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        setSalesData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados'
        setError(errorMessage)
        setShowErrorPopup(true)
        console.error('Sales data fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Vendas</h1>
                <p className="text-gray-400">Gerencie suas vendas e acompanhe o desempenho</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-gray-400">Carregando dados de vendas...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!salesData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Vendas</h1>
                <p className="text-gray-400">Gerencie suas vendas e acompanhe o desempenho</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-400">Nenhum dado de vendas disponível</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
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
            <p className="text-2xl font-bold text-white">{salesData.stats.totalSales}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Receita Total (BRL)</h3>
            <p className="text-2xl font-bold text-white">
              R$ {salesData.stats.totalRevenueBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Receita Total (USD)</h3>
            <p className="text-2xl font-bold text-white">
              $ {salesData.stats.totalRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Taxa de Conversão</h3>
            <p className="text-2xl font-bold text-white">{salesData.stats.conversionRate}%</p>
          </div>
        </div>

        {/* Sales Graph */}
        <div className="mb-6">
          <SalesGraph data={salesData.dailySales} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Products Chart */}
          <div>
            <TopProductsChart data={salesData.topProducts} />
          </div>
          
          {/* Top Payment Methods Chart */}
          <div>
            <TopPaymentMethodsChart data={salesData.topPaymentMethods} />
          </div>
        </div>

        {/* Monthly Sales Chart */}
        <div className="mb-6">
          <MonthlySalesChart data={salesData.monthlySales} />
        </div>
      </div>

      {/* Error Popup */}
      <ErrorPopup
        message={error || 'Erro ao carregar dados de vendas'}
        isVisible={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
      />
    </div>
  )
} 