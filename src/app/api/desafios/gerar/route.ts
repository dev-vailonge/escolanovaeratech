import { NextResponse } from 'next/server'
import { requireUserIdFromBearer } from '@/lib/server/requestAuth'
import { gerarDesafioComIA } from '@/lib/openai'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'

// Tecnologias organizadas por categoria (mesma lista da página de desafios)
const TECNOLOGIAS_VALIDAS = [
  // Frontend Web
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS',
  // Backend
  'Node.js', 'Express', 'APIs REST', 'PostgreSQL', 'MongoDB',
  // Mobile Android
  'Kotlin', 'Jetpack Compose', 'Android',
  // Mobile iOS
  'Swift', 'SwiftUI',
  // Análise de Dados
  'Python', 'Pandas', 'SQL', 'Data Visualization',
  // Fundamentos
  'Lógica de Programação', 'Algoritmos', 'Estrutura de Dados', 'Git',
  // Legacy (compatibilidade)
  'Web Development'
]
const NIVEIS_VALIDOS = ['iniciante', 'intermediario', 'avancado'] as const
const XP_DESAFIO = 40 // XP fixo para desafios IA

export async function POST(request: Request) {
  try {
    // Autenticar usuário
    const userId = await requireUserIdFromBearer(request)

    // Parsear body
    const body = await request.json()
    const { tecnologia, nivel } = body

    // Validar campos
    if (!tecnologia || !TECNOLOGIAS_VALIDAS.includes(tecnologia)) {
      return NextResponse.json(
        { error: `Tecnologia inválida. Use: ${TECNOLOGIAS_VALIDAS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!nivel || !NIVEIS_VALIDOS.includes(nivel)) {
      return NextResponse.json(
        { error: `Nível inválido. Use: ${NIVEIS_VALIDOS.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // ====================================================
    // REGRA: SÓ PODE GERAR SE NÃO TIVER DESAFIO ATIVO
    // ====================================================
    // "Ativo" = desafio atribuído sem submissão OU com submissão pendente

    // 1. Buscar desafios atribuídos ao usuário
    const { data: atribuicoes } = await supabase
      .from('user_desafio_atribuido')
      .select('desafio_id')
      .eq('user_id', userId)

    if (atribuicoes && atribuicoes.length > 0) {
      const desafioIds = atribuicoes.map(a => a.desafio_id)

      // 2. Buscar submissões desses desafios que estão "finalizadas" (aprovadas, rejeitadas ou desistiu)
      const { data: submissoesFinalizadas } = await supabase
        .from('desafio_submissions')
        .select('desafio_id')
        .eq('user_id', userId)
        .in('desafio_id', desafioIds)
        .in('status', ['aprovado', 'rejeitado', 'desistiu'])

      const desafiosFinalizados = submissoesFinalizadas?.map(s => s.desafio_id) || []

      // 3. Verificar se tem algum desafio "ativo" (atribuído mas não finalizado)
      const desafiosAtivos = desafioIds.filter(id => !desafiosFinalizados.includes(id))

      if (desafiosAtivos.length > 0) {
        // Verificar se tem submissão pendente
        const { data: pendentes } = await supabase
          .from('desafio_submissions')
          .select('desafio_id')
          .eq('user_id', userId)
          .in('desafio_id', desafiosAtivos)
          .eq('status', 'pendente')

        if (pendentes && pendentes.length > 0) {
          return NextResponse.json(
            { error: 'Você já tem um desafio aguardando aprovação. Aguarde a revisão do admin!' },
            { status: 400 }
          )
        }

        // Tem desafio atribuído sem submissão
        return NextResponse.json(
          { error: 'Você já tem um desafio ativo. Envie sua solução no GitHub antes de gerar outro!' },
          { status: 400 }
        )
      }
    }

    // ====================================================
    // CACHE: TENTAR REUTILIZAR DESAFIO EXISTENTE
    // ====================================================

    // Buscar IDs de desafios já atribuídos ao usuário
    const desafiosJaAtribuidos = atribuicoes?.map(a => a.desafio_id) || []

    // Buscar desafio existente que o aluno ainda não recebeu
    let query = supabase
      .from('desafios')
      .select('*')
      .eq('gerado_por_ia', true)
      .eq('tecnologia', tecnologia)
      .eq('dificuldade', nivel)
      .limit(1)

    // Excluir desafios já atribuídos
    if (desafiosJaAtribuidos.length > 0) {
      query = query.not('id', 'in', `(${desafiosJaAtribuidos.join(',')})`)
    }

    const { data: desafioExistente } = await query.maybeSingle()

    let desafioFinal

    if (desafioExistente) {
      // ✅ ECONOMIA DE TOKENS: Reutilizar desafio existente!
      console.log(`♻️ Reutilizando desafio existente: ${desafioExistente.id}`)
      desafioFinal = desafioExistente
    } else {
      // ❌ Não há desafio disponível - gerar novo com OpenAI
      console.log(`🤖 Gerando novo desafio com OpenAI: ${tecnologia} / ${nivel}`)
      
      const desafioGerado = await gerarDesafioComIA(
        tecnologia, 
        nivel as typeof NIVEIS_VALIDOS[number],
        userId, // Passar userId para rastreamento de tokens
        '/api/desafios/gerar' // Endpoint para rastreamento
      )

      // Salvar novo desafio no banco
      const { data: novoDesafio, error: erroInsert } = await supabase
        .from('desafios')
        .insert({
          titulo: desafioGerado.titulo,
          descricao: desafioGerado.descricao,
          tecnologia,
          dificuldade: nivel,
          xp: XP_DESAFIO, // XP fixo, ignora sugestão da IA
          periodicidade: 'especial',
          prazo: null,
          requisitos: desafioGerado.requisitos,
          curso_id: null,
          gerado_por_ia: true,
          solicitado_por: null, // Não vincula a usuário específico (desafio compartilhável)
          created_by: null
        })
        .select()
        .single()

      if (erroInsert) {
        console.error('Erro ao salvar desafio:', erroInsert)
        return NextResponse.json(
          { error: 'Erro ao salvar desafio no banco de dados' },
          { status: 500 }
        )
      }

      desafioFinal = novoDesafio
    }

    // ====================================================
    // REGISTRAR ATRIBUIÇÃO DO DESAFIO AO USUÁRIO
    // ====================================================

    const { error: erroAtribuicao } = await supabase
      .from('user_desafio_atribuido')
      .insert({
        user_id: userId,
        desafio_id: desafioFinal.id
      })

    if (erroAtribuicao) {
      console.error('Erro ao registrar atribuição:', erroAtribuicao)
      // Não falha a requisição por causa disso
    }

    return NextResponse.json({
      success: true,
      desafio: desafioFinal,
      reutilizado: !!desafioExistente // Indica se foi reutilizado ou gerado novo
    })

  } catch (error: any) {
    console.error('Erro ao gerar desafio:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao gerar desafio' },
      { status: 500 }
    )
  }
}
