import { NextResponse } from 'next/server'
import { getAccessTokenFromBearer, requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

export const dynamic = 'force-dynamic'

export type ConclusaoModuloListaItem = {
  id: string
  user_id: string
  github_url: string
  status: string
  created_at: string
  reviewed_at: string | null
  admin_notes: string | null
  userName: string | null
  userAvatarUrl: string | null
}

/**
 * GET /api/curso-modulos/conclusoes-lista?moduloId=uuid
 * Todas as conclusões do módulo com nome/foto do aluno (join manual em public.users — evita embed PostgREST quebrado).
 */
export async function GET(request: Request) {
  try {
    await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    const url = new URL(request.url)
    const moduloId = (url.searchParams.get('moduloId') || '').trim()
    if (!moduloId) {
      return NextResponse.json({ error: 'moduloId é obrigatório' }, { status: 400 })
    }

    const { data: conclusoes, error: cErr } = await supabase
      .from('curso_desafio_conclusoes')
      .select('id, user_id, github_url, status, created_at, reviewed_at, admin_notes')
      .eq('cursos_desafio_id', moduloId)
      .in('status', ['pendente', 'aprovado', 'rejeitado'])
      .order('created_at', { ascending: false })

    if (cErr) {
      console.error('conclusoes-lista:', cErr)
      return NextResponse.json({ error: 'Não foi possível carregar os envios' }, { status: 500 })
    }

    const rows = conclusoes ?? []
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))]

    const userMap = new Map<string, { name: string | null; avatar_url: string | null }>()
    if (userIds.length > 0) {
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .in('id', userIds)

      if (uErr) {
        console.error('conclusoes-lista users:', uErr)
        return NextResponse.json({ error: 'Não foi possível carregar dados dos alunos' }, { status: 500 })
      }
      for (const u of users ?? []) {
        userMap.set(u.id, { name: u.name ?? null, avatar_url: u.avatar_url ?? null })
      }
    }

    const conclusoesOut: ConclusaoModuloListaItem[] = rows.map((r) => {
      const u = userMap.get(r.user_id)
      return {
        id: r.id,
        user_id: r.user_id,
        github_url: r.github_url,
        status: r.status,
        created_at: r.created_at,
        reviewed_at: r.reviewed_at ?? null,
        admin_notes: r.admin_notes ?? null,
        userName: u?.name ?? null,
        userAvatarUrl: u?.avatar_url ?? null,
      }
    })

    return NextResponse.json({ conclusoes: conclusoesOut })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('conclusoes-lista:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
