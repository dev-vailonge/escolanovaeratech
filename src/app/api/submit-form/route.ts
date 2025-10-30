import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, source, course, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = body

    // Normalize inputs
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : ''
    const normalizedSource = typeof source === 'string' ? source.trim() : ''

    // Validate required fields
    if (!normalizedName || !normalizedEmail) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // logs removidos

    // Idempotent behavior: if email already exists, treat as success and skip insert
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing?.id) {
      return NextResponse.json({ success: true, alreadyExists: true })
    }

    // Insert new lead (no id provided)
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone || 'Não informado',
          source: normalizedSource || 'landing-page',
          utm_source: utm_source || '',
          utm_medium: utm_medium || '',
          utm_campaign: (typeof utm_campaign === 'string' && utm_campaign.trim()) || 'jzt',
          utm_content: utm_content || '',
          utm_term: utm_term || ''
        }
      ])

    if (error) {
      // erro suprimido em produção
      return NextResponse.json(
        { error: (error as any)?.message || 'Erro ao salvar dados' },
        { status: 500 }
      )
    }

    // Call webhook after successful database insert
    try {
      const webhookUrl = process.env.LEADCONNECTOR_WEBHOOK_URL
      
      if (!webhookUrl) {
        console.log("⚠️ Nenhum webhook configurado (LEADCONNECTOR_WEBHOOK_URL ausente).")
        return NextResponse.json({ success: true, data })
      }

      const webhookPayload = {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone || 'Não informado',
        source: normalizedSource || 'landing-page',
        course: course || '',
        utm_source: utm_source || '',
        utm_medium: utm_medium || '',
        utm_campaign: (typeof utm_campaign === 'string' && utm_campaign.trim()) || 'jzt',
        utm_content: utm_content || '',
        utm_term: utm_term || '',
        timestamp: new Date().toISOString()
      }

       // ✅ LOGS SEGUROS
  console.log("🚀 Enviando webhook:", {
    url: webhookUrl,
    payloadPreview: {
      name: normalizedName.split(" ")[0], // só o primeiro nome
      emailHash: Buffer.from(normalizedEmail).toString('base64').slice(0, 10) + "...", // anonimizado
      source: normalizedSource,
      utm_campaign,
      timestamp: webhookPayload.timestamp
    }
  })

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })
      console.log(`✅ Webhook enviado. Status: ${res.status}`)
    } catch (webhookError) {
      // Webhook error - don't fail the main request
      console.error("❌ Falha ao enviar webhook:", (webhookError as Error)?.message)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    // erro suprimido em produção
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
