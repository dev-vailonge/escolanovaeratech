import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { calculateLevel } from '@/lib/gamification'

/** Mês civil para o ranking (alinhado ao mural “março de 2026”, etc.) */
const RANKING_TIMEZONE = 'America/Sao_Paulo'

function monthKeyFromTimestamp(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: RANKING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const m = parts.find((p) => p.type === 'month')?.value ?? '01'
  return `${y}-${m}`
}

function currentMonthKeyRanking(): string {
  return monthKeyFromTimestamp(new Date())
}

export async function GET(request: NextRequest) {
  try {
    await requireUserIdFromBearer(request)

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined
    const supabase = await getSupabaseClient(token)

    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 6

    // Buscar histórico de XP de todos os usuários
    const { data: xpHistory, error: xpError } = await supabase
      .from('user_xp_history')
      .select('user_id, amount, created_at')
      .order('created_at', { ascending: false })

    if (xpError) {
      console.error('Erro ao buscar histórico de XP:', xpError)
      return NextResponse.json({ historico: [] }, { status: 200 })
    }

    // Buscar informações dos usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, avatar_url, xp')
      // Única regra do ranking: admins não entram
      .neq('role', 'admin')

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json({ historico: [] }, { status: 200 })
    }

    // Criar mapa de usuários para acesso rápido
    const usersMap = new Map(users?.map(u => [u.id, u]) || [])

    // Agrupar XP por mês/ano e por usuário
    const xpPorMesUsuario = new Map<string, Map<string, number>>()

    // Processar histórico de XP (mês civil America/Sao_Paulo, alinhado ao mural)
    if (xpHistory && xpHistory.length > 0) {
      for (const entry of xpHistory) {
        const monthKey = monthKeyFromTimestamp(entry.created_at)

        if (!xpPorMesUsuario.has(monthKey)) {
          xpPorMesUsuario.set(monthKey, new Map())
        }

        const usuariosDoMes = xpPorMesUsuario.get(monthKey)!
        const xpAtual = usuariosDoMes.get(entry.user_id) || 0
        usuariosDoMes.set(entry.user_id, xpAtual + (entry.amount || 0))
      }
    }

    const currentMonthKey = currentMonthKeyRanking()

    // Encontrar campeão de cada mês
    const historico: any[] = []
    const mesesProcessados = new Set<string>()

    // Ordenar meses (mais recente primeiro) e filtrar
    let mesesOrdenados = Array.from(xpPorMesUsuario.keys())
      .sort()
      .reverse()
    
    // Sempre excluir o mês atual da lista de histórico
    // Quando o mês fecha (dia >= 2), o mês anterior já está na lista (pois foi calculado antes do reset)
    // Quando o mês não fecha (dia 1), excluímos o mês atual que ainda está em andamento
    mesesOrdenados = mesesOrdenados.filter(key => key !== currentMonthKey)
    mesesOrdenados = mesesOrdenados.slice(0, limit)

    for (const monthKey of mesesOrdenados) {
      const [year, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).toLocaleDateString(
        'pt-BR',
        {
          month: 'long',
          year: 'numeric',
        }
      )

      // Evitar meses duplicados
      if (mesesProcessados.has(monthKey)) continue
      mesesProcessados.add(monthKey)

      const usuariosDoMes = xpPorMesUsuario.get(monthKey)!

      // Campeão = maior XP no mês entre alunos/formação com access full (ignora admin no topo)
      const eligible = Array.from(usuariosDoMes.entries())
        .filter(([userId]) => usersMap.has(userId))
        .sort((a, b) => b[1] - a[1])

      const top = eligible[0]
      if (top && top[1] > 0) {
        const [campeaoId, maxXp] = top
        const user = usersMap.get(campeaoId)!
        const xpTotal = user.xp || 0
        const level = calculateLevel(xpTotal)

        historico.push({
          mes: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          mesKey: monthKey,
          id: user.id,
          name: user.name,
          level,
          xpMensal: maxXp,
          avatarUrl: user.avatar_url || null,
        })
      }
    }

    const historicoValidado = historico.filter(h => h.mesKey !== currentMonthKey)

    return NextResponse.json({
      success: true,
      historico: historicoValidado,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (String(msg).includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.error('Erro ao buscar histórico de campeões:', error)
    return NextResponse.json({ success: true, historico: [] }, { status: 200 })
  }
}
