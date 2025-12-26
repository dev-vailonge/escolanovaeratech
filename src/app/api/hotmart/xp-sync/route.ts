/**
 * Endpoint para sincronizar pontos da Hotmart Club
 * 
 * Este endpoint permite sincronizar os pontos ganhos na Hotmart Club
 * com o sistema de XP do portal. Pode ser chamado:
 * - Manualmente (pelo admin)
 * - Via webhook (quando implementado)
 * - Via cron job (sincronização periódica)
 * 
 * POST /api/hotmart/xp-sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { syncHotmartXp, calculateHotmartXpFromClubUser } from '@/lib/hotmart/xp-sync'
import { listClubUsers } from '@/lib/hotmart/users'
import { getUserByEmail } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    // Requer autenticação (pode ser admin ou o próprio usuário)
    const userId = await requireUserIdFromBearer(request)
    
    const body = await request.json().catch(() => ({}))
    
    // Opção 1: Sincronizar um usuário específico (via email ou userId)
    if (body.userId || body.email) {
      let targetUserId = body.userId
      
      // Se foi passado email, buscar userId
      if (!targetUserId && body.email) {
        const user = await getUserByEmail(body.email)
        if (!user) {
          return NextResponse.json(
            { error: 'Usuário não encontrado' },
            { status: 404 }
          )
        }
        targetUserId = user.id
      }

      // Buscar dados do usuário na Hotmart Club
      // TODO: Quando a API estiver funcionando, usar listClubUsers com email
      // Por enquanto, retornar erro informativo
      const subdomain = process.env.HOTMART_SUBDOMAIN || 'escolanovaeratech'
      
      try {
        const clubUsersResponse = await listClubUsers({
          subdomain,
          email: body.email || undefined,
        })

        if (clubUsersResponse.items.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Usuário não encontrado na Hotmart Club',
              message: 'O usuário não foi encontrado na Área de Membros da Hotmart. Isso pode acontecer se: a API ainda não está funcionando, o usuário não tem acesso, ou o email não corresponde.',
            },
            { status: 404 }
          )
        }

        const clubUser = clubUsersResponse.items[0]
        const xpData = calculateHotmartXpFromClubUser(clubUser)
        
        // Sincronizar pontos
        const result = await syncHotmartXp({
          ...xpData,
          userId: targetUserId,
        })

        return NextResponse.json({
          success: result.success,
          result,
          message: result.success
            ? `Sincronização concluída: ${result.xpAwarded} XP adicionados`
            : `Sincronização concluída com erros: ${result.errors.join(', ')}`,
        })
      } catch (apiError: any) {
        // Se a API ainda não está funcionando, retornar mensagem informativa
        if (apiError.message?.includes('403') || apiError.message?.includes('Forbidden')) {
          return NextResponse.json(
            {
              success: false,
              error: 'API da Hotmart Club ainda não está disponível',
              message: 'A API da Hotmart Club retornou erro 403. Verifique as permissões no painel da Hotmart. Quando a API estiver funcionando, a sincronização será automática.',
            },
            { status: 503 }
          )
        }
        throw apiError
      }
    }

    // Opção 2: Sincronizar todos os usuários (futuro - para cron jobs)
    // Por enquanto, não implementado por questões de performance
    return NextResponse.json(
      { error: 'Sincronização em massa não implementada. Use userId ou email para sincronizar um usuário específico.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Erro ao sincronizar XP da Hotmart:', error)
    
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: 'Erro ao sincronizar pontos da Hotmart',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint para verificar status da sincronização
 */
export async function GET(request: NextRequest) {
  try {
    await requireUserIdFromBearer(request)
    
    return NextResponse.json({
      success: true,
      message: 'Endpoint de sincronização de XP da Hotmart Club',
      usage: {
        method: 'POST',
        body: {
          userId: 'string (opcional)',
          email: 'string (opcional)',
        },
        description: 'Sincroniza pontos da Hotmart Club para o usuário especificado',
      },
      status: {
        apiAvailable: 'pending', // TODO: Verificar quando API estiver funcionando
        lastSync: null, // TODO: Implementar quando tabela hotmart_xp_sync estiver criada
      },
    })
  } catch (error: any) {
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}

