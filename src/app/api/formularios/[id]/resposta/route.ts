import { NextRequest, NextResponse } from 'next/server'
import { salvarRespostaFormulario, getFormularioById } from '@/lib/database'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Criar cliente Supabase para API route (server-side)
    const supabase = createServerComponentClient({ cookies })
    
    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Erro de autenticação:', sessionError)
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o formulário existe e está ativo
    const formulario = await getFormularioById(params.id)
    
    if (!formulario) {
      return NextResponse.json(
        { error: 'Formulário não encontrado ou inativo' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { respostas } = body

    if (!respostas || typeof respostas !== 'object') {
      return NextResponse.json(
        { error: 'Respostas inválidas' },
        { status: 400 }
      )
    }

    // Salvar resposta
    const respostaSalva = await salvarRespostaFormulario(
      params.id,
      session.user.id,
      respostas
    )

    if (!respostaSalva) {
      return NextResponse.json(
        { error: 'Erro ao salvar resposta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      resposta: respostaSalva
    })
  } catch (error) {
    console.error('Error saving resposta:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar resposta' },
      { status: 500 }
    )
  }
}

