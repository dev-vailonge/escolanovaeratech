'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  const { theme } = useTheme()

  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Mostrar todas as páginas se houver poucas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Sempre mostrar primeira página
      pages.push(1)

      // Calcular início e fim da janela
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Ajustar se estiver no início
      if (currentPage <= 3) {
        end = 4
      }

      // Ajustar se estiver no fim
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3
      }

      // Adicionar ellipsis antes se necessário
      if (start > 2) {
        pages.push('...')
      }

      // Adicionar páginas da janela
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Adicionar ellipsis depois se necessário
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Sempre mostrar última página
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t" style={{
      borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(234, 179, 8, 0.3)'
    }}>
      {/* Informações */}
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <div className={cn(
          "text-sm",
          theme === 'dark' ? "text-gray-400" : "text-gray-600"
        )}>
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
        </div>
      )}

      {/* Controles de paginação */}
      <div className="flex items-center gap-2">
        {/* Botão Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            theme === 'dark'
              ? "bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:hover:bg-black/30 disabled:hover:text-gray-400"
              : "bg-white border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:hover:bg-white disabled:hover:text-gray-600"
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números das páginas */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={cn(
                    "px-2 py-1",
                    theme === 'dark' ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "min-w-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? theme === 'dark'
                      ? "bg-yellow-400 text-black"
                      : "bg-yellow-500 text-white"
                    : theme === 'dark'
                    ? "bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    : "bg-white border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                aria-label={`Ir para página ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Botão Próximo */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            theme === 'dark'
              ? "bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:hover:bg-black/30 disabled:hover:text-gray-400"
              : "bg-white border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:hover:bg-white disabled:hover:text-gray-600"
          )}
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

