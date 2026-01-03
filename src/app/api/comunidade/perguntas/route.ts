import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { insertXpEntry } from '@/lib/server/gamification'
import { XP_CONSTANTS } from '@/lib/gamification/constants'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Tentar obter userId do token (opcional, para saber se curtiu)
    let currentUserId: string | null = null
    let accessToken: string | null = null
    try {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null
      currentUserId = await requireUserIdFromBearer(request).catch(() => null)
    } catch {
      // Usuário não autenticado, mas pode ver as perguntas
    }

    // Usar helper com fallback
    const supabase = await getSupabaseClient(accessToken || undefined)

    // Filtros opcionais
    const autorId = searchParams.get('autor_id')
    const categoria = searchParams.get('categoria')
    const resolvida = searchParams.get('resolvida')
    const search = searchParams.get('search')

    let query = supabase
      .from('perguntas')
      .select(`
        id,
        titulo,
        descricao,
        autor_id,
        tags,
        categoria,
        votos,
        visualizacoes,
        resolvida,
        melhor_resposta_id,
        imagem_url,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (autorId) {
      query = query.eq('autor_id', autorId)
    }

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    // Não filtrar por resolvida aqui - vamos filtrar depois baseado na contagem de respostas
    // O parâmetro 'resolvida' será usado para filtrar por "tem respostas" ou "não tem respostas"

    if (search) {
      query = query.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`)
    }

    const { data: perguntas, error } = await query

    if (error) {
      const errorDetails = {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
      console.error('Erro ao buscar perguntas:', errorDetails)
      
      // Se for erro de permissão (RLS), dar mensagem mais clara
      if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('RLS')) {
        return NextResponse.json({ 
          error: 'Erro de permissão ao buscar perguntas. ' +
            'Configure SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente da Vercel ' +
            'ou ajuste as políticas RLS no Supabase para permitir leitura pública da tabela perguntas. ' +
            `Detalhes: ${error.message}`,
          success: false,
          perguntas: []
        }, { status: 200 }) // Retornar 200 com array vazio para não quebrar a página
      }
      
      return NextResponse.json({ 
        error: 'Erro ao buscar perguntas',
        success: false,
        perguntas: []
      }, { status: 200 }) // Retornar 200 com array vazio para não quebrar a página
    }

    console.log(`[API /comunidade/perguntas] Perguntas encontradas: ${perguntas?.length || 0}`)

    // Buscar contagem de respostas para cada pergunta (apenas respostas diretas, não comentários)
    const perguntaIds = perguntas?.map((p) => p.id) || []
    const { data: respostasCount } = await supabase
      .from('respostas')
      .select('pergunta_id')
      .in('pergunta_id', perguntaIds.length > 0 ? perguntaIds : ['00000000-0000-0000-0000-000000000000'])
      .is('resposta_pai_id', null) // Apenas respostas diretas, não comentários

    const countMap = new Map<string, number>()
    respostasCount?.forEach((r) => {
      countMap.set(r.pergunta_id, (countMap.get(r.pergunta_id) || 0) + 1)
    })

    // Aplicar filtro de status baseado em contagem de respostas
    let perguntasFiltradas = perguntas || []
    if (resolvida !== null && resolvida !== undefined) {
      const temRespostas = resolvida === 'true'
      perguntasFiltradas = perguntas?.filter((p) => {
        const numRespostas = countMap.get(p.id) || 0
        return temRespostas ? numRespostas > 0 : numRespostas === 0
      }) || []
    }

    // Buscar dados dos autores
    const autorIds = [...new Set(perguntasFiltradas?.map((p) => p.autor_id) || [])]
    const { data: autores } = await supabase
      .from('users')
      .select('id, name, level, avatar_url')
      .in('id', autorIds.length > 0 ? autorIds : ['00000000-0000-0000-0000-000000000000'])

    const autorMap = new Map<string, any>()
    autores?.forEach((a) => {
      autorMap.set(a.id, {
        id: a.id,
        nome: a.name,
        nivel: a.level || 1,
        avatar: a.avatar_url,
      })
    })

    // Buscar votos do usuário atual (se autenticado)
    const perguntaIdsFiltradas = perguntasFiltradas?.map((p) => p.id) || []
    const votosMap = new Map<string, boolean>()
    if (currentUserId && perguntaIdsFiltradas.length > 0) {
      const { data: votos } = await supabase
        .from('pergunta_votos')
        .select('pergunta_id')
        .eq('user_id', currentUserId)
        .in('pergunta_id', perguntaIdsFiltradas)

      votos?.forEach((v) => {
        votosMap.set(v.pergunta_id, true)
      })
    }

    const perguntasComRespostas = perguntasFiltradas?.map((p) => ({
      ...p,
      respostas: countMap.get(p.id) || 0,
      curtida: votosMap.get(p.id) || false,
      autor: autorMap.get(p.autor_id) || {
        id: p.autor_id,
        nome: 'Usuário',
        nivel: 1,
        avatar: null,
      },
    }))

    return NextResponse.json({ success: true, perguntas: perguntasComRespostas || [] })
  } catch (error: any) {
    console.error('Erro ao buscar perguntas:', error)
    return NextResponse.json({ error: 'Erro ao buscar perguntas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log('📥 [API] Recebendo requisição para criar pergunta')
    
    const userId = await requireUserIdFromBearer(request)
    console.log('✅ [API] Usuário autenticado:', userId)
    
    // Para POST, sempre tentar usar admin primeiro (precisa de permissões de escrita)
    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch (adminError) {
      // Se não tiver service role key, usar helper com fallback
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null
      supabase = await getSupabaseClient(accessToken || undefined)
    }

    // Verificar se o usuário tem acesso full
    console.log('🔍 [API] Verificando acesso do usuário...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('access_level, role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [API] Usuário não encontrado:', userError)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    console.log('👤 [API] Dados do usuário:', { role: user.role, access_level: user.access_level })

    // Apenas alunos com acesso full ou admins podem criar perguntas
    if (user.role === 'aluno' && user.access_level !== 'full') {
      console.warn('⚠️ [API] Usuário sem acesso full tentou criar pergunta')
      return NextResponse.json(
        { error: 'Apenas alunos com acesso completo podem criar perguntas' },
        { status: 403 }
      )
    }

    console.log('📝 [API] Lendo body da requisição...')
    const body = await request.json().catch((e) => {
      console.error('❌ [API] Erro ao ler body:', e)
      return {}
    })
    
    const titulo = String(body?.titulo || '').trim()
    const descricao = String(body?.descricao || '').trim()
    const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : []
    const categoria = String(body?.categoria || '').trim() || null
    const imagemUrl = String(body?.imagem_url || '').trim() || null

    console.log('📋 [API] Dados recebidos:', { titulo, descricao, tags, categoria, imagemUrl })

    if (titulo.length < 3) {
      console.warn('⚠️ [API] Título muito curto')
      return NextResponse.json({ error: 'Título muito curto (mínimo 3 caracteres)' }, { status: 400 })
    }

    if (descricao.length < 10) {
      console.warn('⚠️ [API] Descrição muito curta')
      return NextResponse.json({ error: 'Descrição muito curta (mínimo 10 caracteres)' }, { status: 400 })
    }

    // Garantir que tags seja um array válido (não null)
    const tagsArray = Array.isArray(tags) && tags.length > 0 ? tags : []

    console.log('💾 [API] Inserindo pergunta no banco...')
    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas')
      .insert({
        titulo,
        descricao,
        autor_id: userId,
        tags: tagsArray,
        categoria: categoria || null,
        imagem_url: imagemUrl || null,
        votos: 0,
        visualizacoes: 0,
        resolvida: false,
      })
      .select('id, titulo, descricao, autor_id, tags, categoria, imagem_url, votos, visualizacoes, resolvida, created_at')
      .single()

    if (perguntaError) {
      console.error('❌ [API] Erro ao criar pergunta:', perguntaError)
      console.error('❌ [API] Detalhes do erro:', {
        message: perguntaError.message,
        details: perguntaError.details,
        hint: perguntaError.hint,
        code: perguntaError.code,
      })
      return NextResponse.json(
        { 
          error: perguntaError.message || 'Erro ao criar pergunta',
          details: perguntaError.details,
        },
        { status: 500 }
      )
    }

    console.log('✅ [API] Pergunta criada com sucesso:', pergunta?.id)
    
    // Dar 10 XP ao criar pergunta (valor oficial)
    try {
      await insertXpEntry({
        userId,
        source: 'comunidade',
        sourceId: pergunta.id,
        amount: XP_CONSTANTS.comunidade.pergunta,
        description: `Pergunta criada: ${titulo}`,
      })
      console.log(`✅ [API] ${XP_CONSTANTS.comunidade.pergunta} XP dado ao criar pergunta`)
    } catch (xpError: any) {
      console.error('❌ [API] Erro ao dar XP por pergunta:', xpError)
      // Não falhar a criação da pergunta se der erro ao dar XP
    }
    
    return NextResponse.json({ success: true, pergunta })
  } catch (error: any) {
    console.error('❌ [API] Exceção ao criar pergunta:', error)
    console.error('❌ [API] Stack:', error.stack)
    if (String(error?.message || '').includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ 
      error: error?.message || 'Erro ao criar pergunta',
      details: error?.stack 
    }, { status: 500 })
  }
}
