'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

interface ProgressCardProps {
  title: string
  count: number
  icon: React.ReactNode
  color?: string
}

export default function ProgressCard({
  title,
  count,
  icon,
  color = 'yellow',
}: ProgressCardProps) {
  const { theme } = useTheme()

  const bgGradientClasses = {
    yellow: theme === 'dark' 
      ? 'bg-gradient-to-br from-yellow-400/5 to-transparent'
      : 'bg-gradient-to-br from-yellow-100/50 to-transparent',
    blue: 'bg-gradient-to-br from-blue-400/5 to-transparent',
    green: 'bg-gradient-to-br from-green-400/5 to-transparent',
    purple: 'bg-gradient-to-br from-purple-400/5 to-transparent',
  }

  return (
    <Card className={cn(
      "backdrop-blur-md border rounded-xl overflow-hidden transition-all duration-300",
      bgGradientClasses[color as keyof typeof bgGradientClasses] || bgGradientClasses.yellow,
      theme === 'dark'
        ? "bg-black/20 border-white/10 hover:border-white/20"
        : "bg-white border-yellow-400/90 hover:border-yellow-500 shadow-md"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-5">
        <CardTitle className={cn(
          "text-xs md:text-sm font-medium",
          theme === 'dark' ? "text-gray-400" : "text-gray-700"
        )}>
          {title}
        </CardTitle>
        <div className="scale-90 md:scale-100">{icon}</div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 pt-0">
        <div className={cn(
          "text-2xl md:text-3xl font-bold mb-1",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          {count.toLocaleString('pt-BR')}
        </div>
        <p className={cn(
          "text-xs mt-1",
          theme === 'dark' ? "text-gray-500" : "text-gray-500"
        )}>
          Total até agora
        </p>
      </CardContent>
    </Card>
  )
}

