'use client'

import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/ThemeContext'

interface BadgeDisplayProps {
  badgeType: 'top_member'
  className?: string
}

export default function BadgeDisplay({ badgeType, className }: BadgeDisplayProps) {
  const { theme } = useTheme()

  if (badgeType === 'top_member') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
          theme === 'dark'
            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
            : 'bg-yellow-100 text-yellow-700 border-yellow-400',
          className
        )}
        title="Top Member - Mais curtidas em perguntas"
      >
        <Crown className="w-3 h-3" />
        Top Member
      </span>
    )
  }

  return null
}




