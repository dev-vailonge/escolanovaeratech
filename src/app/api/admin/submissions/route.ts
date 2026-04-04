import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'

/**
 * GET /api/admin/submissions
 * Lista todas as submissões de desafios (apenas para admin)
 * Query params:
 *   - status: 'pendente' | 'aprovado' | 'rejeitado' | 'todos' (default: 'pendente')
 */
export async function GET(request: Request) {
  try {
    // Autenticar usuário
    const userId = await requireUserIdFromBearer(request)
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se é admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    // Parsear query params
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pendente'

    // Buscar submissões com dados do usuário e desafio
    let query = supabase
      .from('desafio_submissions')
      .select(`
        id,
        user_id,
        desafio_id,
        github_url,
        status,
        admin_notes,
        reviewed_by,
        reviewed_at,
        created_at,
        users:user_id (
          id,
          name,
          email,
          avatar_url,
          xp,
          level
        ),
        desafios:desafio_id (
          id,
          titulo,
          tecnologia,
          xp,
          requisitos
        )
      `)
      .order('created_at', { ascending: false })

    // Compatibilidade com status legados em inglês.
    if (status === 'pendente') {
      query = query.in('status', ['pendente', 'pending'])
    } else if (status === 'aprovado') {
      query = query.in('status', ['aprovado', 'approved'])
    } else if (status === 'rejeitado') {
      query = query.in('status', ['rejeitado', 'rejected'])
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Erro ao buscar submissões:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar submissões' },
        { status: 500 }
      )
    }

    // Buscar ranking para calcular posição de cada usuário
    const { data: rankingData } = await supabase
      .from('users')
      .select('id, xp')
      // Mesma regra do ranking geral: só exclui admin
      .neq('role', 'admin')
      .order('xp', { ascending: false })

    // Criar mapa de posições no ranking
    const rankingMap = new Map<string, number>()
    rankingData?.forEach((u, index) => {
      rankingMap.set(u.id, index + 1)
    })

    // Formatar resposta
    const formattedSubmissions = (submissions || []).map((s: any) => {
      const normalizedStatus =
        s.status === 'pending'
          ? 'pendente'
          : s.status === 'approved'
            ? 'aprovado'
            : s.status === 'rejected'
              ? 'rejeitado'
              : s.status

      return {
      id: s.id,
      user_id: s.user_id,
      desafio_id: s.desafio_id,
      github_url: s.github_url,
      status: normalizedStatus,
      admin_notes: s.admin_notes,
      reviewed_by: s.reviewed_by,
      reviewed_at: s.reviewed_at,
      created_at: s.created_at,
      user: s.users ? {
        ...s.users,
        ranking_position: rankingMap.get(s.user_id) || null
      } : null,
      desafio: s.desafios
      }
    })

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
      total: formattedSubmissions.length
    })

  } catch (error: any) {
    console.error('Erro ao listar submissões:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao listar submissões' },
      { status: 500 }
    )
  }
}

