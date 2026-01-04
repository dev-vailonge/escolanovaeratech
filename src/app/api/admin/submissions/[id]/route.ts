import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { completarDesafio } from '@/lib/server/gamification'
import { notificarAlunoDesafioAprovado, notificarAlunoDesafioRejeitado } from '@/lib/server/desafioNotifications'

/**
 * PUT /api/admin/submissions/[id]
 * Aprovar ou rejeitar uma submissão de desafio
 * Body: { status: 'aprovado' | 'rejeitado', admin_notes?: string }
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticar usuário
    const adminId = await requireUserIdFromBearer(request)
    const submissionId = params.id

    if (!submissionId) {
      return NextResponse.json(
        { error: 'ID da submissão não informado' },
        { status: 400 }
      )
    }

    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      )
    }
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se é admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (adminError || admin?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { status, admin_notes } = body

    if (!status || !['aprovado', 'rejeitado'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: aprovado ou rejeitado' },
        { status: 400 }
      )
    }

    // Buscar submissão atual com dados do desafio
    const { data: submission, error: fetchError } = await supabase
      .from('desafio_submissions')
      .select(`
        id,
        user_id,
        desafio_id,
        status,
        desafios:desafio_id (
          id,
          titulo,
          xp
        )
      `)
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submissão não encontrada' },
        { status: 404 }
      )
    }

    if (submission.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Esta submissão já foi revisada' },
        { status: 400 }
      )
    }

    // Atualizar submissão
    const { data: updated, error: updateError } = await supabase
      .from('desafio_submissions')
      .update({
        status,
        admin_notes: admin_notes || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar submissão:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar submissão' },
        { status: 500 }
      )
    }

    // Se aprovado, dar XP ao aluno e notificar
    const desafio = submission.desafios as any
    let xpAwarded = 0
    
    if (status === 'aprovado') {
      try {
        const result = await completarDesafio({
          userId: submission.user_id,
          desafioId: submission.desafio_id,
          accessToken
        })
        xpAwarded = result?.xp || desafio?.xp || 0
      } catch (xpError) {
        console.error('Erro ao dar XP:', xpError)
        // Não falhar a requisição por causa do XP
      }

      // Notificar aluno sobre aprovação
      notificarAlunoDesafioAprovado({
        alunoId: submission.user_id,
        desafioTitulo: desafio?.titulo || 'Desafio',
        desafioId: submission.desafio_id,
        xpGanho: xpAwarded,
        accessToken
      }).catch(err => console.error('Erro ao notificar aluno:', err))
    } else {
      // Notificar aluno sobre rejeição
      notificarAlunoDesafioRejeitado({
        alunoId: submission.user_id,
        desafioTitulo: desafio?.titulo || 'Desafio',
        desafioId: submission.desafio_id,
        motivo: admin_notes,
        accessToken
      }).catch(err => console.error('Erro ao notificar aluno:', err))
    }

    return NextResponse.json({
      success: true,
      submission: updated,
      xpAwarded,
      message: status === 'aprovado' 
        ? `Submissão aprovada! Aluno recebeu ${xpAwarded} XP.`
        : 'Submissão rejeitada.'
    })

  } catch (error: any) {
    console.error('Erro ao atualizar submissão:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar submissão' },
      { status: 500 }
    )
  }
}

