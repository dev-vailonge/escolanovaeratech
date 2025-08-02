"use client"

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface MonthlySalesData {
  month: string
  sales: number
  revenue: number
}

interface MonthlySalesChartProps {
  data: MonthlySalesData[]
}

export default function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Vendas',
        data: data.map(item => item.sales),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Vendas dos Últimos 12 Meses',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(234, 179, 8, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const monthData = data[context.dataIndex]
            return [
              `Vendas: ${monthData.sales.toLocaleString('pt-BR')}`,
              `Receita: R$ ${monthData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            ]
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return value.toLocaleString('pt-BR')
          }
        },
      },
    },
  }

  return (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
} 