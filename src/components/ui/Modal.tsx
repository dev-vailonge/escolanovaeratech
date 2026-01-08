'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string | React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Garantir que o componente está montado (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevenir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {/* Backdrop - cobre toda a tela incluindo sidebar e bottom nav */}
      <div
        className={cn(
          "fixed inset-0 backdrop-blur-md transition-opacity",
          theme === 'dark' ? "bg-black/70" : "bg-black/50"
        )}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative w-full rounded-xl shadow-xl transition-all backdrop-blur-xl",
          sizeClasses[size],
          theme === 'dark'
            ? "bg-gray-800/30 border border-white/10"
            : "bg-white border border-yellow-400/90"
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 10000,
        }}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 md:p-6 border-b backdrop-blur-xl",
          theme === 'dark' 
            ? "bg-gray-800/30 border-white/10" 
            : "bg-white border-yellow-400/30"
        )}>
          <div className="flex items-center gap-3">
            {typeof title === 'string' ? (
              <h2 className={cn(
                "text-lg md:text-xl font-bold",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {title}
              </h2>
            ) : (
              title
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              theme === 'dark'
                ? "hover:bg-white/10 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            )}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )

  // Renderizar em portal para garantir que cubra toda a tela
  return mounted ? createPortal(modalContent, document.body) : null
}

