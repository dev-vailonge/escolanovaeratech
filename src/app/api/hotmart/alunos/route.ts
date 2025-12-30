/**
 * Endpoint para buscar alunos da Área de Membros da Hotmart
 * 
 * Requer:
 * - HOTMART_CLIENT_ID configurado
 * - HOTMART_CLIENT_SECRET configurado
 * - HOTMART_SUBDOMAIN configurado (nome do subdomínio da Área de Membros)
 * 
 * Uso:
 * GET /api/hotmart/alunos?pageSize=100&email=usuario@exemplo.com
 * 
 * Retorna lista de alunos da Área de Membros
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllClubUsers, type ClubUser } from '@/lib/hotmart/users'

/**
 * Converte timestamp para string de data ISO
 */
function timestampToDateString(timestamp?: number): string {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toISOString().split('T')[0]
}

/**
 * Mapeia um usuário da API Hotmart para o formato esperado pelo frontend
 */
function mapClubUserToAlunoHotmart(user: ClubUser): {
  email: string
  nome: string
  telefone: string | null
  documento: string | null
  primeiraCompra: string
  ultimaCompra: string
  totalCompras: number
  status: string
  produtos: Array<{
    id: string
    nome: string
    valor: number
    moeda: string
    dataCompra: string
    status: string
    transactionId: string
  }>
} {
  // Converter timestamps para strings de data
  const primeiraCompra = timestampToDateString(user.first_access_date || user.purchase_date)
  const ultimaCompra = timestampToDateString(user.last_access_date || user.purchase_date)

  // Determinar status baseado no status e tipo do usuário
  let statusDisplay: string = user.status || 'UNKNOWN'
  if (user.status === 'ACTIVE') {
    statusDisplay = user.type === 'BUYER' ? 'ATIVO' : user.type === 'FREE' ? 'GRATUITO' : 'ATIVO'
  } else if (user.status === 'BLOCKED' || user.status === 'BLOCKED_BY_OWNER') {
    statusDisplay = 'BLOQUEADO'
  } else if (user.status === 'OVERDUE') {
    statusDisplay = 'VENCIDO'
  }

  // Criar produto básico baseado nas informações do usuário
  // Nota: A API de usuários não retorna informações detalhadas de produtos,
  // então criamos um produto genérico baseado no tipo de usuário
  const produtos = []
  
  if (user.type === 'BUYER' && user.purchase_date) {
    produtos.push({
      id: user.user_id || 'unknown',
      nome: 'Área de Membros',
      valor: 0, // A API de usuários não retorna valor
      moeda: 'BRL',
      dataCompra: timestampToDateString(user.purchase_date),
      status: statusDisplay,
      transactionId: user.user_id || '',
    })
  }

  return {
    email: user.email || '',
    nome: user.name || 'Aluno sem nome',
    telefone: null, // A API de usuários não retorna telefone
    documento: null, // A API de usuários não retorna documento
    primeiraCompra: primeiraCompra,
    ultimaCompra: ultimaCompra,
    totalCompras: user.type === 'BUYER' ? 1 : 0,
    status: statusDisplay,
    produtos: produtos,
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se credenciais estão configuradas
    const CLIENT_ID = process.env.HOTMART_CLIENT_ID
    const CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET
    const SUBDOMAIN = process.env.HOTMART_SUBDOMAIN

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciais da Hotmart não configuradas. Configure HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET no .env.local',
        },
        { status: 400 }
      )
    }

    if (!SUBDOMAIN || SUBDOMAIN.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Subdomínio da Área de Membros não configurado. Configure HOTMART_SUBDOMAIN no .env.local',
        },
        { status: 400 }
      )
    }

    // Obter parâmetros da query string
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email') || undefined

    // Coletar todos os alunos paginados
    const allUsers: ClubUser[] = []
    
    const { totalProcessed: totalAlunos, hostUsed } = await fetchAllClubUsers(
      {
        subdomain: SUBDOMAIN.trim(),
        email: email,
      },
      async (items) => {
        allUsers.push(...items)
      }
    )

    console.log(`📦 Total: ${totalAlunos} alunos | Host: ${hostUsed}`)

    if (allUsers.length === 0) {
      // Verificar se foi erro de permissão
      return NextResponse.json({
        success: false,
        alunos: [],
        total: 0,
        message: 'Nenhum aluno encontrado. Isso pode indicar que a aplicação não tem permissão para acessar a Club API da Hotmart. Verifique se a aplicação tem permissão para "Club API" no painel de desenvolvedores da Hotmart (https://developers.hotmart.com).',
        error: 'PERMISSION_DENIED',
      })
    }

    // Mapear usuários para o formato esperado pelo frontend
    const alunos = allUsers.map(mapClubUserToAlunoHotmart)

    // Ordenar por última compra (mais recente primeiro)
    alunos.sort((a, b) => {
      if (!a.ultimaCompra) return 1
      if (!b.ultimaCompra) return -1
      return new Date(b.ultimaCompra).getTime() - new Date(a.ultimaCompra).getTime()
    })

    console.log(`✅ ${alunos.length} alunos mapeados | Host: ${hostUsed}`)

    return NextResponse.json({
      success: true,
      alunos: alunos,
      total: alunos.length,
      totalStudents: alunos.length,
      students: alunos, // Compatibilidade com código antigo
      metadata: {
        totalAlunos: totalAlunos,
        hostUsed: hostUsed || 'desconhecido',
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar alunos da Hotmart:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao buscar alunos da Hotmart',
        error: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

