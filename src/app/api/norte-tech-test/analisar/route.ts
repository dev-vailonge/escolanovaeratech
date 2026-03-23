import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analisarNorteTechTest } from '@/lib/openai'
import type {
  NorteTechTestRespostasData,
  NorteTechTestResultadoIA,
  NorteTechTestAreaId,
  NorteTechTestAreaRespostasData,
} from '@/types/database'

const AREAS_OBRIGATORIAS: NorteTechTestAreaId[] = [
  'android',
  'frontend',
  'backend',
  'ios',
  'analise-dados',
]

export async function POST() {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: row, error: fetchError } = await supabase
      .from('norte_tech_test_respostas')
      .select('id, respostas')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Erro ao buscar respostas para análise:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao carregar respostas' },
        { status: 500 }
      )
    }

    const respostas = (row?.respostas as NorteTechTestRespostasData) ?? {}
    const textoRespostas = JSON.stringify(respostas)
    if (textoRespostas === '{}' || textoRespostas.length < 20) {
      return NextResponse.json(
        { error: 'Preencha pelo menos algumas perguntas do teste antes de ver a sugestão.' },
        { status: 400 }
      )
    }

    const { data: areaRows, error: areaFetchError } = await supabase
      .from('norte_tech_test_area_respostas')
      .select('area_id, respostas')
      .eq('user_id', user.id)

    if (areaFetchError) {
      console.error('Erro ao buscar respostas por área:', areaFetchError)
      return NextResponse.json(
        { error: 'Erro ao carregar feedback por área.' },
        { status: 500 }
      )
    }

    const areaRespostasMap: Record<string, NorteTechTestAreaRespostasData> = {}
    ;(areaRows || []).forEach((r: { area_id: string; respostas: NorteTechTestAreaRespostasData }) => {
      areaRespostasMap[r.area_id] = r.respostas || {}
    })

    const faltando = AREAS_OBRIGATORIAS.filter((id) => {
      const data = areaRespostasMap[id]
      if (!data || typeof data !== 'object') return true
      const todosNumeros =
        typeof data.curti_praticar === 'number' &&
        typeof data.energia === 'number' &&
        typeof data.dificuldade === 'number' &&
        typeof data.confianca === 'number'
      const temMeVejo = data.me_vejo_6_meses != null
      const todosTextos =
        (data.o_que_mais_gostei ?? '').trim() !== '' &&
        (data.o_que_foi_mais_dificil ?? '').trim() !== ''
      return !(todosNumeros && temMeVejo && todosTextos)
    })

    if (faltando.length > 0) {
      const nomes: Record<string, string> = {
        android: 'Android',
        frontend: 'Web Frontend',
        backend: 'Backend',
        ios: 'iOS',
        'analise-dados': 'Análise de Dados',
      }
      return NextResponse.json(
        {
          error: `Complete o feedback de todas as áreas antes de ver a sugestão. Faltam: ${faltando.map((id) => nomes[id]).join(', ')}.`,
        },
        { status: 400 }
      )
    }

    const areaRespostas = AREAS_OBRIGATORIAS.reduce(
      (acc, id) => {
        acc[id] = areaRespostasMap[id] || {}
        return acc
      },
      {} as Record<NorteTechTestAreaId, NorteTechTestAreaRespostasData>
    )

    const resultado = await analisarNorteTechTest(
      respostas,
      areaRespostas,
      user.id,
      '/api/norte-tech-test/analisar'
    )

    if (row?.id) {
      const { error: updateError } = await supabase
        .from('norte_tech_test_respostas')
        .update({
          resultado_ia: resultado as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Erro ao salvar resultado_ia:', updateError)
        // ainda retornamos o resultado para o usuário
      }
    } else {
      const { error: insertError } = await supabase
        .from('norte_tech_test_respostas')
        .insert({
          user_id: user.id,
          respostas,
          resultado_ia: resultado as unknown as Record<string, unknown>,
        })

      if (insertError) {
        console.error('Erro ao criar registro com resultado_ia:', insertError)
      }
    }

    return NextResponse.json({
      success: true,
      resultado: resultado as NorteTechTestResultadoIA,
    })
  } catch (e) {
    console.error('POST norte-tech-test/analisar:', e)
    const message = e instanceof Error ? e.message : 'Erro ao analisar respostas'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
