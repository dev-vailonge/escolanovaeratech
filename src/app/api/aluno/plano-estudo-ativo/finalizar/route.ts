import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import {
  createUserScopedSupabaseClient,
  getSupabaseClient,
} from '@/lib/server/getSupabaseClient'
import type { DatabaseAlunoPlanoEstudo, DatabaseCursoDesafio } from '@/types/database'
import { isPlanFullyCompleted, normalizeProgress } from '@/lib/planoEstudoAluno'
import { validateGitHubRepo } from '@/lib/github'
import { upsertCursoDesafioConclusaoFromPlanoFinalize } from '@/lib/server/cursoDesafioConclusaoFromPlano'
import { insertXpEntry, userAlreadyHasBonificacaoXpForCursoDesafioModule } from '@/lib/server/gamification'
import { XP_CONSTANTS } from '@/lib/gamification/constants'
import {
  cursoSlugExigeValidacaoFormacao,
  userHasFormacaoMatriculaRole,
} from '@/lib/formacao/formacaoAlunoAccess'
import { requestWantsAdminFormacaoGateSemMatricula } from '@/lib/formacao/formacaoGateAdminTest'

/**
 * POST /api/aluno/plano-estudo-ativo/finalizar
 * Body: { github_url: string }
 * Exige plano ativo, todos os dias concluídos, sem URL ainda; valida GitHub, credita XP e marca plano completed.
 */
export async function POST(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const supabase =
      createUserScopedSupabaseClient(accessToken) ?? (await getSupabaseClient(accessToken))

    const body = await request.json().catch(() => ({}))
    const github_url = typeof body.github_url === 'string' ? body.github_url.trim() : ''
    if (!github_url) {
      return NextResponse.json({ error: 'Informe a URL do repositório no GitHub' }, { status: 400 })
    }

    const validation = await validateGitHubRepo(github_url)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error ?? 'URL inválida' }, { status: 400 })
    }
    const normalizedUrl = validation.repoInfo?.fullUrl ?? github_url

    const { data: active, error: findErr } = await supabase
      .from('aluno_planos_estudo')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (findErr) {
      console.error('[plano finalizar find]', findErr)
      return NextResponse.json({ error: findErr.message }, { status: 500 })
    }

    const row = active as (DatabaseAlunoPlanoEstudo & { github_repo_url?: string | null }) | null
    if (!row) {
      return NextResponse.json({ error: 'Nenhum plano de estudos ativo' }, { status: 404 })
    }

    const existingUrl =
      typeof row.github_repo_url === 'string' ? row.github_repo_url.trim() : ''
    if (existingUrl.length > 0) {
      return NextResponse.json(
        {
          success: true,
          already_finalized: true,
          xp_awarded: 0,
          plan: row,
          message: 'Plano já foi finalizado com repositório.',
        },
        { status: 200 }
      )
    }

    const progress = normalizeProgress(row.progress)
    if (!isPlanFullyCompleted(row.dias, progress)) {
      return NextResponse.json(
        { error: 'Conclua todos os dias do plano antes de enviar o repositório.' },
        { status: 400 }
      )
    }

    const { data: modulo, error: modErr } = await supabase
      .from('cursos_desafios')
      .select('id, xp, titulo, curso_id')
      .eq('id', row.cursos_desafio_id)
      .maybeSingle()

    if (modErr || !modulo) {
      console.error('[plano finalizar modulo]', modErr)
      return NextResponse.json({ error: 'Módulo do plano não encontrado' }, { status: 500 })
    }

    const cursoRow = modulo as Pick<DatabaseCursoDesafio, 'id' | 'xp' | 'titulo' | 'curso_id'>

    let cursoSlug: string | null = null
    if (cursoRow.curso_id) {
      const { data: cursoMeta } = await supabase
        .from('cursos')
        .select('slug')
        .eq('id', cursoRow.curso_id)
        .maybeSingle()
      cursoSlug = cursoMeta?.slug ?? null
    }
    if (cursoSlugExigeValidacaoFormacao(cursoSlug)) {
      const { data: profile, error: roleErr } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      const pretendSemMatricula = requestWantsAdminFormacaoGateSemMatricula(request, profile?.role)
      if (
        roleErr ||
        !userHasFormacaoMatriculaRole(profile?.role, { adminPretendSemMatricula: pretendSemMatricula })
      ) {
        return NextResponse.json(
          {
            error:
              'Valide sua matrícula na formação (e-mail da Hotmart) antes de concluir o envio deste desafio.',
            code: 'FORMACAO_NAO_VALIDADA',
          },
          { status: 403 }
        )
      }
    }

    let xpAwarded = 0
    let conclusaoId: string | null = null

    const sub = await upsertCursoDesafioConclusaoFromPlanoFinalize({
      supabase,
      userId,
      cursosDesafioId: cursoRow.id,
      githubUrl: normalizedUrl,
    })
    conclusaoId = sub?.id ?? null

    // XP uma vez por módulo (mesmo desafio), não por plano — evita refazer o plano só por pontos.
    const xpAlreadyClaimedForModule = await userAlreadyHasBonificacaoXpForCursoDesafioModule({
      supabase,
      userId,
      cursosDesafioId: cursoRow.id,
    })

    if (!xpAlreadyClaimedForModule) {
      const amount =
        typeof cursoRow.xp === 'number' && cursoRow.xp > 0
          ? cursoRow.xp
          : XP_CONSTANTS.desafio.completo
      const titulo = cursoRow.titulo?.trim() || 'Formação'
      await insertXpEntry({
        userId,
        source: 'bonificacao',
        sourceId: cursoRow.id,
        amount,
        description: `Plano concluído: ${titulo}`,
        accessToken,
      })
      xpAwarded = amount
    }

    const { data: updated, error: upErr } = await supabase
      .from('aluno_planos_estudo')
      .update({
        github_repo_url: normalizedUrl,
        status: 'completed',
      })
      .eq('id', row.id)
      .select('*')
      .single()

    if (upErr) {
      console.error('[plano finalizar update]', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      xp_awarded: xpAwarded,
      /** Já havia XP de bonificação deste módulo — envio registrado, sem novos pontos */
      xp_already_claimed: xpAlreadyClaimedForModule,
      curso_desafio_conclusao_id: conclusaoId,
      plan: updated as DatabaseAlunoPlanoEstudo,
      message: 'Plano e desafio concluídos com sucesso!',
    })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('[plano finalizar]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao finalizar plano' },
      { status: 500 }
    )
  }
}
