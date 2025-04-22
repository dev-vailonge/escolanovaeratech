'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js'
import { supabase } from '@/lib/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface LeadData {
  date: string
  iscas: number
  waiting_list: number
}

export default function LeadsGraph() {
  const [data, setData] = useState<LeadData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLeadsData() {
      try {
        // Get the last 15 days
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 15)

        // Format dates for Supabase query
        const formatDate = (date: Date) => date.toISOString().split('T')[0]

        // Fetch data from both tables
        const [iscasResponse, waitingListResponse] = await Promise.all([
          supabase
            .from('iscas')
            .select('created_at')
            .gte('created_at', formatDate(startDate))
            .lte('created_at', formatDate(endDate)),
          supabase
            .from('waiting_list')
            .select('created_at')
            .gte('created_at', formatDate(startDate))
            .lte('created_at', formatDate(endDate))
        ])

        if (iscasResponse.error) throw iscasResponse.error
        if (waitingListResponse.error) throw waitingListResponse.error

        // Process the data
        const processedData: LeadData[] = []
        for (let i = 0; i < 15; i++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = formatDate(date)

          const iscasCount = iscasResponse.data.filter(
            (item) => item.created_at?.split('T')[0] === dateStr
          ).length

          const waitingListCount = waitingListResponse.data.filter(
            (item) => item.created_at?.split('T')[0] === dateStr
          ).length

          processedData.unshift({
            date: dateStr,
            iscas: iscasCount,
            waiting_list: waitingListCount
          })
        }

        setData(processedData)
      } catch (error) {
        console.error('Error fetching leads data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeadsData()
  }, [])

  const chartData: ChartData<'line'> = {
    labels: data.map((item) => item.date),
    datasets: [
      {
        label: 'Iscas',
        data: data.map((item) => item.iscas),
        borderColor: 'rgb(234, 179, 8)', // yellow-400
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.4
      },
      {
        label: 'Lista de Espera',
        data: data.map((item) => item.waiting_list),
        borderColor: 'rgb(34, 197, 94)', // green-500
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Leads Capturados nos Últimos 15 Dias',
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
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 animate-pulse w-full h-[320px]">
        <div className="h-full w-full bg-zinc-800 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full h-[320px]">
      <Line data={chartData} options={options} />
    </div>
  )
} 