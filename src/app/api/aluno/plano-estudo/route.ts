import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import type { DatabaseAlunoPlanoEstudo, DatabaseCursoDesafio } from '@/types/database'
import {
  buildModuloSnapshot,
  buildPlanoByDay,
  lessonsForPlanoFromCursoDesafio,
} from '@/lib/planoEstudoAluno'
import {
  cursoSlugExigeValidacaoFormacao,
  userHasFormacaoMatriculaRole,
} from '@/lib/formacao/formacaoAlunoAccess'
import { requestWantsAdminFormacaoGateSemMatricula } from '@/lib/formacao/formacaoGateAdminTest'

/**
 * POST /api/aluno/plano-estudo — cria plano a partir de um módulo (cursos_desafios)
 * Body: { curso_slug, modulo_slug, dias, replace_active?: boolean }
 */
export async function POST(request: Request) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const supabase = await getSupabaseClient(accessToken)
    const body = await request.json().catch(() => ({}))

    const curso_slug = String(body.curso_slug ?? '').trim()
    const modulo_slug = String(body.modulo_slug ?? '').trim()
    const dias = Math.floor(Number(body.dias))
    const replace_active = Boolean(body.replace_active)

    if (!curso_slug || !modulo_slug) {
      return NextResponse.json({ error: 'curso_slug e modulo_slug são obrigatórios' }, { status: 400 })
    }
    if (!Number.isFinite(dias) || dias < 1 || dias > 120) {
      return NextResponse.json({ error: 'Informe um número de dias entre 1 e 120' }, { status: 400 })
    }

    const { data: curso, error: cErr } = await supabase
      .from('cursos')
      .select('id')
      .eq('slug', curso_slug)
      .eq('ativo', true)
      .maybeSingle()

    if (cErr || !curso) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    if (cursoSlugExigeValidacaoFormacao(curso_slug)) {
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
              'Valide sua matrícula na formação com o e-mail usado na Hotmart antes de criar o plano de estudos.',
            code: 'FORMACAO_NAO_VALIDADA',
          },
          { status: 403 }
        )
      }
    }

    const { data: modulo, error: mErr } = await supabase
      .from('cursos_desafios')
      .select('*')
      .eq('curso_id', curso.id)
      .eq('slug', modulo_slug)
      .maybeSingle()

    if (mErr || !modulo) {
      return NextResponse.json({ error: 'Módulo do curso não encontrado' }, { status: 404 })
    }

    const row = modulo as DatabaseCursoDesafio
    const lessons = lessonsForPlanoFromCursoDesafio(row)
    if (lessons.length === 0) {
      return NextResponse.json(
        {
          error:
            'Este desafio não tem aulas sugeridas nem plano de estudos para montar o plano. Escolha outro módulo.',
        },
        { status: 400 }
      )
    }

    const plano = buildPlanoByDay(lessons, dias)
    const modulo_snapshot = buildModuloSnapshot(row, curso_slug)

    const { data: existing, error: exErr } = await supabase
      .from('aluno_planos_estudo')
      .select('id, modulo_snapshot')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (exErr && exErr.code !== 'PGRST116') {
      console.error('[plano-estudo POST] existing', exErr)
      return NextResponse.json({ error: exErr.message }, { status: 500 })
    }

    if (existing && !replace_active) {
      const snap = existing.modulo_snapshot as { title?: string } | null
      return NextResponse.json(
        {
          error: 'Você já possui um plano de estudos ativo.',
          code: 'ACTIVE_PLAN_EXISTS',
          active_plan_id: existing.id,
          modulo_title: snap?.title ?? null,
        },
        { status: 409 }
      )
    }

    if (existing && replace_active) {
      const { error: abErr } = await supabase
        .from('aluno_planos_estudo')
        .update({ status: 'abandoned' })
        .eq('id', existing.id)

      if (abErr) {
        console.error('[plano-estudo POST] abandon', abErr)
        return NextResponse.json({ error: abErr.message }, { status: 500 })
      }
    }

    const { data: created, error: insErr } = await supabase
      .from('aluno_planos_estudo')
      .insert({
        user_id: userId,
        cursos_desafio_id: row.id,
        status: 'active',
        dias,
        plano,
        progress: { completedDays: [] },
        modulo_snapshot,
      })
      .select('*')
      .single()

    if (insErr) {
      console.error('[plano-estudo POST]', insErr)
      if (insErr.message?.includes('does not exist') || insErr.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'Tabela aluno_planos_estudo não encontrada. Aplique a migration no Supabase (ver supabase/migrations).',
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ plan: created as DatabaseAlunoPlanoEstudo })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
