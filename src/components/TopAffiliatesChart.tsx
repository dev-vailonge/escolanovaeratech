'use client'

import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { supabase } from '@/lib/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface AffiliateCount {
  affiliate: string
  count: number
}

export default function TopAffiliatesChart() {
  const [isLoading, setIsLoading] = useState(true)
  const [topAffiliates, setTopAffiliates] = useState<AffiliateCount[]>([])

  useEffect(() => {
    async function fetchTopAffiliates() {
      try {
        const [waitingListResponse, iscasResponse] = await Promise.all([
          supabase
            .from('waiting_list')
            .select('affiliate'),
          supabase
            .from('iscas')
            .select('affiliate')
        ])

        if (waitingListResponse.error) throw waitingListResponse.error
        if (iscasResponse.error) throw iscasResponse.error

        // Combine and count affiliates
        const allAffiliates = [
          ...waitingListResponse.data,
          ...iscasResponse.data
        ].map(item => item.affiliate || 'Não informado')

        const affiliateCounts = allAffiliates.reduce((acc, affiliate) => {
          acc[affiliate] = (acc[affiliate] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Convert to array and sort
        const sortedAffiliates: AffiliateCount[] = Object.entries(affiliateCounts)
          .map(([affiliate, count]) => ({ affiliate, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        setTopAffiliates(sortedAffiliates)
      } catch (error) {
        console.error('Error fetching top affiliates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopAffiliates()
  }, [])

  const chartData = {
    labels: topAffiliates.map(item => item.affiliate),
    datasets: [
      {
        label: 'Leads por Afiliado',
        data: topAffiliates.map(item => item.count),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Top 5 Afiliados',
        color: 'rgb(255, 255, 255)',
        font: {
          size: 16
        },
        padding: { bottom: 20 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 animate-pulse">
        <div className="h-[200px] bg-zinc-800/50 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
      <div className="h-[200px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
} 