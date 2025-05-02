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

interface LeadsTableProps {
  data: Lead[]
}

export default function LeadsTable({ data }: LeadsTableProps) {
  // Optionally, you can keep pagination here, but only paginate the provided data
  // For now, just render all rows
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
            {data.map((lead) => (
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
    </div>
  )
} 