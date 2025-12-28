import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

/**
 * GET /api/users/sync-xp-mensal
 * Sincroniza o xp_mensal com o xp total para corrigir inconsistências
 * Útil quando há problemas de cache ou exclusões anteriores
 */
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (userId) {
      // Sincronizar um usuário específico
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, xp, xp_mensal')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      // Se xp_mensal for maior que xp total, ajustar para o xp total
      if ((user.xp_mensal || 0) > (user.xp || 0)) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ xp_mensal: user.xp })
          .eq('id', userId)

        if (updateError) {
          console.error('Erro ao sincronizar xp_mensal:', updateError)
          return NextResponse.json({ error: 'Erro ao sincronizar xp_mensal' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: `xp_mensal ajustado de ${user.xp_mensal} para ${user.xp}`,
          user: {
            id: user.id,
            name: user.name,
            xp: user.xp,
            xpMensalAnterior: user.xp_mensal,
            xpMensalNovo: user.xp,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'xp_mensal já está correto',
        user: {
          id: user.id,
          name: user.name,
          xp: user.xp,
          xpMensal: user.xp_mensal,
        },
      })
    }

    // Sincronizar todos os usuários onde xp_mensal > xp
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, xp, xp_mensal')

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    const updates: any[] = []

    for (const user of users || []) {
      // Se xp_mensal for maior que xp total, ajustar
      if ((user.xp_mensal || 0) > (user.xp || 0)) {
        updates.push({
          id: user.id,
          name: user.name,
          xp: user.xp,
          xpMensalAnterior: user.xp_mensal,
          xpMensalNovo: user.xp,
        })

        // Atualizar
        await supabase
          .from('users')
          .update({ xp_mensal: user.xp })
          .eq('id', user.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updates.length} usuário(s) sincronizado(s)`,
      updates,
    })
  } catch (error: any) {
    console.error('Erro ao sincronizar xp_mensal:', error)
    return NextResponse.json({ error: 'Erro ao sincronizar xp_mensal' }, { status: 500 })
  }
}



