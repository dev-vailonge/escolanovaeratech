import { NextResponse } from 'next/server'
import { responderComunidade } from '@/lib/server/gamification'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const perguntaId = params.id
    
    if (!perguntaId) {
      return NextResponse.json({ error: 'perguntaId inválido' }, { status: 400 })
    }
    
    // Extrair accessToken do header ANTES de chamar requireUserIdFromBearer
    // Isso permite usar o token mesmo se a validação falhar
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const userId = await requireUserIdFromBearer(request)
    
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se o usuário tem acesso full
    // Primeiro, verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, access_level, role, name, email')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar usuário',
        details: userError.message
      }, { status: 500 })
    }

    if (!user) {
      // Verificar se o usuário existe no auth.users
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError || !authUser) {
          return NextResponse.json({ 
            error: 'Usuário não encontrado. Por favor, faça login novamente.',
            userId,
          }, { status: 404 })
        }
        
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
            access_level: 'full',
          })
          .select('id, access_level, role, name, email')
          .single()
        
        if (createError || !newUser) {
          return NextResponse.json({ 
            error: 'Erro ao criar usuário. Por favor, faça logout e login novamente.',
            details: createError?.message,
          }, { status: 500 })
        }
        
        // Usar o novo usuário criado
        const createdUser = newUser
        if ((createdUser.role === 'aluno' || createdUser.role === 'formacao') && createdUser.access_level !== 'full') {
          return NextResponse.json(
            { error: 'Apenas alunos com acesso completo podem responder perguntas' },
            { status: 403 }
          )
        }
        
        // Continuar com o fluxo normal usando o usuário criado
        const body = await request.json().catch(() => ({}))
        const conteudo = String(body?.conteudo || '').trim()

        if (conteudo.length < 3) {
          return NextResponse.json({ error: 'conteudo muito curto' }, { status: 400 })
        }

        // IMPORTANTE: Passar accessToken também quando usuário é criado automaticamente
        const result = await responderComunidade({ userId, perguntaId, conteudo, accessToken })
        return NextResponse.json({ success: true, result })
      } catch (authErr: any) {
        return NextResponse.json({ 
          error: 'Erro ao processar usuário. Por favor, faça logout e login novamente.',
        }, { status: 500 })
      }
    }

    // Apenas alunos (aluno/formacao) com acesso full ou admins podem responder perguntas
    if ((user.role === 'aluno' || user.role === 'formacao') && user.access_level !== 'full') {
      return NextResponse.json(
        { error: 'Apenas alunos com acesso completo podem responder perguntas' },
        { status: 403 }
      )
    }

    // Verificar se a pergunta já está resolvida (tem melhor resposta marcada)
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select('id, resolvida, melhor_resposta_id')
      .eq('id', perguntaId)
      .single()

    if (perguntaError) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    if (pergunta?.resolvida === true) {
      return NextResponse.json(
        { error: 'Esta pergunta já foi marcada como resolvida. Não é possível adicionar novas respostas ou comentários.' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const conteudo = String(body?.conteudo || '').trim()

    if (conteudo.length < 3) {
      return NextResponse.json({ error: 'conteudo muito curto' }, { status: 400 })
    }

    const result = await responderComunidade({ userId, perguntaId, conteudo, accessToken })
    
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    // Erros de autenticação
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    // Erros de permissão
    if (String(error?.message || '').includes('permission') || String(error?.message || '').includes('RLS')) {
      return NextResponse.json({ 
        error: 'Erro de permissão. Verifique se você tem permissão para responder esta pergunta.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      }, { status: 403 })
    }
    
    // Outros erros - retornar mensagem específica em dev, genérica em prod
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Erro ao responder pergunta'
      : 'Erro ao responder pergunta. Tente novamente mais tarde.'
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}


