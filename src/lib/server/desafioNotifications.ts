import { getSupabaseClient } from './getSupabaseClient'

/**
 * Cria notificação para admins quando aluno submete desafio
 */
export async function notificarAdminsNovaSubmissao(params: {
  alunoNome: string
  desafioTitulo: string
  desafioId: string
  submissionId: string
  accessToken: string
}) {
  try {
    const supabase = await getSupabaseClient(params.accessToken)
  
    console.log('🔔 Iniciando notificação para admins...')
    
    // Usar função SQL segura que não expõe IDs dos admins
    // A função notify_admins_new_submission usa SECURITY DEFINER para executar com privilégios elevados
    const { error: functionError } = await supabase.rpc('notify_admins_new_submission', {
      p_aluno_nome: params.alunoNome,
      p_desafio_titulo: params.desafioTitulo,
      p_desafio_id: params.desafioId,
      p_submission_id: params.submissionId
    })

    if (functionError) {
      console.error('❌ Erro ao notificar admins via função SQL:', functionError)
      console.error('⚠️ Verifique se a função notify_admins_new_submission existe no banco')
      return
    }

    console.log('✅ Notificações criadas para todos os admins')
  } catch (error: any) {
    // Falhar silenciosamente (não deve bloquear a submissão do desafio)
    console.error('❌ Erro ao notificar admins:', error?.message || error)
  }
}

/**
 * Cria notificação para aluno quando desafio é aprovado
 */
export async function notificarAlunoDesafioAprovado(params: {
  alunoId: string
  desafioTitulo: string
  desafioId: string
  xpGanho: number
  accessToken: string
}) {
  try {
    const supabase = await getSupabaseClient(params.accessToken)
    
    console.log(`🔔 Notificando aluno ${params.alunoId} sobre aprovação...`)

    const agora = new Date()
    const dataFim = new Date()
    dataFim.setDate(dataFim.getDate() + 7)

    const { error: insertError } = await supabase.from('notificacoes').insert({
      titulo: '🎉 Desafio Aprovado!',
      mensagem: `Parabéns! Seu desafio "${params.desafioTitulo}" foi aprovado! Você ganhou ${params.xpGanho} XP.`,
      tipo: 'info', // 'success' não é válido na constraint, usando 'info'
      data_inicio: agora.toISOString(),
      data_fim: dataFim.toISOString(),
      publico_alvo: 'todos',
      target_user_id: params.alunoId,
      related_desafio_id: params.desafioId,
      action_url: '/aluno/desafios',
      created_by: null
    })

    if (insertError) {
      console.error('❌ Erro ao criar notificação de aprovação:', insertError)
    } else {
      console.log(`✅ Notificação de aprovação criada para aluno ${params.alunoId}`)
    }
  } catch (error: any) {
    console.error('❌ Erro ao notificar aluno sobre aprovação:', error?.message || error)
  }
}

/**
 * Cria notificação para aluno quando desafio é rejeitado
 */
export async function notificarAlunoDesafioRejeitado(params: {
  alunoId: string
  desafioTitulo: string
  desafioId: string
  motivo?: string
  accessToken: string
}) {
  try {
    const supabase = await getSupabaseClient(params.accessToken)
    
    console.log(`🔔 Notificando aluno ${params.alunoId} sobre rejeição...`)

    const agora = new Date()
    const dataFim = new Date()
    dataFim.setDate(dataFim.getDate() + 7)

    const mensagem = params.motivo 
      ? `Seu desafio "${params.desafioTitulo}" foi rejeitado. Motivo: ${params.motivo}. Você pode reenviar!`
      : `Seu desafio "${params.desafioTitulo}" foi rejeitado. Revise e tente novamente!`

    const { error: insertError } = await supabase.from('notificacoes').insert({
      titulo: '❌ Desafio Rejeitado',
      mensagem,
      tipo: 'warning',
      data_inicio: agora.toISOString(),
      data_fim: dataFim.toISOString(),
      publico_alvo: 'todos',
      target_user_id: params.alunoId,
      related_desafio_id: params.desafioId,
      action_url: '/aluno/desafios',
      created_by: null
    })

    if (insertError) {
      console.error('❌ Erro ao criar notificação de rejeição:', insertError)
    } else {
      console.log(`✅ Notificação de rejeição criada para aluno ${params.alunoId}`)
    }
  } catch (error: any) {
    console.error('❌ Erro ao notificar aluno sobre rejeição:', error?.message || error)
  }
}
