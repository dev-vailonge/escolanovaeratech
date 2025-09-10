import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, source, course, utm_source, utm_medium, utm_campaign } = body

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
          utm_campaign: (typeof utm_campaign === 'string' && utm_campaign.trim()) || 'jzt'
        }
      ])

    if (error) {
      // erro suprimido em produção
      return NextResponse.json(
        { error: (error as any)?.message || 'Erro ao salvar dados' },
        { status: 500 }
      )
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