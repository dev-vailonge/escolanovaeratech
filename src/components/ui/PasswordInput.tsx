'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  className?: string
  theme?: 'dark' | 'light'
  label?: string
  labelClassName?: string
  showHelperText?: boolean
  helperText?: string
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  minLength,
  className,
  theme = 'dark',
  label,
  labelClassName,
  showHelperText = false,
  helperText = 'Mínimo de 6 caracteres'
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div>
      {label && (
        <label 
          htmlFor={id} 
          className={cn(
            "block text-sm font-medium mb-2",
            labelClassName || (theme === 'dark' ? "text-gray-300" : "text-gray-700")
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all",
            theme === 'dark'
              ? "bg-black/50 border border-white/10"
              : "bg-white/90 border border-yellow-500/30 text-gray-900 placeholder-gray-400",
            className
          )}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors",
            theme === 'dark'
              ? "text-gray-400 hover:text-gray-300 hover:bg-white/10"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          )}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      {showHelperText && (
        <p className={cn(
          "mt-1 text-xs",
          theme === 'dark' ? "text-gray-500" : "text-gray-600"
        )}>
          {helperText}
        </p>
      )}
    </div>
  )
}


