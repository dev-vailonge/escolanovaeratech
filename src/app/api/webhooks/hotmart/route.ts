/**
 * Webhook endpoint para receber eventos da Hotmart
 * 
 * Documentação: 
 * - Tutorial: https://developers.hotmart.com/docs/pt-BR/tutorials/use-webhook-for-subscriptions/
 * - Webhook: https://developers.hotmart.com/docs/pt-BR/2.0.0/webhook/purchase-webhook/
 * 
 * Versão suportada: 2.0.0 (Recomendado)
 * 
 * Eventos suportados (conforme tutorial):
 * - PURCHASE_APPROVED: Compra aprovada
 * - PURCHASE_COMPLETE: Compra completa
 * - PURCHASE_CANCELED: Compra cancelada (versão 2.0.0 usa um L)
 * - PURCHASE_CANCELLED: Compra cancelada (versão 1.0.0 usa dois L)
 * - PURCHASE_DELAYED: Compra atrasada
 * - PURCHASE_EXPIRED: Compra expirada
 * 
 * Estrutura de dados (versão 2.0.0):
 * {
 *   "event": "PURCHASE_APPROVED",
 *   "data": {
 *     "subscription": {...},
 *     "buyer": {...},
 *     "purchase": {...}
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { upsertHotmartSubscription } from '@/lib/hotmart/subscriptions'
import { getUserByEmail, createUser } from '@/lib/database'

/**
 * Valida a assinatura HMAC do webhook usando o Hottok de verificação
 */
function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    // Se não tiver secret configurado, aceita (para desenvolvimento)
    console.warn('⚠️ HOTMART_WEBHOOK_SECRET não configurado - validação desabilitada')
    return true
  }

  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const calculatedSignature = hmac.digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    )
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

/**
 * Processa evento PURCHASE_APPROVED
 */
async function handlePurchaseApproved(data: any) {
  try {
    // Conforme tutorial Hotmart versão 2.0.0:
    // Estrutura: { event: "...", data: { subscription: {...}, buyer: {...}, purchase: {...} } }
    // https://developers.hotmart.com/docs/pt-BR/tutorials/use-webhook-for-subscriptions/
    const subscription = data.subscription || {}
    const purchase = data.purchase || subscription.purchase || data
    const buyer = data.buyer || subscription.buyer || purchase.buyer || {}
    const product = data.product || subscription.product || purchase.product || {}

    // Extrair email do comprador (pode estar em diferentes lugares)
    const email = buyer.email || purchase.buyer?.email || data.buyer?.email || data.email

    if (!email) {
      console.error('❌ Webhook sem email do comprador:', JSON.stringify(data).substring(0, 200))
      return { success: false, message: 'Email do comprador não encontrado' }
    }

    // Buscar usuário por email
    let user = await getUserByEmail(email)
    
    // Se não existir, criar automaticamente
    if (!user) {
      console.log(`📝 Criando novo usuário para email: ${email}`)
      const buyerName = buyer.name || buyer.first_name || buyer.full_name || email.split('@')[0]
      
      user = await createUser({
        email: email,
        name: buyerName,
        role: 'aluno',
        access_level: 'full', // Compra aprovada = acesso completo
      })

      if (!user) {
        console.error(`❌ Erro ao criar usuário para: ${email}`)
        return { success: false, message: 'Erro ao criar usuário' }
      }
      
      console.log(`✅ Usuário criado automaticamente: ${email}`)
    }

    // Extrair dados da transação (pode estar em diferentes lugares)
    const transactionId = purchase.transaction || purchase.transaction_id || purchase.id || data.transaction_id
    const productId = product.id || purchase.product_id || data.product_id
    const expiresDate = purchase.expires_date || purchase.expiration_date || data.expires_date || null

    if (!transactionId) {
      console.error('❌ Webhook sem transaction_id:', JSON.stringify(data).substring(0, 200))
      return { success: false, message: 'Transaction ID não encontrado' }
    }

    // Atualizar ou criar assinatura
    const success = await upsertHotmartSubscription(user.id, {
      hotmart_transaction_id: transactionId.toString(),
      product_id: productId ? productId.toString() : 'unknown',
      status: 'active',
      expires_at: expiresDate || null,
    })

    if (success) {
      console.log(`✅ Assinatura ativada para usuário: ${user.email}`)
      return { success: true }
    } else {
      return { success: false, message: 'Erro ao atualizar assinatura' }
    }
  } catch (error) {
    console.error('Error handling PURCHASE_APPROVED:', error)
    return { success: false, message: 'Erro ao processar compra aprovada' }
  }
}

