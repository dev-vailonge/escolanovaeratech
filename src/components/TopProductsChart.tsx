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

interface ProductData {
  product: string
  sales: number
  revenue: number
}

interface TopProductsChartProps {
  data: ProductData[]
}

export default function TopProductsChart({ data }: TopProductsChartProps) {
  const chartData = {
    labels: data.map(item => item.product),
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
        position: 'top' as const,
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: true,
        text: 'Top 3 Produtos',
        color: '#ffffff',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const index = context.dataIndex
            const revenue = data[index].revenue
            return `Receita: R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: '#374151',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: '#374151',
        },
      },
    },
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-lg h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
} 