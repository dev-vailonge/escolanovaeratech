'use client'

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

interface LeadsGraphProps {
  data: LeadData[]
}

export default function LeadsGraph({ data }: LeadsGraphProps) {
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

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full h-[320px]">
      <Line data={chartData} options={options} />
    </div>
  )
} 