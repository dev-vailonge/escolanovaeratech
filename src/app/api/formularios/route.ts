import { NextRequest, NextResponse } from 'next/server'
import { getFormulariosAtivos, getAllFormularios, getUserById } from '@/lib/database'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Verificar se é admin - admins veem todos os formulários, alunos veem apenas ativos
    const dbUser = await getUserById(session.user.id)
    const isAdmin = dbUser?.role === 'admin'

    console.log('API /formularios - User ID:', session.user.id)
    console.log('API /formularios - DB User:', dbUser)
    console.log('API /formularios - Is Admin:', isAdmin)

    const formularios = isAdmin 
      ? await getAllFormularios() 
      : await getFormulariosAtivos()

    console.log(`Formulários retornados para ${isAdmin ? 'admin' : 'aluno'}:`, formularios.length)
    console.log('Formulários:', formularios)

    return NextResponse.json({ formularios })
  } catch (error) {
    console.error('Error fetching formularios:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar formulários' },
      { status: 500 }
    )
  }
}

