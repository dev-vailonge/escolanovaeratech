import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { calculateLevel } from '@/lib/gamification'

/**
 * API para sincronizar o nível do usuário baseado no XP atual
 * GET /api/users/sync-level?user_id=xxx - Sincroniza um usuário específico
 * GET /api/users/sync-level - Sincroniza todos os usuários
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
        .select('id, name, xp, level')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      const correctLevel = calculateLevel(user.xp || 0)

      if (user.level !== correctLevel) {
        // Atualizar nível
        const { error: updateError } = await supabase
          .from('users')
          .update({ level: correctLevel })
          .eq('id', userId)

        if (updateError) {
          console.error('Erro ao atualizar nível:', updateError)
          return NextResponse.json({ error: 'Erro ao atualizar nível' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: `Nível atualizado de ${user.level} para ${correctLevel}`,
          user: {
            id: user.id,
            name: user.name,
            xp: user.xp,
            oldLevel: user.level,
            newLevel: correctLevel,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Nível já está correto',
        user: {
          id: user.id,
          name: user.name,
          xp: user.xp,
          level: user.level,
        },
      })
    }

    // Sincronizar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, xp, level')

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    const updates: any[] = []

    for (const user of users || []) {
      const correctLevel = calculateLevel(user.xp || 0)

      if (user.level !== correctLevel) {
        updates.push({
          id: user.id,
          name: user.name,
          xp: user.xp,
          oldLevel: user.level,
          newLevel: correctLevel,
        })

        // Atualizar nível
        await supabase
          .from('users')
          .update({ level: correctLevel })
          .eq('id', user.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updates.length} usuário(s) atualizado(s)`,
      updates,
    })
  } catch (error: any) {
    console.error('Erro ao sincronizar níveis:', error)
    return NextResponse.json({ error: 'Erro ao sincronizar níveis' }, { status: 500 })
  }
}





