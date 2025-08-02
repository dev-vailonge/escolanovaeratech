'use client'

import { useState, useEffect } from 'react'

interface ErrorPopupProps {
  message: string
  isVisible: boolean
  onClose: () => void
}

export default function ErrorPopup({ message, isVisible, onClose }: ErrorPopupProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto close after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-red-500 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Erro ao carregar dados</h3>
        </div>
        
        <p className="text-gray-300 mb-4">{message}</p>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
} 