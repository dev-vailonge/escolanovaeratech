import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Fetch all leads data with pagination
    let allLeads: any[] = []
    let page = 0
    const pageSize = 1000
    
    while (true) {
      const { data: leadsRes, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false })
      
      if (leadsError) {
        throw leadsError
      }
      
      if (!leadsRes || leadsRes.length === 0) {
        break
      }
      
      allLeads = allLeads.concat(leadsRes)
      
      if (leadsRes.length < pageSize) {
        break
      }
      
      page++
    }
    
    // Format data
    const formattedLeads = allLeads.map(lead => ({
      ...lead,
      created_at: new Date(lead.created_at).toLocaleString('pt-BR')
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    
    // Format data for Excel
    const excelData = formattedLeads.map(lead => ({
      'ID': lead.id,
      'Nome': lead.name || '',
      'Email': lead.email || '',
      'Telefone': lead.phone || '',
      'Fonte': lead.source || 'Não informado',
      'UTM Source': lead.utm_source || 'Não informado',
      'UTM Medium': lead.utm_medium || 'Não informado',
      'UTM Campaign': lead.utm_campaign || 'Não informado',
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
      { wch: 20 }, // UTM Source
      { wch: 20 }, // UTM Medium
      { wch: 20 }, // UTM Campaign
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
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
  }
} 