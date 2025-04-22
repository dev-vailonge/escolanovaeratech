'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  source: string
  affiliate: string
  created_at: string
  table: 'waiting_list' | 'iscas'
}

const ITEMS_PER_PAGE = 20

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)

  useEffect(() => {
    async function fetchLeads() {
      try {
        // Get total count first
        const [waitingListCount, iscasCount] = await Promise.all([
          supabase
            .from('waiting_list')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('iscas')
            .select('*', { count: 'exact', head: true })
        ])

        const total = (waitingListCount.count || 0) + (iscasCount.count || 0)
        setTotalLeads(total)

        // Then fetch paginated data
        const [waitingListResponse, iscasResponse] = await Promise.all([
          supabase
            .from('waiting_list')
            .select('id, name, email, phone, source, affiliate, created_at')
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1),
          supabase
            .from('iscas')
            .select('id, name, email, phone, source, affiliate, created_at')
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
        ])

        if (waitingListResponse.error) throw waitingListResponse.error
        if (iscasResponse.error) throw iscasResponse.error

        const waitingListLeads = waitingListResponse.data.map(lead => ({
          ...lead,
          table: 'waiting_list' as const
        }))

        const iscasLeads = iscasResponse.data.map(lead => ({
          ...lead,
          table: 'iscas' as const
        }))

        // Combine and sort by created_at
        const allLeads = [...waitingListLeads, ...iscasLeads]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, ITEMS_PER_PAGE)

        setLeads(allLeads)
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()
  }, [currentPage])

  const totalPages = Math.ceil(totalLeads / ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesBeforeEllipsis = 7 // Show up to 7 pages before using ellipsis
    
    if (totalPages <= maxPagesBeforeEllipsis) {
      // If we have 7 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate range around current page
      let start = Math.max(2, currentPage - 2)
      let end = Math.min(totalPages - 1, currentPage + 2)

      // Adjust range if current page is near the start or end
      if (currentPage <= 3) {
        end = 5
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4
      }

      // Add ellipsis before range if needed
      if (start > 2) {
        pageNumbers.push('...')
      }

      // Add range
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis after range if needed
      if (end < totalPages - 1) {
        pageNumbers.push('...')
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 animate-pulse">
        <div className="h-96 bg-zinc-800/50 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Nome</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Telefone</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Origem</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Afiliado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {leads.map((lead) => (
              <tr key={`${lead.table}-${lead.id}`} className="hover:bg-white/5">
                <td className="py-3 px-4 text-sm text-white">{lead.name}</td>
                <td className="py-3 px-4 text-sm text-white">{lead.email}</td>
                <td className="py-3 px-4 text-sm text-white">{lead.phone}</td>
                <td className="py-3 px-4 text-sm text-white">{lead.source || '-'}</td>
                <td className="py-3 px-4 text-sm text-white">{lead.affiliate || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="text-sm text-gray-400">
          Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalLeads)} de {totalLeads} leads
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNumber, index) => (
              pageNumber === '...' ? (
                <span key={`ellipsis-${index}`} className="text-gray-400 px-2">
                  {pageNumber}
                </span>
              ) : (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(Number(pageNumber))}
                  className={`min-w-[32px] px-3 py-1 text-sm rounded-md ${
                    currentPage === pageNumber
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            ))}
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  )
} 