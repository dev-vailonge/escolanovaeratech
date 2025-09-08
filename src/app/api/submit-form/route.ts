import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, source, course } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Insert into waiting_list table
    const { data, error } = await supabase
      .from('waiting_list')
      .insert([
        {
          name,
          email,
          phone: phone || 'Não informado',
          source: source || 'landing-page'
        }
      ])

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado na lista de espera.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Erro ao salvar dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 