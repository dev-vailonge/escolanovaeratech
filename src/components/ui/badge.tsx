import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "info" | "premium"
  size?: "sm" | "md" | "lg"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-white/10 text-gray-300 border-white/20",
      success: "bg-green-500/20 text-green-400 border-green-500/30",
      warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      premium: "bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 text-yellow-400 border-yellow-400/30",
    }

    const sizeClasses = {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-3 py-1",
      lg: "text-base px-4 py-1.5",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-medium",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }






