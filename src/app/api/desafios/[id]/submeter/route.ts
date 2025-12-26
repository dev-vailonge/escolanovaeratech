import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { validateGitHubRepo } from '@/lib/github'
import { notificarAdminsNovaSubmissao } from '@/lib/server/desafioNotifications'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticar usuário
    const userId = await requireUserIdFromBearer(request)
    const desafioId = params.id

    if (!desafioId) {
      return NextResponse.json(
        { error: 'ID do desafio não informado' },
        { status: 400 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { github_url } = body

    if (!github_url) {
      return NextResponse.json(
        { error: 'URL do GitHub não informada' },
        { status: 400 }
      )
    }

    // Validar URL do GitHub
    const validation = await validateGitHubRepo(github_url)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se o desafio existe
    const { data: desafio, error: desafioError } = await supabase
      .from('desafios')
      .select('id, titulo, xp')
      .eq('id', desafioId)
      .single()

    if (desafioError || !desafio) {
      return NextResponse.json(
        { error: 'Desafio não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe uma submissão pendente ou aprovada
    const { data: existingSubmission } = await supabase
      .from('desafio_submissions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('desafio_id', desafioId)
      .single()

    if (existingSubmission) {
      if (existingSubmission.status === 'aprovado') {
        return NextResponse.json(
          { error: 'Você já completou este desafio' },
          { status: 400 }
        )
      }
      
      // Se está pendente ou foi rejeitado, permitir atualização do link
      const isEditing = existingSubmission.status === 'pendente'
      
      const { data: updated, error: updateError } = await supabase
        .from('desafio_submissions')
        .update({
          github_url: validation.repoInfo?.fullUrl || github_url,
          status: 'pendente',
          // Se era rejeitado, limpar notas do admin. Se só editando (pendente), manter como está
          ...(existingSubmission.status === 'rejeitado' && {
            admin_notes: null,
            reviewed_by: null,
            reviewed_at: null
          })
        })
        .eq('id', existingSubmission.id)
        .select()
        .single()

      if (updateError) {
        console.error('Erro ao atualizar submissão:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar submissão' },
          { status: 500 }
        )
      }

      // Notificar admins sobre edição/reenvio
      const { data: aluno } = await supabase.from('users').select('name').eq('id', userId).single()
      notificarAdminsNovaSubmissao({
        alunoNome: aluno?.name || 'Aluno',
        desafioTitulo: desafio.titulo,
        desafioId: desafio.id,
        submissionId: updated.id
      }).catch(err => console.error('Erro ao notificar admins:', err))

      return NextResponse.json({
        success: true,
        submission: updated,
        message: isEditing 
          ? 'Link atualizado com sucesso!' 
          : 'Submissão reenviada com sucesso! Aguarde a revisão do admin.'
      })
    }

    // Criar nova submissão
    const { data: submission, error: insertError } = await supabase
      .from('desafio_submissions')
      .insert({
        user_id: userId,
        desafio_id: desafioId,
        github_url: validation.repoInfo?.fullUrl || github_url,
        status: 'pendente'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar submissão:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar submissão' },
        { status: 500 }
      )
    }

    // Notificar admins sobre nova submissão
    const { data: aluno } = await supabase.from('users').select('name').eq('id', userId).single()
    notificarAdminsNovaSubmissao({
      alunoNome: aluno?.name || 'Aluno',
      desafioTitulo: desafio.titulo,
      desafioId: desafio.id,
      submissionId: submission.id
    }).catch(err => console.error('Erro ao notificar admins:', err))

    return NextResponse.json({
      success: true,
      submission,
      message: 'Submissão enviada com sucesso! Aguarde a revisão do admin.'
    })

  } catch (error: any) {
    console.error('Erro ao submeter desafio:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao submeter desafio' },
      { status: 500 }
    )
  }
}

