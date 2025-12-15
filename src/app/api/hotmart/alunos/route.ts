/**
 * Endpoint para buscar alunos/compras da Hotmart
 * 
 * Requer:
 * - HOTMART_CLIENT_ID configurado
 * - HOTMART_CLIENT_SECRET configurado
 * 
 * Uso:
 * GET /api/hotmart/alunos?page=0&pageSize=20&startDate=2024-01-01&endDate=2024-12-31
 * 
 * Retorna lista de alunos únicos deduplicados por email
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllSalesHistory } from '@/lib/hotmart/sales'

export async function GET(request: NextRequest) {
  try {
    // Verificar se credenciais estão configuradas
    const CLIENT_ID = process.env.HOTMART_CLIENT_ID
    const CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciais da Hotmart não configuradas. Configure HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET no .env.local',
        },
        { status: 400 }
      )
    }

    // Obter parâmetros da query string
    const searchParams = request.nextUrl.searchParams
    const maxResults = parseInt(searchParams.get('maxResults') || searchParams.get('pageSize') || '100')
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const productId = searchParams.get('productId') || undefined
    const buyerEmail = searchParams.get('buyerEmail') || undefined
    const buyerName = searchParams.get('buyerName') || undefined

    // Coletar todas as vendas paginadas
    const allSales: any[] = []
    
    const { totalProcessed: totalVendas, hostUsed } = await fetchAllSalesHistory(
      {
        maxResults: Math.min(maxResults, 100),
        startDate,
        endDate,
        productId,
        buyerEmail,
        buyerName,
        transactionStatus: ['APPROVED', 'COMPLETE'], // Buscar apenas aprovadas/completas
      },
      async (items, pageToken) => {
        allSales.push(...items)
      }
    )

    console.log(`📦 Total: ${totalVendas} vendas | Host: ${hostUsed}`)

    if (allSales.length === 0) {
      return NextResponse.json({
        success: true,
        alunos: [],
        total: 0,
        message: 'Nenhuma venda encontrada. Verifique se há vendas no período especificado.',
      })
    }

    // Filtrar apenas compras que geram acesso (status aprovado/compensado)
    const statusAprovados = ['APPROVED', 'COMPLETE', 'COMPLETED', 'CONFIRMED', 'approved', 'complete', 'completed', 'confirmed']
    
    const vendasValidas = allSales.filter((sale: any) => {
      const status = sale.status || sale.purchase?.status || sale.subscription?.status || ''
      return statusAprovados.includes(status.toUpperCase())
    })

    console.log(`✅ ${vendasValidas.length} de ${allSales.length} vendas com status aprovado`)

    // Transformar vendas em lista de alunos únicos (deduplicados por email)
    const alunosMap = new Map<string, {
      email: string
      name: string
      lastPurchaseDate: string | null
      products: Array<{
        productId: string
        productName: string
        purchaseDate: string
        status: string
        transactionId: string
      }>
    }>()

    vendasValidas.forEach((sale: any) => {
      // Parser resiliente: tentar diferentes estruturas
      const buyer = sale.buyer || sale.purchase?.buyer || sale.subscription?.buyer || sale.user || {}
      const purchase = sale.purchase || sale
      const product = sale.product || purchase.product || sale.subscription?.product || {}
      
      // Extrair email (múltiplas possibilidades)
      const email = buyer.email || buyer.mail || purchase.buyer?.email || sale.email || purchase.email
      
      if (!email) {
        return // Pular vendas sem email
      }

      // Extrair dados da venda
      const transactionId = purchase.transaction || purchase.transaction_id || sale.transaction || sale.id || sale.order_id
      const productId = product.id || product.product_id || sale.product_id || 'unknown'
      const productName = product.name || product.product_name || 'Produto'
      const purchaseDate = purchase.date || purchase.purchase_date || purchase.approved_date || sale.date || sale.created_at || sale.approved_date
      const purchaseStatus = sale.status || purchase.status || purchase.purchase_status || 'approved'

      // Se já existe aluno com este email
      if (!alunosMap.has(email)) {
        alunosMap.set(email, {
          email,
          name: buyer.name || buyer.first_name || buyer.full_name || buyer.fullName || email.split('@')[0] || 'Aluno',
          lastPurchaseDate: purchaseDate || null,
          products: [{
            productId,
            productName,
            purchaseDate: purchaseDate || '',
            status: purchaseStatus,
            transactionId: transactionId?.toString() || '',
          }],
        })
      } else {
        // Atualizar aluno existente
        const aluno = alunosMap.get(email)!
        
        // Atualizar última compra se for mais recente
        if (purchaseDate && (!aluno.lastPurchaseDate || purchaseDate > aluno.lastPurchaseDate)) {
          aluno.lastPurchaseDate = purchaseDate
        }

        // Adicionar produto à lista (evitar duplicatas por transactionId)
        const produtoJaExiste = aluno.products.some(p => p.transactionId === transactionId?.toString())
        if (!produtoJaExiste) {
          aluno.products.push({
            productId,
            productName,
            purchaseDate: purchaseDate || '',
            status: purchaseStatus,
            transactionId: transactionId?.toString() || '',
          })
        }
      }
    })

    // Converter map para array e ordenar por última compra (mais recente primeiro)
    const students = Array.from(alunosMap.values()).sort((a, b) => {
      if (!a.lastPurchaseDate) return 1
      if (!b.lastPurchaseDate) return -1
      return new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime()
    })

    console.log(`✅ ${students.length} alunos únicos | ${vendasValidas.length} vendas aprovadas | Host: ${hostUsed}`)

    return NextResponse.json({
      totalStudents: students.length,
      students,
      metadata: {
        totalVendas: allSales.length,
        vendasAprovadas: vendasValidas.length,
        hostUsed: hostUsed || 'desconhecido',
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar alunos da Hotmart:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao buscar alunos da Hotmart',
        error: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

