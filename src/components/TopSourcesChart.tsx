'use client'

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface SourceCount {
  source: string
  count: number
}

interface TopSourcesChartProps {
  data: SourceCount[]
}

export default function TopSourcesChart({ data }: TopSourcesChartProps) {
  const chartData = {
    labels: data.map(item => item.source),
    datasets: [
      {
        label: 'Leads por Origem',
        data: data.map(item => item.count),
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
        text: 'Top 5 Origens',
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

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
      <div className="h-[200px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
} 