/**
 * Processa evento PURCHASE_CANCELLED
 */
async function handlePurchaseCancelled(data: any) {
  try {
    // Conforme tutorial Hotmart versão 2.0.0:
    // Estrutura: { event: "...", data: { subscription: {...}, buyer: {...}, purchase: {...} } }
    const subscription = data.subscription || {}
    const purchase = data.purchase || subscription.purchase || data
    const buyer = data.buyer || subscription.buyer || purchase.buyer || {}
    const product = data.product || subscription.product || purchase.product || {}

    const email = buyer.email || purchase.buyer?.email || data.buyer?.email || data.email

    if (!email) {
      console.error('❌ Webhook sem email do comprador:', JSON.stringify(data).substring(0, 200))
      return { success: false, message: 'Email do comprador não encontrado' }
    }

    let user = await getUserByEmail(email)
    
    // Se não existir, criar (pode ser um cancelamento de compra futura)
    if (!user) {
      console.log(`📝 Criando novo usuário para email: ${email} (cancelamento)`)
      const buyerName = buyer.name || buyer.first_name || buyer.full_name || email.split('@')[0]
      
      user = await createUser({
        email: email,
        name: buyerName,
        role: 'aluno',
        access_level: 'limited', // Cancelado = acesso limitado
      })

      if (!user) {
        console.error(`❌ Erro ao criar usuário para: ${email}`)
        return { success: false, message: 'Erro ao criar usuário' }
      }
    }

    const transactionId = purchase.transaction || purchase.transaction_id || purchase.id || data.transaction_id
    const productId = product.id || purchase.product_id || data.product_id

    if (!transactionId) {
      console.error('❌ Webhook sem transaction_id:', JSON.stringify(data).substring(0, 200))
      return { success: false, message: 'Transaction ID não encontrado' }
    }

    const success = await upsertHotmartSubscription(user.id, {
      hotmart_transaction_id: transactionId.toString(),
      product_id: productId ? productId.toString() : 'unknown',
      status: 'cancelled',
    })

    if (success) {
      console.log(`✅ Assinatura cancelada para usuário: ${user.email}`)
      return { success: true }
    } else {
      return { success: false, message: 'Erro ao atualizar assinatura' }
    }
  } catch (error) {
    console.error('Error handling PURCHASE_CANCELLED:', error)
    return { success: false, message: 'Erro ao processar cancelamento' }
  }
}

/**
 * Processa evento PURCHASE_EXPIRED
 */
