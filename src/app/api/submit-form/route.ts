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

    console.log('Received form data:', { name, email, phone, source, course })

    // Validate required fields
    if (!name || !email) {
      console.log('Validation failed: missing name or email')
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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

    console.log('Supabase response:', { data, error })

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado na lista de espera.' },
          { status: 400 }
        )
      }
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: 'Erro ao salvar dados' },
        { status: 500 }
      )
    }

    console.log('Successfully inserted data:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 