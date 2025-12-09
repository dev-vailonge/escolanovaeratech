import { NextRequest, NextResponse } from 'next/server'
import { getFormularioById, getMinhaRespostaFormulario } from '@/lib/database'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
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

    const formulario = await getFormularioById(params.id)

    if (!formulario) {
      return NextResponse.json(
        { error: 'Formulário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar resposta do usuário se existir
    const minhaResposta = await getMinhaRespostaFormulario(params.id, session.user.id)

    return NextResponse.json({ 
      formulario,
      minhaResposta: minhaResposta || null
    })
  } catch (error) {
    console.error('Error fetching formulario:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar formulário' },
      { status: 500 }
    )
  }
}

