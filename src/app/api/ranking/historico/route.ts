import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { calculateLevel } from '@/lib/gamification'

export async function GET(request: NextRequest) {
  try {
    await requireUserIdFromBearer(request)

    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 6

    const supabase = getSupabaseAdmin()

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
      .in('role', ['aluno', 'admin'])
      .eq('access_level', 'full')

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json({ historico: [] }, { status: 200 })
    }

    // Criar mapa de usuários para acesso rápido
    const usersMap = new Map(users?.map(u => [u.id, u]) || [])

    // Agrupar XP por mês/ano e por usuário
    const xpPorMesUsuario = new Map<string, Map<string, number>>()

    // Processar histórico de XP
    if (xpHistory && xpHistory.length > 0) {
      for (const entry of xpHistory) {
        const date = new Date(entry.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!xpPorMesUsuario.has(monthKey)) {
          xpPorMesUsuario.set(monthKey, new Map())
        }

        const usuariosDoMes = xpPorMesUsuario.get(monthKey)!
        const xpAtual = usuariosDoMes.get(entry.user_id) || 0
        usuariosDoMes.set(entry.user_id, xpAtual + entry.amount)
      }
    }

    console.log(`[API /ranking/historico] Total de entradas de XP: ${xpHistory?.length || 0}`)
    console.log(`[API /ranking/historico] Meses encontrados: ${Array.from(xpPorMesUsuario.keys()).join(', ')}`)

    // Determinar qual mês considerar como fechado
    const now = new Date()
    const day = now.getDate()
    const isMonthClosed = day >= 2 // Mês considerado fechado a partir do dia 2
    
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
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
    
    console.log(`[API /ranking/historico] Mês atual: ${currentMonthKey}, Mês fechou: ${isMonthClosed}`)
    console.log(`[API /ranking/historico] Meses ordenados após filtro: ${mesesOrdenados.join(', ')}`)
    
    mesesOrdenados = mesesOrdenados.slice(0, limit)

    for (const monthKey of mesesOrdenados) {
      const [year, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })

      // Evitar meses duplicados
      if (mesesProcessados.has(monthKey)) continue
      mesesProcessados.add(monthKey)

      const usuariosDoMes = xpPorMesUsuario.get(monthKey)!
      
      // Encontrar usuário com mais XP no mês
      let campeaoId: string | null = null
      let maxXp = 0

      for (const [userId, xp] of usuariosDoMes.entries()) {
        if (xp > maxXp) {
          maxXp = xp
          campeaoId = userId
        }
      }

      if (campeaoId && usersMap.has(campeaoId)) {
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

    console.log(`[API /ranking/historico] Retornando ${historico.length} campeões históricos`)
    
    // Validar que nenhum mês retornado é o mês atual
    const historicoValidado = historico.filter(h => h.mesKey !== currentMonthKey)
    if (historicoValidado.length !== historico.length) {
      console.warn(`[API /ranking/historico] ⚠️ Removidos ${historico.length - historicoValidado.length} itens que eram do mês atual`)
    }
    
    return NextResponse.json({
      success: true,
      historico: historicoValidado,
    })
  } catch (error: any) {
    console.error('Erro ao buscar histórico de campeões:', error)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ success: true, historico: [] }, { status: 200 })
  }
}
