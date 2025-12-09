/**
 * Webhook endpoint para receber eventos da Hotmart
 * 
 * Documentação: https://developers.hotmart.com/docs/pt-BR/1.0.0/webhook/about-webhook/
 * 
 * Eventos suportados:
 * - PURCHASE_APPROVED: Compra aprovada
 * - PURCHASE_CANCELLED: Compra cancelada
 * - PURCHASE_EXPIRED: Compra expirada
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { upsertHotmartSubscription } from '@/lib/hotmart'
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
    const purchase = data.purchase
    const buyer = purchase.buyer
    const product = purchase.product

    // Buscar usuário por email
    let user = await getUserByEmail(buyer.email)
    
    // Se não existir, criar automaticamente
    if (!user) {
      console.log(`📝 Criando novo usuário para email: ${buyer.email}`)
      const buyerName = buyer.name || buyer.first_name || buyer.email.split('@')[0]
      
      user = await createUser({
        email: buyer.email,
        name: buyerName,
        role: 'aluno',
        access_level: 'full', // Compra aprovada = acesso completo
      })

      if (!user) {
        console.error(`❌ Erro ao criar usuário para: ${buyer.email}`)
        return { success: false, message: 'Erro ao criar usuário' }
      }
      
      console.log(`✅ Usuário criado automaticamente: ${buyer.email}`)
    }

    // Atualizar ou criar assinatura
    const success = await upsertHotmartSubscription(user.id, {
      hotmart_transaction_id: purchase.transaction,
      product_id: product.id.toString(),
      status: 'active',
      expires_at: purchase.expires_date || null,
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
    const purchase = data.purchase
    const buyer = purchase.buyer

    let user = await getUserByEmail(buyer.email)
    
    // Se não existir, criar (pode ser um cancelamento de compra futura)
    if (!user) {
      console.log(`📝 Criando novo usuário para email: ${buyer.email} (cancelamento)`)
      const buyerName = buyer.name || buyer.first_name || buyer.email.split('@')[0]
      
      user = await createUser({
        email: buyer.email,
        name: buyerName,
        role: 'aluno',
        access_level: 'limited', // Cancelado = acesso limitado
      })

      if (!user) {
        console.error(`❌ Erro ao criar usuário para: ${buyer.email}`)
        return { success: false, message: 'Erro ao criar usuário' }
      }
    }

    const success = await upsertHotmartSubscription(user.id, {
      hotmart_transaction_id: purchase.transaction,
      product_id: purchase.product.id.toString(),
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
    const purchase = data.purchase
    const buyer = purchase.buyer

    let user = await getUserByEmail(buyer.email)
    
    // Se não existir, criar (pode ser uma expiração de compra futura)
    if (!user) {
      console.log(`📝 Criando novo usuário para email: ${buyer.email} (expirado)`)
      const buyerName = buyer.name || buyer.first_name || buyer.email.split('@')[0]
      
      user = await createUser({
        email: buyer.email,
        name: buyerName,
        role: 'aluno',
        access_level: 'limited', // Expirado = acesso limitado
      })

      if (!user) {
        console.error(`❌ Erro ao criar usuário para: ${buyer.email}`)
        return { success: false, message: 'Erro ao criar usuário' }
      }
    }

    const success = await upsertHotmartSubscription(user.id, {
      hotmart_transaction_id: purchase.transaction,
      product_id: purchase.product.id.toString(),
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
    const event = body.event
    const data = body.data

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Evento ou dados inválidos' },
        { status: 400 }
      )
    }

    console.log(`📥 Webhook recebido: ${event}`)

    // Processar evento baseado no tipo
    let result
    switch (event) {
      case 'PURCHASE_APPROVED':
        result = await handlePurchaseApproved(data)
        break

      case 'PURCHASE_CANCELLED':
        result = await handlePurchaseCancelled(data)
        break

      case 'PURCHASE_EXPIRED':
        result = await handlePurchaseExpired(data)
        break

      default:
        console.log(`ℹ️ Evento não processado: ${event}`)
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

