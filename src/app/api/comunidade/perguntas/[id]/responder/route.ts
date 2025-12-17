import { NextResponse } from 'next/server'
import { responderComunidade } from '@/lib/server/gamification'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('📥 [API] Recebendo requisição para responder pergunta')
    
    const perguntaId = params.id
    console.log('📝 [API] Pergunta ID:', perguntaId)
    
    if (!perguntaId) {
      console.error('❌ [API] perguntaId inválido')
      return NextResponse.json({ error: 'perguntaId inválido' }, { status: 400 })
    }
    
    const userId = await requireUserIdFromBearer(request)
    console.log('👤 [API] Usuário ID:', userId)
    
    const supabase = getSupabaseAdmin()

    // Verificar se o usuário tem acesso full
    console.log('🔍 [API] Buscando usuário no banco:', userId)
    
    // Primeiro, verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, access_level, role, name, email')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      console.error('❌ [API] Erro ao buscar usuário:', userError)
      console.error('❌ [API] Detalhes:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code,
      })
      return NextResponse.json({ 
        error: 'Erro ao buscar usuário',
        details: userError.message
      }, { status: 500 })
    }

    if (!user) {
      console.error('❌ [API] Usuário não encontrado no banco. ID:', userId)
      
      // Verificar se o usuário existe no auth.users
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError || !authUser) {
          console.error('❌ [API] Usuário também não existe no auth.users')
          return NextResponse.json({ 
            error: 'Usuário não encontrado. Por favor, faça login novamente.',
            userId,
          }, { status: 404 })
        }
        
        console.log('⚠️ [API] Usuário existe no auth.users mas não na tabela users. Criando automaticamente...')
        console.log('📧 [API] Email do usuário:', authUser.email)
        
        // Criar usuário automaticamente na tabela users
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || 
                  authUser.user_metadata?.full_name || 
                  authUser.user_metadata?.display_name ||
                  authUser.email?.split('@')[0] || 
                  'Usuário',
            role: 'aluno',
            access_level: 'limited',
          })
          .select('id, access_level, role, name, email')
          .single()
        
        if (createError || !newUser) {
          console.error('❌ [API] Erro ao criar usuário automaticamente:', createError)
          return NextResponse.json({ 
            error: 'Erro ao criar usuário. Por favor, faça logout e login novamente.',
            details: createError?.message,
          }, { status: 500 })
        }
        
        console.log('✅ [API] Usuário criado automaticamente:', newUser.id)
        
        // Usar o novo usuário criado
        const createdUser = newUser
        if (createdUser.role === 'aluno' && createdUser.access_level !== 'full') {
          return NextResponse.json(
            { error: 'Apenas alunos com acesso completo podem responder perguntas' },
            { status: 403 }
          )
        }
        
        // Continuar com o fluxo normal usando o usuário criado
        const body = await request.json().catch(() => ({}))
        console.log('📝 [API] Conteúdo da resposta:', body?.conteudo?.substring(0, 50) + '...')
        const conteudo = String(body?.conteudo || '').trim()

        if (conteudo.length < 3) {
          return NextResponse.json({ error: 'conteudo muito curto' }, { status: 400 })
        }

        const result = await responderComunidade({ userId, perguntaId, conteudo })
        return NextResponse.json({ success: true, result })
      } catch (authErr: any) {
        console.error('❌ [API] Erro ao verificar/criar usuário:', authErr)
        return NextResponse.json({ 
          error: 'Erro ao processar usuário. Por favor, faça logout e login novamente.',
        }, { status: 500 })
      }
    }
    
    console.log('✅ [API] Usuário encontrado:', { 
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role, 
      access_level: user.access_level 
    })

    // Apenas alunos com acesso full ou admins podem responder perguntas
    if (user.role === 'aluno' && user.access_level !== 'full') {
      return NextResponse.json(
        { error: 'Apenas alunos com acesso completo podem responder perguntas' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    console.log('📝 [API] Conteúdo da resposta:', body?.conteudo?.substring(0, 50) + '...')
    const conteudo = String(body?.conteudo || '').trim()

    if (conteudo.length < 3) {
      return NextResponse.json({ error: 'conteudo muito curto' }, { status: 400 })
    }

    const result = await responderComunidade({ userId, perguntaId, conteudo })
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Erro ao responder comunidade:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao responder' }, { status: 500 })
  }
}


