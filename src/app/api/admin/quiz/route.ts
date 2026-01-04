import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export const runtime = 'nodejs'

// POST - Criar quiz
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se é admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas admins podem criar quizzes.' }, { status: 403 })
    }

    const body = await request.json()
    
    const { titulo, descricao, tecnologia, nivel, questoes, xp } = body

    if (!titulo || !descricao || !tecnologia || !nivel) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    console.log('📤 API: Criando quiz com', Array.isArray(questoes) ? questoes.length : 0, 'perguntas')

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        titulo,
        descricao,
        tecnologia,
        nivel,
        questoes: questoes || [],
        xp: xp || 50,
        disponivel: true,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Quiz criado:', data.id)
    return NextResponse.json({ success: true, quiz: data })
  } catch (error: any) {
    console.error('❌ Erro na API de quiz:', error)
    if (error?.message?.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar quiz
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se é admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, titulo, descricao, tecnologia, nivel, questoes, xp, disponivel } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do quiz é obrigatório' }, { status: 400 })
    }

    console.log('📤 API: Atualizando quiz', id)

    const updates: Record<string, any> = {}
    if (titulo !== undefined) updates.titulo = titulo
    if (descricao !== undefined) updates.descricao = descricao
    if (tecnologia !== undefined) updates.tecnologia = tecnologia
    if (nivel !== undefined) updates.nivel = nivel
    if (questoes !== undefined) updates.questoes = questoes
    if (xp !== undefined) updates.xp = xp
    if (disponivel !== undefined) updates.disponivel = disponivel

    const { data, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Quiz atualizado:', data.id)
    return NextResponse.json({ success: true, quiz: data })
  } catch (error: any) {
    console.error('❌ Erro na API de quiz:', error)
    if (error?.message?.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir quiz
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se é admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do quiz é obrigatório' }, { status: 400 })
    }

    console.log('🗑️ API: Excluindo quiz', id)

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erro ao excluir quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Quiz excluído:', id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Erro na API de quiz:', error)
    if (error?.message?.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}





