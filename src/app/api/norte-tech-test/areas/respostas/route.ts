import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NorteTechTestAreaId, NorteTechTestAreaRespostasData } from '@/types/database'

const AREAS_VALIDAS: NorteTechTestAreaId[] = [
  'android',
  'frontend',
  'backend',
  'ios',
  'analise-dados',
]

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('norte_tech_test_area_respostas')
      .select('area_id, respostas, updated_at')
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao buscar respostas por área:', error)
      return NextResponse.json(
        { error: 'Erro ao carregar respostas por área' },
        { status: 500 }
      )
    }

    const areas: Record<string, NorteTechTestAreaRespostasData> = {}
    AREAS_VALIDAS.forEach((id) => {
      areas[id] = {}
    })
    ;(data || []).forEach((row: { area_id: string; respostas: NorteTechTestAreaRespostasData }) => {
      areas[row.area_id] = row.respostas || {}
    })

    return NextResponse.json({ areas })
  } catch (e) {
    console.error('GET norte-tech-test/areas/respostas:', e)
    return NextResponse.json(
      { error: 'Erro ao carregar respostas por área' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { area_id, respostas } = body as {
      area_id: string
      respostas: NorteTechTestAreaRespostasData
    }

    if (!area_id || !AREAS_VALIDAS.includes(area_id as NorteTechTestAreaId)) {
      return NextResponse.json(
        { error: 'area_id inválido. Use: android, frontend, backend, ios, analise-dados' },
        { status: 400 }
      )
    }

    if (!respostas || typeof respostas !== 'object') {
      return NextResponse.json(
        { error: 'Campo respostas inválido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('norte_tech_test_area_respostas')
      .upsert(
        {
          user_id: user.id,
          area_id,
          respostas: respostas as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,area_id' }
      )

    if (error) {
      console.error('Erro ao salvar resposta por área:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PUT norte-tech-test/areas/respostas:', e)
    return NextResponse.json(
      { error: 'Erro ao salvar' },
      { status: 500 }
    )
  }
}
