import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
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
 * 
 * REGRAS DE NEGÓCIO:
 * - Admin pode deletar qualquer pergunta (mesmo com respostas)
 * - Aluno pode deletar apenas suas próprias perguntas SEM respostas
 * - Ninguém pode deletar perguntas de outros usuários (exceto admin)
 * 
 * Ao deletar, reverte todo XP relacionado:
 * - Autor da pergunta: perde 10 XP
 * - Autores de respostas: perdem 1 XP cada (ou 100 XP se for melhor resposta)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Variáveis para uso no catch
  let isAdmin = false
  let isAuthor = false
  let perguntaId = params.id
  
  try {
    const userId = await requireUserIdFromBearer(request)
    
    // Extrair accessToken do header para usar com getSupabaseClient
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined
    
    // Usar getSupabaseClient inicialmente para verificar permissões
    const supabase = await getSupabaseClient(accessToken)
    perguntaId = params.id

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

    isAdmin = user.role === 'admin'
    isAuthor = pergunta.autor_id === userId

    // REGRAS DE NEGÓCIO:
    // 1. Admin pode deletar qualquer pergunta (mesmo com respostas)
    // 2. Aluno pode deletar apenas suas próprias perguntas SEM respostas
    // 3. Ninguém pode deletar perguntas de outros usuários (exceto admin)

    // Se não é admin nem autor, negar acesso
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para deletar esta pergunta. Apenas o autor ou um administrador podem deletar.' 
      }, { status: 403 })
    }

    // Usar sempre o supabase normal (com token do usuário)
    // As políticas RLS devem permitir que admins deletem perguntas de outros usuários
    const supabaseForDelete = supabase

    // Buscar todas as respostas da pergunta
    // Usar supabaseForDelete para garantir acesso mesmo com RLS (admin) ou usar token normal (autor)
    const { data: respostas, error: respostasError } = await supabaseForDelete
      .from('respostas')
      .select('id, autor_id, melhor_resposta, resposta_pai_id')
      .eq('pergunta_id', perguntaId)

    if (respostasError) {
      console.error('Erro ao buscar respostas:', respostasError)
      return NextResponse.json({ error: 'Erro ao verificar respostas da pergunta' }, { status: 500 })
    }

    const temRespostas = respostas && respostas.length > 0

    // Se é autor (não admin), só pode deletar se não tiver respostas
    if (!isAdmin && isAuthor && temRespostas) {
      console.log(`⚠️ Autor tentou deletar pergunta com ${respostas.length} resposta(s)`)
      return NextResponse.json({ 
        error: 'Não é possível deletar perguntas que já possuem respostas. Apenas administradores podem deletar perguntas com respostas.',
        detalhes: {
          temRespostas: true,
          quantidadeRespostas: respostas.length,
          apenasAdmin: true
        }
      }, { status: 403 })
    }

    // Log das regras aplicadas
    console.log(`📋 Regras de deleção:`, {
      isAdmin,
      isAuthor,
      temRespostas: temRespostas,
      podeDeletar: isAdmin || (isAuthor && !temRespostas),
      motivo: isAdmin 
        ? 'Admin pode deletar qualquer pergunta' 
        : isAuthor && !temRespostas 
          ? 'Autor pode deletar pergunta sem respostas'
          : 'Não pode deletar'
    })


    // Rastrear usuários afetados e quanto XP cada um perde
    const usuariosAfetados = new Map<string, number>()

    // 1. Autor da pergunta perde 10 XP
    usuariosAfetados.set(pergunta.autor_id, (usuariosAfetados.get(pergunta.autor_id) || 0) + XP_PERGUNTA)
    console.log(`📊 [DELETE] Autor da pergunta (${pergunta.autor_id}) perderá ${XP_PERGUNTA} XP`)

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

        const xpAnterior = usuariosAfetados.get(resposta.autor_id) || 0
        usuariosAfetados.set(
          resposta.autor_id,
          xpAnterior + totalXp
        )
        console.log(`📊 [DELETE] Autor da resposta (${resposta.autor_id}) perderá ${totalXp} XP ${resposta.melhor_resposta ? '(melhor resposta)' : '(resposta normal)'}`)
      }
    })

    console.log(`📊 [DELETE] Total de usuários afetados: ${usuariosAfetados.size}`)
    usuariosAfetados.forEach((xp, userId) => {
      console.log(`📊 [DELETE] - Usuário ${userId}: perderá ${xp} XP`)
    })

    // Remover entradas de XP do histórico (não crítico se falhar - apenas logar)
    // Buscar e remover a entrada de XP da pergunta
    // Usar supabaseForDelete (admin usa SupabaseAdmin, autor usa supabase normal)
    const { error: deleteXpPerguntaError } = await supabaseForDelete
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
        const { error: deleteXpRespostasError } = await supabaseForDelete
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
    // Usar supabaseForDelete (admin usa SupabaseAdmin, autor usa supabase normal)
    const { error: deleteVotosError } = await supabaseForDelete
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
      const { error: deleteRespostasError } = await supabaseForDelete
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
        
        // Se for erro de RLS, dar mensagem específica com detalhes
        if (deleteRespostasError.message?.includes('permission') || deleteRespostasError.message?.includes('policy') || deleteRespostasError.code === '42501') {
          return NextResponse.json({ 
            error: 'Erro de permissão ao deletar respostas. Verifique as políticas RLS no Supabase.',
            details: {
              message: deleteRespostasError.message,
              code: deleteRespostasError.code,
              hint: deleteRespostasError.hint,
            },
            logs: [
              `❌ Erro de permissão (RLS) ao deletar respostas`,
              `Código: ${deleteRespostasError.code || 'N/A'}`,
              `Mensagem: ${deleteRespostasError.message}`,
              deleteRespostasError.hint ? `Dica: ${deleteRespostasError.hint}` : null,
              `💡 Solução: Verifique se as políticas RLS no Supabase permitem que admins deletem respostas.`,
            ].filter(Boolean)
          }, { status: 403 })
        }
        
        return NextResponse.json({ 
          error: 'Erro ao deletar respostas',
          details: process.env.NODE_ENV === 'development' ? deleteRespostasError.message : undefined
        }, { status: 500 })
      }
    }

    // Testar se a função is_admin funciona (apenas para diagnóstico)
    if (isAdmin) {
      const { data: testAdmin, error: testError } = await supabaseForDelete
        .rpc('is_admin', { user_id: userId })
        .single()
      
      console.log('🔍 [DEBUG] Teste is_admin:', {
        userId,
        isAdmin,
        testAdmin,
        testError: testError?.message,
      })
    }

    // Deletar a pergunta (operação principal)
    const { error: deletePerguntaError, data: deletePerguntaData } = await supabaseForDelete
      .from('perguntas')
      .delete()
      .eq('id', perguntaId)
      .select()

    console.log('🔍 [DEBUG] Resultado da deleção:', {
      perguntaId,
      userId,
      isAdmin,
      isAuthor,
      deletePerguntaError: deletePerguntaError?.message,
      deletePerguntaData: deletePerguntaData?.length || 0,
    })

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
      
      // Se for erro de RLS, dar mensagem específica com detalhes no console
      if (deletePerguntaError.message?.includes('permission') || deletePerguntaError.message?.includes('policy') || deletePerguntaError.code === '42501') {
        return NextResponse.json({ 
          error: 'Erro de permissão ao deletar pergunta. Verifique as políticas RLS no Supabase.',
          details: {
            message: deletePerguntaError.message,
            code: deletePerguntaError.code,
            hint: deletePerguntaError.hint,
            isAdmin,
            isAuthor,
            perguntaId,
            userId,
          },
          logs: [
            `❌ Erro de permissão (RLS) ao deletar pergunta`,
            `Código: ${deletePerguntaError.code || 'N/A'}`,
            `Mensagem: ${deletePerguntaError.message}`,
            deletePerguntaError.hint ? `Dica: ${deletePerguntaError.hint}` : null,
            `É admin: ${isAdmin}`,
            `É autor: ${isAuthor}`,
            `Pergunta ID: ${perguntaId}`,
            `Usuário ID: ${userId}`,
            ``,
            `💡 Solução: Verifique se as políticas RLS no Supabase permitem que usuários com role='admin' deletem perguntas de outros usuários.`,
          ].filter(Boolean)
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

    // Verificar se a pergunta foi realmente deletada
    // IMPORTANTE: Se RLS bloquear, o Supabase retorna sucesso mas com array vazio
    if (!deletePerguntaData || deletePerguntaData.length === 0) {
      console.error('❌ Nenhuma pergunta foi deletada! Isso geralmente indica que RLS bloqueou a operação.')
      console.error('❌ Detalhes:', {
        perguntaId,
        userId,
        isAdmin,
        isAuthor,
        supabaseClient: isAdmin ? 'admin (deveria funcionar)' : 'normal (pode ser bloqueado por RLS)'
      })
      
      // Se for admin e não deletou, é definitivamente problema de RLS
      if (isAdmin) {
        return NextResponse.json({ 
          error: 'A pergunta não foi deletada. Provavelmente as políticas RLS no Supabase estão bloqueando a deleção mesmo para admins.',
          details: {
            perguntaId,
            userId,
            isAdmin: true,
            isAuthor,
            problema: 'RLS bloqueando deleção de admin'
          },
          logs: [
            `❌ ERRO: Pergunta não foi deletada do banco de dados`,
            `Pergunta ID: ${perguntaId}`,
            `Usuário ID: ${userId}`,
            `É admin: ${isAdmin}`,
            `É autor: ${isAuthor}`,
            ``,
            `🔍 Diagnóstico: O Supabase retornou sucesso, mas nenhum registro foi deletado.`,
            `Isso indica que as políticas RLS (Row Level Security) estão bloqueando a deleção.`,
            ``,
            `💡 Solução:`,
            `1. Acesse o Supabase Dashboard`,
            `2. Vá em Authentication > Policies para a tabela 'perguntas'`,
            `3. Crie ou ajuste uma política que permita DELETE para usuários com role='admin'`,
            `4. Exemplo de política:`,
            `   CREATE POLICY "Admins podem deletar qualquer pergunta"`,
            `   ON perguntas FOR DELETE`,
            `   USING (auth.jwt() ->> 'role' = 'admin');`,
          ].filter(Boolean)
        }, { status: 403 })
      }
      
      // Se não for admin, pode ser RLS ou pergunta já deletada
      return NextResponse.json({ 
        error: 'A pergunta não foi deletada. Verifique se você tem permissão ou se a pergunta ainda existe.',
        details: {
          perguntaId,
          userId,
          isAdmin: false,
          isAuthor,
        },
        logs: [
          `❌ ERRO: Pergunta não foi deletada do banco de dados`,
          `Pergunta ID: ${perguntaId}`,
          `Usuário ID: ${userId}`,
          `É admin: ${isAdmin}`,
          `É autor: ${isAuthor}`,
          ``,
          `💡 Possíveis causas:`,
          `1. Políticas RLS bloqueando a deleção`,
          `2. A pergunta já foi deletada anteriormente`,
          `3. Você não tem permissão para deletar esta pergunta`,
        ].filter(Boolean)
      }, { status: 403 })
    } else {
      console.log(`✅ Pergunta ${perguntaId} deletada com sucesso do banco de dados (${deletePerguntaData.length} registro(s))`)
    }

    // Recalcular XP e nível de cada usuário afetado
    const usuariosAtualizados: any[] = []

    for (const [usuarioId, xpPerdido] of usuariosAfetados.entries()) {
      // Buscar XP atual do usuário (incluindo xp_mensal)
      // Usar supabaseForDelete para garantir acesso mesmo com RLS (admin) ou usar token normal (autor)
      const { data: usuario, error: usuarioError } = await supabaseForDelete
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
      // Usar supabaseForDelete para garantir atualização mesmo com RLS (admin) ou usar token normal (autor)
      const { error: updateError } = await supabaseForDelete
        .from('users')
        .update({
          xp: novoXp,
          xp_mensal: novoXpMensal,
          level: novoNivel,
        })
        .eq('id', usuarioId)

      if (updateError) {
        console.error(`❌ Erro ao atualizar usuário ${usuarioId}:`, updateError)
      } else {
        console.log(`✅ Usuário ${usuarioId} (${usuario.name}) atualizado: ${usuario.xp} XP → ${novoXp} XP (perdeu ${xpPerdido} XP)`)
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

    // Preparar logs detalhados para o console do navegador
    const logs = [
      `✅ Pergunta ${perguntaId} deletada com sucesso`,
      `📊 ${usuariosAtualizados.length} usuário(s) tiveram XP revertido:`,
      ...usuariosAtualizados.map(u => 
        `  • ${u.nome}: ${u.xpAnterior} XP → ${u.novoXp} XP (perdeu ${u.xpPerdido} XP)`
      )
    ]

    return NextResponse.json({
      success: true,
      message: 'Pergunta deletada e XP revertido com sucesso',
      usuariosAfetados: usuariosAtualizados.length,
      detalhes: usuariosAtualizados,
      logs: logs, // Logs para aparecer no console do navegador
    })
  } catch (error: any) {
    console.error('❌ Erro ao deletar pergunta:', error)
    console.error('❌ Stack trace:', error?.stack)
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    })
    
    // Erros de autenticação
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    
    // Erros de permissão
    if (String(error?.message || '').includes('permission') || String(error?.message || '').includes('RLS') || error?.code === '42501') {
      return NextResponse.json({ 
        error: 'Erro de permissão. Verifique se você tem permissão para deletar esta pergunta.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      }, { status: 403 })
    }
    
    // Outros erros - retornar detalhes no JSON para aparecer no console do navegador
    const errorDetails = {
      message: error?.message || 'Erro desconhecido',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      // Informações úteis para diagnóstico
      isAdmin,
      isAuthor,
      perguntaId,
    }
    
    // Logar no servidor também
    console.error('❌ Erro completo:', JSON.stringify(errorDetails, null, 2))
    
    return NextResponse.json({ 
      error: 'Erro ao deletar pergunta. Verifique o console para detalhes.',
      // Sempre retornar detalhes para aparecer no console do navegador
      details: errorDetails,
      logs: [
        `❌ Erro ao deletar pergunta: ${error?.message || 'Erro desconhecido'}`,
        `Código: ${error?.code || 'N/A'}`,
        error?.details ? `Detalhes: ${error?.details}` : null,
        error?.hint ? `Dica: ${error?.hint}` : null,
        `É admin: ${isAdmin}`,
        `É autor: ${isAuthor}`,
      ].filter(Boolean)
    }, { status: 500 })
  }
}

