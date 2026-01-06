import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { calculateLevel } from '@/lib/gamification'
import { XP_CONSTANTS } from '@/lib/gamification/constants'
import { invalidateRankingCache } from '@/lib/server/rankingCache'

// Constantes para facilitar leitura
const XP_PERGUNTA = XP_CONSTANTS.comunidade.pergunta
const XP_RESPOSTA = XP_CONSTANTS.comunidade.resposta
const XP_MELHOR_RESPOSTA = XP_CONSTANTS.comunidade.respostaCerta // 100 XP total

/**
 * DELETE /api/comunidade/perguntas/[id]/delete
 * Permite que admin ou criador (se não tiver respostas) delete uma pergunta e reverta todo XP relacionado
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    
    // Extrair accessToken do header para usar com getSupabaseClient
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    // Usar getSupabaseClient inicialmente para verificar permissões
    const supabase = await getSupabaseClient(accessToken)
    const perguntaId = params.id

    if (!perguntaId) {
      return NextResponse.json({ error: 'ID da pergunta inválido' }, { status: 400 })
    }

    // Verificar se o usuário existe e obter role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar a pergunta para verificar autor
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .select(`
        id,
        autor_id,
        melhor_resposta_id
      `)
      .eq('id', perguntaId)
      .single()

    if (perguntaError || !pergunta) {
      console.error('Erro ao buscar pergunta:', perguntaError)
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    const isAdmin = user.role === 'admin'
    const isAuthor = pergunta.autor_id === userId

    // Se não é admin nem autor, negar acesso
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Você não tem permissão para deletar esta pergunta' }, { status: 403 })
    }

    // Se for admin, usar SupabaseAdmin para garantir que a deleção funcione mesmo com RLS
    const supabaseAdmin = isAdmin ? getSupabaseAdmin() : supabase

    // Buscar todas as respostas da pergunta
    const { data: respostas, error: respostasError } = await supabase
      .from('respostas')
      .select('id, autor_id, melhor_resposta, resposta_pai_id')
      .eq('pergunta_id', perguntaId)

    if (respostasError) {
      console.error('Erro ao buscar respostas:', respostasError)
      return NextResponse.json({ error: 'Erro ao verificar respostas da pergunta' }, { status: 500 })
    }

    // Se é autor (não admin), só pode deletar se não tiver respostas
    if (!isAdmin && isAuthor && respostas && respostas.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível deletar perguntas que já possuem respostas. Apenas administradores podem deletar perguntas com respostas.' 
      }, { status: 403 })
    }


    // Rastrear usuários afetados e quanto XP cada um perde
    const usuariosAfetados = new Map<string, number>()

    // 1. Autor da pergunta perde 10 XP
    usuariosAfetados.set(pergunta.autor_id, (usuariosAfetados.get(pergunta.autor_id) || 0) + XP_PERGUNTA)

    // 2. Para cada resposta, o autor perde 1 XP
    // 3. Se a resposta é a melhor resposta, o total é 100 XP (1 XP da resposta + 99 XP do bônus)
    //    Portanto, ao deletar, remove-se 100 XP no total
    respostas?.forEach((resposta) => {
      // Apenas respostas diretas (não comentários) contam
      if (!resposta.resposta_pai_id) {
        // Se é melhor resposta, perde 100 XP total (1 da resposta + 99 do bônus)
        // Se é resposta normal, perde 1 XP
        const totalXp = resposta.melhor_resposta 
          ? XP_MELHOR_RESPOSTA 
          : XP_RESPOSTA

        usuariosAfetados.set(
          resposta.autor_id,
          (usuariosAfetados.get(resposta.autor_id) || 0) + totalXp
        )
      }
    })

    // Remover entradas de XP do histórico (não crítico se falhar - apenas logar)
    // Buscar e remover a entrada de XP da pergunta
    // Usar supabaseAdmin se for admin para garantir remoção mesmo com RLS
    const { error: deleteXpPerguntaError } = await supabaseAdmin
      .from('user_xp_history')
      .delete()
      .eq('source', 'comunidade')
      .eq('source_id', perguntaId) // source_id é salvo como UUID direto, sem prefixo

    if (deleteXpPerguntaError) {
      console.warn('⚠️ Aviso: Erro ao remover XP da pergunta do histórico (não crítico):', deleteXpPerguntaError)
      // Não bloquear deleção por erro de XP history (pode ser RLS ou não existir)
    }

    // Remover entradas de XP das respostas (não crítico se falhar - apenas logar)
    if (respostas && respostas.length > 0) {
      const respostaIds = respostas.map((r) => r.id) // UUID direto, sem prefixo

      if (respostaIds.length > 0) {
        const { error: deleteXpRespostasError } = await supabaseAdmin
          .from('user_xp_history')
          .delete()
          .eq('source', 'comunidade')
          .in('source_id', respostaIds)

        if (deleteXpRespostasError) {
          console.warn('⚠️ Aviso: Erro ao remover XP das respostas do histórico (não crítico):', deleteXpRespostasError)
          // Não bloquear deleção por erro de XP history (pode ser RLS ou não existir)
        }
      }
    }

    // Deletar votos da pergunta (não crítico se falhar - apenas logar)
    // Usar supabaseAdmin se for admin para garantir deleção mesmo com RLS
    const { error: deleteVotosError } = await supabaseAdmin
      .from('pergunta_votos')
      .delete()
      .eq('pergunta_id', perguntaId)

    if (deleteVotosError) {
      console.warn('⚠️ Aviso: Erro ao deletar votos (não crítico, continuando):', deleteVotosError)
      // Não bloquear deleção por erro de votos (pode ser RLS)
      // Se houver constraint de foreign key, o erro virá ao tentar deletar a pergunta
    }

    // Deletar respostas (incluindo comentários) - APENAS SE HOUVER respostas
    if (respostas && respostas.length > 0) {
      const { error: deleteRespostasError } = await supabaseAdmin
        .from('respostas')
        .delete()
        .eq('pergunta_id', perguntaId)

      if (deleteRespostasError) {
        console.error('❌ Erro ao deletar respostas:', deleteRespostasError)
        console.error('❌ Detalhes do erro:', {
          message: deleteRespostasError.message,
          details: deleteRespostasError.details,
          hint: deleteRespostasError.hint,
          code: deleteRespostasError.code,
        })
        
        // Se for erro de RLS, dar mensagem específica
        if (deleteRespostasError.message?.includes('permission') || deleteRespostasError.message?.includes('policy') || deleteRespostasError.code === '42501') {
          return NextResponse.json({ 
            error: 'Erro de permissão ao deletar respostas. Verifique as políticas RLS no Supabase.',
            details: process.env.NODE_ENV === 'development' ? deleteRespostasError.message : undefined
          }, { status: 403 })
        }
        
        return NextResponse.json({ 
          error: 'Erro ao deletar respostas',
          details: process.env.NODE_ENV === 'development' ? deleteRespostasError.message : undefined
        }, { status: 500 })
      }
    }

    // Deletar a pergunta (operação principal)
    // Usar supabaseAdmin se for admin para garantir deleção mesmo com RLS
    const { error: deletePerguntaError } = await supabaseAdmin
      .from('perguntas')
      .delete()
      .eq('id', perguntaId)

    if (deletePerguntaError) {
      console.error('❌ Erro ao deletar pergunta:', deletePerguntaError)
      console.error('❌ Detalhes do erro:', {
        message: deletePerguntaError.message,
        details: deletePerguntaError.details,
        hint: deletePerguntaError.hint,
        code: deletePerguntaError.code,
        perguntaId,
        userId,
        isAdmin,
        isAuthor,
      })
      
      // Se for erro de RLS, dar mensagem específica
      if (deletePerguntaError.message?.includes('permission') || deletePerguntaError.message?.includes('policy') || deletePerguntaError.code === '42501') {
        return NextResponse.json({ 
          error: 'Erro de permissão ao deletar pergunta. Verifique as políticas RLS no Supabase.',
          details: process.env.NODE_ENV === 'development' ? deletePerguntaError.message : undefined
        }, { status: 403 })
      }
      
      // Se for erro de foreign key constraint, dar mensagem específica
      if (deletePerguntaError.code === '23503' || deletePerguntaError.message?.includes('foreign key') || deletePerguntaError.message?.includes('constraint')) {
        return NextResponse.json({ 
          error: 'Não é possível deletar a pergunta. Ainda existem dados relacionados (respostas, votos, etc).',
          details: process.env.NODE_ENV === 'development' ? deletePerguntaError.message : undefined
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: 'Erro ao deletar pergunta',
        details: process.env.NODE_ENV === 'development' ? deletePerguntaError.message : undefined
      }, { status: 500 })
    }

    // Recalcular XP e nível de cada usuário afetado
    const usuariosAtualizados: any[] = []

    for (const [usuarioId, xpPerdido] of usuariosAfetados.entries()) {
      // Buscar XP atual do usuário (incluindo xp_mensal)
      // Usar supabaseAdmin para garantir acesso mesmo com RLS
      const { data: usuario, error: usuarioError } = await supabaseAdmin
        .from('users')
        .select('xp, xp_mensal, level, name')
        .eq('id', usuarioId)
        .single()

      if (usuarioError || !usuario) {
        console.error(`Erro ao buscar usuário ${usuarioId}:`, usuarioError)
        continue
      }

      // Calcular novo XP (não pode ser negativo)
      const novoXp = Math.max(0, (usuario.xp || 0) - xpPerdido)
      const novoXpMensal = Math.max(0, (usuario.xp_mensal || 0) - xpPerdido)
      const novoNivel = calculateLevel(novoXp)

      // Atualizar usuário (xp total e xp mensal)
      // Usar supabaseAdmin para garantir atualização mesmo com RLS
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          xp: novoXp,
          xp_mensal: novoXpMensal,
          level: novoNivel,
        })
        .eq('id', usuarioId)

      if (updateError) {
        console.error(`Erro ao atualizar usuário ${usuarioId}:`, updateError)
      } else {
        usuariosAtualizados.push({
          id: usuarioId,
          nome: usuario.name,
          xpAnterior: usuario.xp,
          xpMensalAnterior: usuario.xp_mensal,
          xpPerdido,
          novoXp,
          novoXpMensal,
          nivelAnterior: usuario.level,
          novoNivel,
        })
      }
    }

    // Invalidar cache do ranking para refletir mudanças imediatamente
    invalidateRankingCache()

    return NextResponse.json({
      success: true,
      message: 'Pergunta deletada e XP revertido com sucesso',
      usuariosAfetados: usuariosAtualizados.length,
      detalhes: usuariosAtualizados,
    })
  } catch (error: any) {
    console.error('Erro ao deletar pergunta:', error)
    console.error('Stack trace:', error?.stack)
    
    // Erros de autenticação
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    // Erros de permissão
    if (String(error?.message || '').includes('permission') || String(error?.message || '').includes('RLS')) {
      return NextResponse.json({ 
        error: 'Erro de permissão. Verifique se você tem permissão para deletar esta pergunta.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      }, { status: 403 })
    }
    
    // Outros erros - retornar mensagem específica em dev, genérica em prod
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Erro ao deletar pergunta'
      : 'Erro ao deletar pergunta. Tente novamente mais tarde.'
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

