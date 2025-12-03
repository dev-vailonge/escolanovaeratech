'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

interface ProgressCardProps {
  title: string
  current: number
  total: number
  icon: React.ReactNode
  color?: string
}

export default function ProgressCard({
  title,
  current,
  total,
  icon,
  color = 'yellow',
}: ProgressCardProps) {
  const { theme } = useTheme()
  const percentage = (current / total) * 100
  const colorClasses = {
    yellow: theme === 'dark' ? 'bg-yellow-400' : 'bg-yellow-600',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    purple: 'bg-purple-400',
  }

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
      <CardContent className="p-4 md:p-5 pt-0 space-y-3">
        <div className={cn(
          "text-sm md:text-base font-normal",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          / {total}
        </div>
        <div className={cn(
          "w-full h-3 backdrop-blur-sm rounded-full overflow-hidden",
          theme === 'dark' ? "bg-black/30" : "bg-yellow-100"
        )}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              colorClasses[color as keyof typeof colorClasses] || colorClasses.yellow
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

