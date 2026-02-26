import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { gerarDesafioComIA } from '@/lib/openai'
import { getHotmartConfigByTecnologia } from '@/lib/constants/hotmart'
import { getAulasDoCurso } from '@/lib/hotmart'
import { sugerirAulasParaDesafio } from '@/lib/openai'
import { XP_CONSTANTS } from '@/lib/gamification/constants'

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
// XP de desafios é fixo e vem das constantes oficiais
const XP_DESAFIO = XP_CONSTANTS.desafio.completo

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

    // Obter accessToken e criar cliente Supabase
    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

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
    // Lógica: Buscar desafios existentes e verificar se o usuário já completou
    // Se já completou → gerar novo | Se não completou → usar existente

    // Buscar desafios existentes com tecnologia + nível (da nossa base)
    const { data: desafiosExistentes } = await supabase
      .from('desafios')
      .select('id, gerado_por_ia, created_at')
      .eq('tecnologia', tecnologia)
      .eq('dificuldade', nivel)
      // Preferir desafios da base (não IA) primeiro, depois os mais recentes
      .order('gerado_por_ia', { ascending: true })
      .order('created_at', { ascending: false })

    let desafioFinal
    let desafioReutilizado = null

    if (desafiosExistentes && desafiosExistentes.length > 0) {
      // Verificar quais desafios o usuário já fez (completou ou finalizou tentativa)
      const desafioIds = desafiosExistentes.map(d => d.id)
      
      // Buscar submissões finalizadas do usuário para esses desafios
      // (se já foi aprovado/rejeitado/desistiu, consideramos "já fez" e não reatribuímos)
      const { data: submissoesFinalizadas } = await supabase
        .from('desafio_submissions')
        .select('desafio_id')
        .eq('user_id', userId)
        .in('desafio_id', desafioIds)
        .in('status', ['aprovado', 'rejeitado', 'desistiu'])

      const desafiosJaFezIds = new Set(submissoesFinalizadas?.map(s => s.desafio_id) || [])
      
      // Buscar também em user_desafio_progress (backup)
      const { data: progressCompletos } = await supabase
        .from('user_desafio_progress')
        .select('desafio_id')
        .eq('user_id', userId)
        .eq('completo', true)
        .in('desafio_id', desafioIds)

      progressCompletos?.forEach(p => desafiosJaFezIds.add(p.desafio_id))

      // Encontrar um desafio que o usuário ainda NÃO fez
      const desafioNaoFez = desafiosExistentes.find(d => !desafiosJaFezIds.has(d.id))

      if (desafioNaoFez) {
        // ✅ Usuário ainda não fez este desafio → reutilizar
        const { data: desafioData } = await supabase
          .from('desafios')
          .select('*')
          .eq('id', desafioNaoFez.id)
          .single()

        if (desafioData) {
          console.log(`♻️ Reutilizando desafio existente (usuário ainda não fez): ${desafioData.id}`)
          // Garantir que o payload retornado respeite o XP oficial
          // (não depender de `desafios.xp`, que pode estar divergente no banco)
          desafioFinal = { ...desafioData, xp: XP_DESAFIO }
          desafioReutilizado = desafioData
        }
      }
    }

    // Se não encontrou desafio para reutilizar (todos foram completados ou não existe nenhum)
    if (!desafioFinal) {
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
          xp: XP_DESAFIO, // XP oficial
          periodicidade: 'especial',
          prazo: null,
          requisitos: desafioGerado.requisitos,
          passos: desafioGerado.passos || [],
          curso_id: null,
          gerado_por_ia: true,
          solicitado_por: null, // Não vincula a usuário específico (desafio compartilhável)
          created_by: null
        })
        .select()
        .single()

      if (erroInsert) {
        console.error('❌ Erro ao salvar desafio:', erroInsert)
        console.error('❌ Detalhes do erro:', {
          message: erroInsert.message,
          details: erroInsert.details,
          hint: erroInsert.hint,
          code: erroInsert.code,
        })
        return NextResponse.json(
          { 
            error: 'Erro ao salvar desafio no banco de dados',
            details: erroInsert.message,
            code: erroInsert.code
          },
          { status: 500 }
        )
      }

      desafioFinal = novoDesafio

      // Popular cache de aulas sugeridas para o novo desafio (Hotmart + IA)
      try {
        const tecnologiaDesafio = tecnologia
        const config = getHotmartConfigByTecnologia(tecnologiaDesafio)
        if (config) {
          const todasAulas = await getAulasDoCurso(config.subdomain, config.productId)
          if (todasAulas.length > 0) {
            const sugeridas = await sugerirAulasParaDesafio({
              titulo: novoDesafio.titulo ?? '',
              descricao: novoDesafio.descricao ?? '',
              requisitos: Array.isArray(novoDesafio.requisitos) ? novoDesafio.requisitos : [],
              aulas: todasAulas.map((a) => ({ id: a.id, titulo: a.titulo })),
              maxSugestoes: 5,
            })
            const mapaAulas = new Map(todasAulas.map((a) => [a.id, a]))
            const admin = getSupabaseAdmin()
            const rows = sugeridas.map((s, idx) => {
              const aula = mapaAulas.get(s.aulaId)
              return {
                desafio_id: novoDesafio.id,
                aula_id: s.aulaId,
                titulo: s.titulo,
                modulo_nome: aula?.moduloNome ?? null,
                relevancia: s.relevancia ?? null,
                ordem: idx,
              }
            })
            if (rows.length > 0) {
              await supabase.from('desafio_aulas_sugeridas').insert(rows)
              console.log(`✅ Aulas sugeridas em cache para desafio ${novoDesafio.id}: ${rows.length} aulas`)
            }
          }
        }
      } catch (err) {
        console.error('⚠️ Erro ao popular aulas sugeridas (não bloqueia resposta):', err)
      }
    }

    // ====================================================
    // REGISTRAR ATRIBUIÇÃO DO DESAFIO AO USUÁRIO
    // ====================================================

    const { error: erroAtribuicao, data: atribuicaoData } = await supabase
      .from('user_desafio_atribuido')
      .upsert({
        user_id: userId,
        desafio_id: desafioFinal.id
      }, { onConflict: 'user_id,desafio_id' })
      .select()

    if (erroAtribuicao) {
      console.error('❌ Erro ao registrar atribuição:', erroAtribuicao)
      console.error('❌ Detalhes do erro de atribuição:', {
        message: erroAtribuicao.message,
        details: erroAtribuicao.details,
        hint: erroAtribuicao.hint,
        code: erroAtribuicao.code,
      })
      // Retornar erro ao invés de continuar silenciosamente
      return NextResponse.json(
        { 
          error: 'Erro ao atribuir desafio ao usuário',
          details: erroAtribuicao.message,
          code: erroAtribuicao.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Atribuição registrada com sucesso:', atribuicaoData)

    return NextResponse.json({
      success: true,
      desafio: desafioFinal,
      reutilizado: !!desafioReutilizado // Indica se foi reutilizado ou gerado novo
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
