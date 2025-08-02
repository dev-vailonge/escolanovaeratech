import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface KiwifySale {
  id: string
  reference: string
  type: string
  created_at: string
  updated_at: string
  product: {
    id: string
    name: string
  }
  shipping: {
    id: string
    name: string
    price: number
  }
  status: string
  payment_method: string
  net_amount: number
  currency: string
  customer: {
    id: string
    name: string
    email: string
    cpf: string
    mobile: string
    instagram?: string
    country: string
    address: {
      street: string
      number: string
      complement?: string
      neighborhood: string
      city: string
      state: string
      zipcode: string
    }
  }
}

interface KiwifyResponse {
  pagination: {
    count: number
    page_number: number
    page_size: number
  }
  data: KiwifySale[]
}

interface OAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

async function getKiwifyToken(): Promise<string | null> {
  const CLIENT_ID = process.env.KIWIFY_CLIENT_ID
  const CLIENT_SECRET = process.env.KIWIFY_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return null
  }

  try {
    const tokenResponse = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    })

    if (!tokenResponse.ok) {
      return null
    }

    const tokenData: OAuthResponse = await tokenResponse.json()
    return tokenData.access_token
  } catch (error) {
    return null
  }
}

async function fetchKiwifySales(page = 1, pageSize = 100): Promise<KiwifyResponse> {
  const accessToken = await getKiwifyToken()
  
  if (!accessToken) {
    return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
  }

  const KIWIFY_ACCOUNT_ID = process.env.KIWIFY_ACCOUNT_ID
  
  if (!KIWIFY_ACCOUNT_ID) {
    return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
  }

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 90)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const url = `https://public-api.kiwify.com/v1/sales?page_number=${page}&page_size=${pageSize}&start_date=${startDateStr}&end_date=${endDateStr}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-kiwify-account-id': KIWIFY_ACCOUNT_ID,
      },
    })

    if (!response.ok) {
      return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
    }

    const data: KiwifyResponse = await response.json()
    return data
  } catch (error) {
    return { pagination: { count: 0, page_number: 1, page_size: 10 }, data: [] }
  }
}

export async function POST(request: NextRequest) {
  try {
    const kiwifyData = await fetchKiwifySales()
    const sales = kiwifyData.data || []
    
    if (sales.length === 0) {
      return NextResponse.json({ error: 'No sales data available' }, { status: 404 })
    }

    // Format sales data for Excel
    const excelData = sales.map((sale: KiwifySale) => ({
      'ID da Venda': sale.id || '',
      'Referência': sale.reference || '',
      'Tipo': sale.type || '',
      'Data de Criação': sale.created_at ? new Date(sale.created_at).toLocaleString('pt-BR') : '',
      'Data de Atualização': sale.updated_at ? new Date(sale.updated_at).toLocaleString('pt-BR') : '',
      'Produto': sale.product?.name || '',
      'ID do Produto': sale.product?.id || '',
      'Frete': sale.shipping?.name || '',
      'Preço do Frete': sale.shipping?.price ? (sale.shipping.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
      'Status': sale.status || '',
      'Método de Pagamento': sale.payment_method || '',
      'Valor Líquido': sale.net_amount ? (sale.net_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
      'Moeda': sale.currency || '',
      'Nome do Cliente': sale.customer?.name || '',
      'Email do Cliente': sale.customer?.email || '',
      'CPF do Cliente': sale.customer?.cpf || '',
      'Telefone do Cliente': sale.customer?.mobile || '',
      'Instagram do Cliente': sale.customer?.instagram || '',
      'País do Cliente': sale.customer?.country || '',
      'Endereço - Rua': sale.customer?.address?.street || '',
      'Endereço - Número': sale.customer?.address?.number || '',
      'Endereço - Complemento': sale.customer?.address?.complement || '',
      'Endereço - Bairro': sale.customer?.address?.neighborhood || '',
      'Endereço - Cidade': sale.customer?.address?.city || '',
      'Endereço - Estado': sale.customer?.address?.state || '',
      'Endereço - CEP': sale.customer?.address?.zipcode || '',
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // ID da Venda
      { wch: 15 }, // Referência
      { wch: 10 }, // Tipo
      { wch: 20 }, // Data de Criação
      { wch: 20 }, // Data de Atualização
      { wch: 30 }, // Produto
      { wch: 20 }, // ID do Produto
      { wch: 20 }, // Frete
      { wch: 15 }, // Preço do Frete
      { wch: 10 }, // Status
      { wch: 20 }, // Método de Pagamento
      { wch: 15 }, // Valor Líquido
      { wch: 10 }, // Moeda
      { wch: 25 }, // Nome do Cliente
      { wch: 30 }, // Email do Cliente
      { wch: 15 }, // CPF do Cliente
      { wch: 15 }, // Telefone do Cliente
      { wch: 20 }, // Instagram do Cliente
      { wch: 15 }, // País do Cliente
      { wch: 30 }, // Endereço - Rua
      { wch: 10 }, // Endereço - Número
      { wch: 20 }, // Endereço - Complemento
      { wch: 20 }, // Endereço - Bairro
      { wch: 20 }, // Endereço - Cidade
      { wch: 15 }, // Endereço - Estado
      { wch: 15 }, // Endereço - CEP
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    // Set response headers for file download
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', `attachment; filename="vendas-${new Date().toISOString().split('T')[0]}.xlsx"`)

    return new NextResponse(excelBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export sales data' }, { status: 500 })
  }
} 