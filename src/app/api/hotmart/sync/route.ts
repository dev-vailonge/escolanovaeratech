/**
 * Endpoint para sincronizar dados históricos da Hotmart
 * 
 * Requer:
 * - HOTMART_CLIENT_ID configurado
 * - HOTMART_CLIENT_SECRET configurado
 * 
 * Uso:
 * POST /api/hotmart/sync
 * Body (opcional):
 * {
 *   "startDate": "2024-01-01",
 *   "endDate": "2024-12-31"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllSalesHistory } from '@/lib/hotmart/sales'
import { createUser, getUserByEmail } from '@/lib/database'
import { upsertHotmartSubscription } from '@/lib/hotmart/subscriptions'

export async function POST(request: NextRequest) {
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

    // Obter parâmetros do body (opcional)
    let startDate: string | undefined
    let endDate: string | undefined

    try {
      const body = await request.json()
      startDate = body.startDate
      endDate = body.endDate
    } catch {
      // Body vazio ou inválido - usar valores padrão (últimos 30 dias)
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      
      endDate = today.toISOString().split('T')[0]
      startDate = thirtyDaysAgo.toISOString().split('T')[0]
    }

    console.log(`🔄 Iniciando sincronização: ${startDate} até ${endDate}`)

    // Executar sincronização usando Sales History
    let processed = 0
    let errors = 0

    const { totalProcessed: totalVendas, hostUsed } = await fetchAllSalesHistory(
      {
        maxResults: 100,
        startDate,
        endDate,
        transactionStatus: ['APPROVED', 'COMPLETE'], // Buscar apenas aprovadas/completas
      },
      async (items, pageToken) => {
        console.log(`📦 Processando página com ${items.length} vendas...`)

        for (const sale of items) {
          try {
            // Filtrar apenas vendas aprovadas
            const status = sale.status || sale.purchase?.status || sale.subscription?.status || ''
            const statusAprovados = ['APPROVED', 'COMPLETE', 'COMPLETED', 'CONFIRMED', 'approved', 'complete', 'completed', 'confirmed']
            
            if (!statusAprovados.includes(status.toUpperCase())) {
              continue // Pular vendas não aprovadas
            }

            // Extrair dados do comprador
            const buyer = sale.buyer || sale.purchase?.buyer || sale.subscription?.buyer || {}
            const purchase = sale.purchase || sale
            const product = sale.product || purchase.product || sale.subscription?.product || {}
            
            const email = buyer.email || buyer.mail || purchase.buyer?.email

            if (!email) {
              console.warn('⚠️ Venda sem email, pulando...')
              errors++
              continue
            }

            // Criar ou buscar usuário
            let user = await getUserByEmail(email)
            
            if (!user) {
              const buyerName = buyer.name || buyer.first_name || buyer.full_name || buyer.fullName || email.split('@')[0] || 'Aluno'
              
              user = await createUser({
                email,
                name: buyerName,
                role: 'aluno',
                access_level: 'full', // Venda aprovada = acesso completo
              })

              if (!user) {
                console.error(`❌ Erro ao criar usuário: ${email}`)
                errors++
                continue
              }
            }

            // Criar ou atualizar assinatura
            const transactionId = purchase.transaction || purchase.transaction_id || sale.transaction || sale.id
            const productId = product.id || product.product_id || sale.product_id || 'unknown'
            const expiresDate = purchase.expires_date || purchase.expiration_date || sale.expires_date || null

            if (!transactionId) {
              console.warn(`⚠️ Venda sem transaction_id, pulando...`)
              errors++
              continue
            }

            const success = await upsertHotmartSubscription(user.id, {
              hotmart_transaction_id: transactionId.toString(),
              product_id: productId.toString(),
              status: 'active',
              expires_at: expiresDate || null,
            })

            if (success) {
              processed++
            } else {
              errors++
            }
          } catch (error) {
            console.error('❌ Erro ao processar venda:', error)
            errors++
          }
        }
      }
    )

    const message = `Sincronização concluída: ${processed} processadas, ${errors} erros de ${totalVendas} vendas totais`
    console.log(`✅ ${message} | Host: ${hostUsed || 'desconhecido'}`)

    const result = {
      success: errors === 0,
      processed,
      errors,
      totalVendas,
      hostUsed,
      message,
    }

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          processed: result.processed,
          errors: result.errors,
          hostUsed: result.hostUsed,
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          processed: result.processed,
          errors: result.errors,
          hostUsed: result.hostUsed,
        },
        { status: 200 } // 200 porque alguns dados podem ter sido processados
      )
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar dados da Hotmart:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao sincronizar dados',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

// Método GET para verificar status (sem executar sincronização)
export async function GET() {
  const CLIENT_ID = process.env.HOTMART_CLIENT_ID
  const CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET

  return NextResponse.json({
    configured: !!(CLIENT_ID && CLIENT_SECRET),
    message: CLIENT_ID && CLIENT_SECRET
      ? 'Credenciais configuradas. Use POST para sincronizar dados.'
      : 'Credenciais não configuradas. Configure HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET.',
  })
}


