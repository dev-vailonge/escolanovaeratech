import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { userHasFormacaoMatriculaRole } from '@/lib/formacao/formacaoAlunoAccess'
import { requestWantsAdminFormacaoGateSemMatricula } from '@/lib/formacao/formacaoGateAdminTest'
import type { ProjetosRealParticipanteTechArea } from '@/types/database'

const AREAS = new Set<ProjetosRealParticipanteTechArea>([
  'android',
  'ios',
  'web',
  'backend',
  'data',
])

function parseTechArea(body: unknown): ProjetosRealParticipanteTechArea | null {
  if (!body || typeof body !== 'object') return null
  const raw = (body as { tech_area?: unknown }).tech_area
  if (typeof raw !== 'string') return null
  const t = raw.trim() as ProjetosRealParticipanteTechArea
  return AREAS.has(t) ? t : null
}

/**
 * POST /api/aluno/projetos-reais/[id]/participar
 * Body: { tech_area: 'android' | 'ios' | 'web' | 'backend' | 'data' }
 * Cria ou atualiza a inscrição do aluno no projeto.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)
    const { id } = await params
    const trimmed = id?.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const tech_area = parseTechArea(body)
    if (!tech_area) {
      return NextResponse.json({ error: 'tech_area inválida' }, { status: 400 })
    }

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
            'Valide sua matrícula na Formação Android com o e-mail usado na Hotmart antes de participar do projeto.',
          code: 'FORMACAO_NAO_VALIDADA',
        },
        { status: 403 }
      )
    }

    const { data: projeto, error: pErr } = await supabase
      .from('projetos_reais')
      .select('id')
      .eq('id', trimmed)
      .eq('ativo', true)
      .maybeSingle()

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }
    if (!projeto) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const { error: upsertErr } = await supabase.from('projetos_reais_participantes').upsert(
      {
        projeto_id: trimmed,
        user_id: userId,
        tech_area,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'projeto_id,user_id' }
    )

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tech_area })
  } catch (e: unknown) {
    if ((e as Error).message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    throw e
  }
}
