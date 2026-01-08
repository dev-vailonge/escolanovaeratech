import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'

export async function POST(request: Request) {
  try {
    // Obter userId autenticado via Bearer token
    const userId = await requireUserIdFromBearer(request)

    // Extrair token para usar no cliente
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null

    // Usar helper com fallback para anon key se necessário (sem service role key)
    const supabase = await getSupabaseClient(accessToken || undefined)

    const body = await request.json()
    const { tipo, mensagem } = body

    if (!tipo || !mensagem) {
      return NextResponse.json({ error: 'Tipo e mensagem são obrigatórios' }, { status: 400 })
    }

    if (tipo !== 'melhoria' && tipo !== 'bug') {
      return NextResponse.json({ error: 'Tipo inválido. Use "melhoria" ou "bug"' }, { status: 400 })
    }

    const mensagemLimpa = String(mensagem || '').trim()
    if (mensagemLimpa.length < 10) {
      return NextResponse.json({ error: 'Mensagem muito curta (mínimo 10 caracteres)' }, { status: 400 })
    }

    if (mensagemLimpa.length > 1000) {
      return NextResponse.json({ error: 'Mensagem muito longa (máximo 1000 caracteres)' }, { status: 400 })
    }

    // Criar notificação como sugestão/bug
    // Usar a tabela de notificações com:
    // - tipo: 'info' (ou podemos adicionar novos tipos depois)
    // - target_user_id: null (avisos gerais, mas será filtrado no admin)
    // - created_by: ID do aluno que enviou
    // - titulo: "Sugestão de Melhoria" ou "Relato de Bug"
    // - mensagem: conteúdo da sugestão/bug
    // - data_inicio e data_fim: data atual + 1 ano (para não expirar)
    const agora = new Date()
    const dataFim = new Date(agora)
    dataFim.setFullYear(dataFim.getFullYear() + 1) // Válido por 1 ano

    const titulo = tipo === 'melhoria' ? 'Sugestão de Melhoria' : 'Relato de Bug'
    const mensagemFormatada = `[${tipo === 'melhoria' ? 'SUGESTÃO' : 'BUG'}] ${mensagemLimpa}`

    // URL para redirecionar admin quando clicar na notificação
    // Vai para a aba de notificações, sub-aba "recebidas"
    const actionUrl = '/aluno/admin?tab=notificacoes&subtab=recebidas'

    // Primeiro, criar a notificação de sugestão/bug (para aparecer na sub-aba "Recebidas")
    const { data: notificacao, error: notifError } = await supabase
      .from('notificacoes')
      .insert({
        titulo,
        mensagem: mensagemFormatada,
        tipo: 'info', // Usar 'info' por enquanto
        data_inicio: agora.toISOString(),
        data_fim: dataFim.toISOString(),
        publico_alvo: 'todos',
        target_user_id: null, // Aviso geral, mas será filtrado no admin
        created_by: userId, // ID do aluno que enviou
        action_url: actionUrl, // URL para redirecionar admin
        is_sugestao_bug: true, // Marcar como sugestão/bug para filtrar na sub-aba "Recebidas"
      })
      .select('id')
      .single()

    if (notifError) {
      console.error('Erro ao criar sugestão:', notifError)
      return NextResponse.json({ error: 'Erro ao enviar sugestão' }, { status: 500 })
    }

    // Buscar todos os admins para criar notificações individuais
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('access_level', 'full')

    if (adminsError) {
      console.error('Erro ao buscar admins:', adminsError)
      // Continuar mesmo se der erro ao buscar admins
    } else if (admins && admins.length > 0) {
      // Criar notificação individual para cada admin
      const notificacoesAdmin = admins.map(admin => ({
        titulo: tipo === 'melhoria' ? '💡 Nova Sugestão de Melhoria' : '🐛 Novo Relato de Bug',
        mensagem: `Um aluno enviou uma ${tipo === 'melhoria' ? 'sugestão de melhoria' : 'relato de bug'}. Clique para ver detalhes.`,
        tipo: 'info' as const,
        data_inicio: agora.toISOString(),
        data_fim: dataFim.toISOString(),
        publico_alvo: 'todos' as const,
        target_user_id: admin.id, // Notificação individual para cada admin
        created_by: null, // Criada pelo sistema
        action_url: actionUrl, // URL para redirecionar admin
        is_sugestao_bug: false, // Não é sugestão/bug em si, é notificação sobre sugestão/bug
      }))

      const { error: notifAdminError } = await supabase
        .from('notificacoes')
        .insert(notificacoesAdmin)

      if (notifAdminError) {
        console.error('Erro ao criar notificações para admins:', notifAdminError)
        // Continuar mesmo se der erro - a sugestão já foi criada
      } else {
        console.log(`✅ Notificações criadas para ${admins.length} admin(s)`)
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: notificacao.id,
      message: 'Sugestão enviada com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao processar sugestão:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: error?.message || 'Erro ao processar sugestão' }, { status: 500 })
  }
}

