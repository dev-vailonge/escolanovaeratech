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
import { syncHotmartHistoricalData } from '@/lib/hotmart'

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

    // Executar sincronização
    const result = await syncHotmartHistoricalData(startDate, endDate)

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          processed: result.processed,
          errors: result.errors,
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

