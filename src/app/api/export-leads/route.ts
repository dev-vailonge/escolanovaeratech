import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Fetch all leads data
    const { data: waitingList } = await supabase.from('waiting_list').select('*')
    const { data: iscas } = await supabase.from('iscas').select('*')
    
    // Combine and format data
    const allLeads = [
      ...(waitingList || []).map(lead => ({
        ...lead,
        table: 'waiting_list',
        created_at: new Date(lead.created_at).toLocaleString('pt-BR')
      })),
      ...(iscas || []).map(lead => ({
        ...lead,
        table: 'iscas',
        created_at: new Date(lead.created_at).toLocaleString('pt-BR')
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    
    // Format data for Excel
    const excelData = allLeads.map(lead => ({
      'ID': lead.id,
      'Nome': lead.name || lead.nome || '',
      'Email': lead.email || '',
      'Telefone': lead.phone || lead.telefone || lead.celphone || '',
      'Fonte': lead.source || 'Não informado',
      'Afiliado': lead.affiliate || 'Não informado',
      'Tabela': lead.table === 'waiting_list' ? 'Lista de Espera' : 'Iscas',
      'Data de Criação': lead.created_at,
      'Atualizado em': lead.updated_at ? new Date(lead.updated_at).toLocaleString('pt-BR') : ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Set column widths
    const columnWidths = [
      { wch: 10 }, // ID
      { wch: 25 }, // Nome
      { wch: 30 }, // Email
      { wch: 15 }, // Telefone
      { wch: 20 }, // Fonte
      { wch: 20 }, // Afiliado
      { wch: 15 }, // Tabela
      { wch: 20 }, // Data de Criação
      { wch: 20 }, // Atualizado em
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return the file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
  }
} 