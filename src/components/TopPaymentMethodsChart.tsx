'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface PaymentMethodData {
  method: string
  count: number
  revenue: number
}

interface TopPaymentMethodsChartProps {
  data: PaymentMethodData[]
}

export default function TopPaymentMethodsChart({ data }: TopPaymentMethodsChartProps) {
  const chartData = {
    labels: data.map(item => item.method),
    datasets: [
      {
        label: 'Quantidade de Vendas',
        data: data.map(item => item.count),
        backgroundColor: '#fbbf24',
        borderColor: '#f59e0b',
        borderWidth: 1,
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
        text: 'Top 3 Métodos de Pagamento',
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