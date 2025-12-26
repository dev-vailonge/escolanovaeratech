import { getSupabaseAdmin } from './supabaseAdmin'

/**
 * Cria notificação para admins quando aluno submete desafio
 */
export async function notificarAdminsNovaSubmissao(params: {
  alunoNome: string
  desafioTitulo: string
  desafioId: string
  submissionId: string
}) {
  const supabase = getSupabaseAdmin()
  
  console.log('🔔 Iniciando notificação para admins...')
  
  // Buscar todos os admins
  const { data: admins, error: adminError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')

  if (adminError) {
    console.error('❌ Erro ao buscar admins:', adminError)
    return
  }

  if (!admins || admins.length === 0) {
    console.log('⚠️ Nenhum admin encontrado para notificar')
    return
  }

  console.log(`📋 Encontrados ${admins.length} admin(s) para notificar`)

  const agora = new Date()
  const dataFim = new Date()
  dataFim.setDate(dataFim.getDate() + 7)

  // Criar notificação para cada admin
  for (const admin of admins) {
    const { error: insertError } = await supabase.from('notificacoes').insert({
      titulo: '📥 Nova Submissão de Desafio',
      mensagem: `${params.alunoNome} enviou uma solução para o desafio "${params.desafioTitulo}". Revise e aprove ou rejeite.`,
      tipo: 'info',
      data_inicio: agora.toISOString(),
      data_fim: dataFim.toISOString(),
      publico_alvo: 'todos', // Será filtrado pelo target_user_id
      target_user_id: admin.id,
      related_desafio_id: params.desafioId,
      action_url: '/aluno/admin?tab=desafios',
      created_by: null
    })

    if (insertError) {
      console.error(`❌ Erro ao criar notificação para admin ${admin.id}:`, insertError)
    } else {
      console.log(`✅ Notificação criada para admin ${admin.id}`)
    }
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
}) {
  const supabase = getSupabaseAdmin()
  
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
}

/**
 * Cria notificação para aluno quando desafio é rejeitado
 */
export async function notificarAlunoDesafioRejeitado(params: {
  alunoId: string
  desafioTitulo: string
  desafioId: string
  motivo?: string
}) {
  const supabase = getSupabaseAdmin()
  
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
}