async function handlePurchaseExpired(data: any) {
  try {
    // Conforme tutorial Hotmart versão 2.0.0:
    // Estrutura: { event: "...", data: { subscription: {...}, buyer: {...}, purchase: {...} } }
    const subscription = data.subscription || {}
    const purchase = data.purchase || subscription.purchase || data
    const buyer = data.buyer || subscription.buyer || purchase.buyer || {}
    const product = data.product || subscription.product || purchase.product || {}

    const email = buyer.email || purchase.buyer?.email || data.buyer?.email || data.email

    if (!email) {
      console.error('❌ Webhook sem email do comprador:', JSON.stringify(data).substring(0, 200))
      return { success: false, message: 'Email do comprador não encontrado' }
    }

    let user = await getUserByEmail(email)
    
    // Se não existir, criar (pode ser uma expiração de compra futura)
    if (!user) {
      console.log(`📝 Criando novo usuário para email: ${email} (expirado)`)
      const buyerName = buyer.name || buyer.first_name || buyer.full_name || email.split('@')[0]
      
      user = await createUser({
        email: email,
        name: buyerName,
        role: 'aluno',
        access_level: 'limited', // Expirado = acesso limitado
      })

      if (!user) {
        console.error(`❌ Erro ao criar usuário para: ${email}`)
        return { success: false, message: 'Erro ao criar usuário' }
      }
    }

    const transactionId = purchase.transaction || purchase.transaction_id || purchase.id || data.transaction_id
    const productId = product.id || purchase.product_id || data.product_id

    if (!transactionId) {
      console.error('❌ Webhook sem transaction_id:', JSON.stringify(data).substring(0, 200))
      return { success: false, message: 'Transaction ID não encontrado' }
    }

    const success = await upsertHotmartSubscription(user.id, {
      hotmart_transaction_id: transactionId.toString(),
      product_id: productId ? productId.toString() : 'unknown',
      status: 'expired',
    })

    if (success) {
      console.log(`✅ Assinatura expirada para usuário: ${user.email}`)
      return { success: true }
    } else {
      return { success: false, message: 'Erro ao atualizar assinatura' }
    }
  } catch (error) {
    console.error('Error handling PURCHASE_EXPIRED:', error)
    return { success: false, message: 'Erro ao processar expiração' }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obter o payload bruto para validação
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Validar assinatura do webhook (se configurado)
    const webhookSecret = process.env.HOTMART_WEBHOOK_SECRET
    const signature = request.headers.get('x-hotmart-hottok') || 
                     request.headers.get('x-hottok') ||
                     request.headers.get('authorization')?.replace('Bearer ', '')

    if (webhookSecret && signature) {
      const isValid = validateWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.error('❌ Assinatura do webhook inválida')
        return NextResponse.json(
          { error: 'Assinatura inválida' },
          { status: 401 }
        )
      }
    }

    // Extrair evento e dados
    // A estrutura pode variar entre versões do webhook
    // Versão 2.0.0: { event: "...", data: {...} }
    // Versão 1.0.0: pode ter estrutura diferente
    const event = body.event || body.type || body.event_type
    const data = body.data || body.payload || body

    if (!event) {
      console.warn('⚠️ Webhook sem evento identificado. Estrutura recebida:', JSON.stringify(body).substring(0, 200))
      return NextResponse.json(
        { error: 'Evento não identificado' },
        { status: 400 }
      )
    }

    console.log(`📥 Webhook recebido: ${event}`)
    console.log(`📋 Versão do webhook: ${body.version || 'não especificada'}`)

    // Processar evento baseado no tipo
    // Conforme tutorial: https://developers.hotmart.com/docs/pt-BR/tutorials/use-webhook-for-subscriptions/
    // Eventos da versão 2.0.0: PURCHASE_APPROVED, PURCHASE_CANCELED, PURCHASE_DELAYED
    let result
    switch (event) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_APPROVED_V2':
        result = await handlePurchaseApproved(data)
        break

      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_COMPLETE_V2':
        // Compra completa é tratada como compra aprovada
        result = await handlePurchaseApproved(data)
        break

      case 'PURCHASE_CANCELLED':
      case 'PURCHASE_CANCELLED_V2':
      case 'PURCHASE_CANCELED':  // Versão 2.0.0 usa um L (conforme tutorial)
      case 'PURCHASE_CANCELED_V2':
        result = await handlePurchaseCancelled(data)
        break

      case 'PURCHASE_DELAYED':  // Evento de compra atrasada (conforme tutorial)
      case 'PURCHASE_DELAYED_V2':
        // Compra atrasada pode ser tratada como cancelada ou com lógica específica
        result = await handlePurchaseCancelled(data)
        break

      case 'PURCHASE_EXPIRED':
      case 'PURCHASE_EXPIRED_V2':
        result = await handlePurchaseExpired(data)
        break

      default:
        console.log(`ℹ️ Evento não processado: ${event}`)
        console.log(`📋 Estrutura completa:`, JSON.stringify(body).substring(0, 500))
        return NextResponse.json(
          { message: 'Evento recebido mas não processado' },
          { status: 200 }
        )
    }

    if (result.success) {
      return NextResponse.json(
        { message: 'Webhook processado com sucesso' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: result.message || 'Erro ao processar webhook' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Permitir apenas método POST
export async function GET() {
  return NextResponse.json(
    { message: 'Webhook endpoint - Use POST para enviar eventos' },
    { status: 405 }
  )
}

