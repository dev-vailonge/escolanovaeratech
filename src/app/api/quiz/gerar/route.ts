import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { gerarQuizComIA } from '@/lib/openai'
import { parseQuizText } from '@/lib/quiz/parseQuizText'
import { XP_CONSTANTS } from '@/lib/gamification/constants'

// Aumentar timeout para 60 segundos (máximo no plano Pro da Vercel)
// Hobby: 10s, Pro: 60s, Enterprise: 300s
export const maxDuration = 60

const TECNOLOGIAS_VALIDAS = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express', 'Android', 'Kotlin', 'Swift', 'Python', 'PostgreSQL', 'MongoDB', 'Tailwind CSS', 'Git', 'Algoritmos', 'Estrutura de Dados', 'Lógica de Programação', 'Web Development', 'APIs REST']
const NIVEIS_VALIDOS = ['iniciante', 'intermediario', 'avancado'] as const

const XP_QUIZ = XP_CONSTANTS.quiz.maximo // 20 XP

/**
 * POST /api/quiz/gerar
 * Gera ou retorna um quiz para (tecnologia + nível)
 * 
 * Fluxo:
 * 1. Verificar se existe quiz para (tecnologia + nível)
 * 2. Se NÃO existir: gerar via OpenAI e salvar
 * 3. Se existir: verificar se o usuário já fez esse quiz
 *    - Se já fez: gerar novo via OpenAI (novo quiz_id) e salvar, entregar esse novo
 *    - Se não fez: entregar o existente
 */
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
    // BUSCAR QUIZ EXISTENTE PARA (tecnologia + nível)
    // ====================================================
    const { data: quizzesExistentes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('tecnologia', tecnologia)
      .eq('nivel', nivel)
      .eq('disponivel', true)

    let quizFinal
    let quizReutilizado = null

    if (quizzesExistentes && quizzesExistentes.length > 0) {
      // Verificar quais quizzes o usuário já completou
      const quizIds = quizzesExistentes.map(q => q.id)
      
      const { data: progressos } = await supabase
        .from('user_quiz_progress')
        .select('quiz_id, completo')
        .eq('user_id', userId)
        .eq('completo', true)
        .in('quiz_id', quizIds)

      const quizIdsCompletos = progressos?.map(p => p.quiz_id) || []

      // Buscar um quiz que o usuário NÃO completou
      const quizIdsNaoCompletos = quizIds.filter(id => !quizIdsCompletos.includes(id))

      if (quizIdsNaoCompletos.length > 0) {
        // Usuário não completou este quiz → reutilizar
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizIdsNaoCompletos[0])
          .single()

        if (quizData) {
          quizReutilizado = quizData
          quizFinal = quizData
          console.log('♻️ Reutilizando quiz existente:', quizData.id)
        }
      }
      // Se todos foram completados, continuar para gerar novo (quizFinal continua null)
    }

    // ====================================================
    // SE NÃO ENCONTROU QUIZ PARA REUTILIZAR → GERAR NOVO
    // ====================================================
    if (!quizFinal) {
      console.log(`🤖 Gerando novo quiz com OpenAI: ${tecnologia} / ${nivel}`)
      const startTime = Date.now()
      
      try {
        // Gerar quiz com IA
        const quizGerado = await gerarQuizComIA(
          tecnologia,
          nivel,
          userId,
          '/api/quiz/gerar'
        )
        
        const generationTime = Date.now() - startTime
        console.log(`⏱️ Geração de quiz concluída em ${generationTime}ms`)

        // Parse do texto para QuizQuestion[]
        const { questions, errors } = parseQuizText(quizGerado.texto)

        if (errors.length > 0) {
          console.error('⚠️ Erros no parse do quiz:', errors)
        }

        if (questions.length === 0) {
          console.error('❌ Nenhuma pergunta parseada do quiz')
          return NextResponse.json(
            { error: 'Erro ao processar quiz gerado pela IA' },
            { status: 500 }
          )
        }

        // Gerar título e descrição do quiz
        const titulo = `Quiz de ${tecnologia} - ${nivel.charAt(0).toUpperCase() + nivel.slice(1)}`
        const descricao = `Teste seus conhecimentos em ${tecnologia} com ${questions.length} perguntas de nível ${nivel}.`

        // Salvar novo quiz no banco
        const { data: novoQuiz, error: erroInsert } = await supabase
          .from('quizzes')
          .insert({
            titulo,
            descricao,
            tecnologia,
            nivel,
            questoes: questions,
            xp: XP_QUIZ,
            disponivel: true,
            created_by: null // Quiz gerado por IA não tem autor específico
          })
          .select()
          .single()

        if (erroInsert) {
          console.error('❌ Erro ao salvar quiz:', erroInsert)
          console.error('❌ Detalhes do erro:', {
            message: erroInsert.message,
            details: erroInsert.details,
            hint: erroInsert.hint,
            code: erroInsert.code,
          })
          return NextResponse.json(
            { 
              error: 'Erro ao salvar quiz no banco de dados',
              details: erroInsert.message,
              code: erroInsert.code
            },
            { status: 500 }
          )
        }

        quizFinal = novoQuiz
        console.log('✅ Novo quiz criado:', novoQuiz.id, `(${questions.length} perguntas)`)
      } catch (generationError: any) {
        const generationTime = Date.now() - startTime
        console.error(`❌ Erro após ${generationTime}ms ao gerar quiz com IA:`, generationError)
        
        // Se foi timeout ou erro da OpenAI, retornar erro específico
        if (generationError?.message?.includes('timeout') || generationTime > 55000) {
          return NextResponse.json(
            { error: 'A geração do quiz está demorando mais que o esperado. Por favor, tente novamente.' },
            { status: 504 }
          )
        }
        
        throw generationError // Re-throw para ser capturado pelo catch principal
      }
    }

    return NextResponse.json({
      success: true,
      quiz: quizFinal,
      reutilizado: !!quizReutilizado // Indica se foi reutilizado ou gerado novo
    })

  } catch (error: any) {
    console.error('❌ Erro ao gerar quiz:', error)
    console.error('❌ Stack trace:', error?.stack)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Erro de timeout específico
    if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'A operação demorou muito. Por favor, tente novamente.' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao gerar quiz. Tente novamente.' },
      { status: 500 }
    )
  }
}

