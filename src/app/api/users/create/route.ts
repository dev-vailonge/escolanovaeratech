import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import type { DatabaseUser } from '@/types/database'

/**
 * API route para criar usuário na tabela users após signup
 * Usa Supabase Admin para contornar RLS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, name, role = 'aluno', access_level = 'full' } = body

    if (!id || !email || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: id, email, name' },
        { status: 400 }
      )
    }

    // Tentar obter cliente Supabase Admin
    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch (adminError: any) {
      console.warn('⚠️ Supabase Admin não disponível (service role key não configurada):', adminError.message)
      // Se não tiver service role key, retornar erro informativo
      // A página de signup trata isso como não-bloqueante (usuário será criado por trigger ou AuthContext)
      return NextResponse.json(
        { 
          success: false,
          error: 'Service role key não configurada. O usuário será criado automaticamente por trigger do banco de dados ou pelo AuthContext.',
          code: 'MISSING_SERVICE_ROLE_KEY'
        },
        { status: 503 } // Service Unavailable - indica que o serviço não está disponível, mas não é um erro crítico
      )
    }

    // SEGURANÇA: Verificar se o usuário realmente existe no auth.users
    // Isso previne criação de usuários sem autenticação válida
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id)
      
      if (authError || !authUser?.user) {
        console.error(`❌ Usuário não encontrado no auth.users: ${id}`)
        return NextResponse.json(
          { error: 'Usuário não encontrado no sistema de autenticação' },
          { status: 404 }
        )
      }

      // Validar que o email fornecido corresponde ao email do auth.users
      if (authUser.user.email !== email) {
        console.error(`❌ Email não corresponde: fornecido=${email}, auth=${authUser.user.email}`)
        return NextResponse.json(
          { error: 'Email não corresponde ao usuário autenticado' },
          { status: 400 }
        )
      }

      console.log(`✅ Usuário validado no auth.users: ${email}`)
    } catch (authErr: any) {
      console.error(`❌ Erro ao validar usuário no auth: ${authErr?.message || authErr}`)
      return NextResponse.json(
        { error: 'Erro ao validar autenticação do usuário' },
        { status: 500 }
      )
    }

    // PRIMEIRO: Confirmar email automaticamente usando Admin API
    // Isso é essencial para que o usuário possa fazer login
    try {
      const { data: userData, error: confirmError } = await supabase.auth.admin.updateUserById(id, {
        email_confirm: true,
        user_metadata: {
          name: name
        }
      })
      
      if (confirmError) {
        console.error(`❌ Erro ao confirmar email: ${confirmError.message}`)
        return NextResponse.json(
          { error: `Erro ao confirmar email: ${confirmError.message}`, details: confirmError },
          { status: 500 }
        )
      }
      
      console.log(`✅ Email confirmado automaticamente para: ${email}`)
    } catch (confirmErr: any) {
      console.error(`❌ Erro ao confirmar email: ${confirmErr?.message || confirmErr}`)
      return NextResponse.json(
        { error: `Erro ao confirmar email: ${confirmErr?.message || 'Erro desconhecido'}` },
        { status: 500 }
      )
    }

    // Verificar se já existe usuário com esse ID
    const { data: existingById } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (existingById) {
      console.log(`✅ Usuário já existe com ID: ${id}`)
      return NextResponse.json({ success: true, user: existingById })
    }

    // Verificar se já existe usuário com esse email
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingByEmail) {
      // Se o usuário existe mas com ID diferente, retornar sucesso mas logar aviso
      // O trigger pode ter criado o usuário com um ID diferente, mas isso é OK
      if (existingByEmail.id !== id) {
        console.warn(`⚠️ Usuário ${email} já existe com ID diferente (${existingByEmail.id} vs ${id}). Retornando existente.`)
        console.warn(`⚠️ Isso pode indicar que o trigger criou o usuário antes do signUp completar.`)
      }
      console.log(`✅ Usuário já existe: ${email}`)
      return NextResponse.json({ success: true, user: existingByEmail })
    }

    // Criar novo usuário
    const { data, error } = await supabase
      .from('users')
      .insert({
        id,
        email,
        name,
        role,
        access_level,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar usuário:', error)
      return NextResponse.json(
        { error: `Erro ao criar usuário: ${error.message}`, details: error },
        { status: 500 }
      )
    }

    console.log(`✅ Usuário criado: ${email} (ID: ${id})`)
    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    console.error('❌ Erro na API de criar usuário:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

