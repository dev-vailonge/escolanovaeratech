import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type {
  NorteTechTestRespostasData,
  NorteTechTestAreaId,
  NorteTechTestAreaRespostasData,
} from '@/types/database'

const AREAS_VALIDAS: NorteTechTestAreaId[] = [
  'android',
  'frontend',
  'backend',
  'ios',
  'analise-dados',
]

/**
 * GET único que retorna respostas + áreas com uma única getUser(),
 * evitando "Invalid Refresh Token: Already Used" ao carregar a página.
 */
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

    const userId = user.id

    const [resMain, resAreas] = await Promise.all([
      supabase
        .from('norte_tech_test_respostas')
        .select('id, respostas, resultado_ia, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('norte_tech_test_area_respostas')
        .select('area_id, respostas, updated_at')
        .eq('user_id', userId),
    ])

    if (resMain.error) {
      console.error('Erro ao buscar norte tech test:', resMain.error)
      return NextResponse.json(
        { error: 'Erro ao carregar respostas' },
        { status: 500 }
      )
    }

    const areas: Record<string, NorteTechTestAreaRespostasData> = {}
    AREAS_VALIDAS.forEach((id) => {
      areas[id] = {}
    })
    ;(resAreas.data || []).forEach(
      (row: { area_id: string; respostas: NorteTechTestAreaRespostasData }) => {
        areas[row.area_id] = row.respostas || {}
      }
    )

    return NextResponse.json({
      respostas: (resMain.data?.respostas as NorteTechTestRespostasData) ?? {},
      resultado_ia: resMain.data?.resultado_ia ?? null,
      areas,
      updated_at: resMain.data?.updated_at ?? null,
    })
  } catch (e) {
    console.error('GET norte-tech-test/state:', e)
    return NextResponse.json(
      { error: 'Erro ao carregar dados' },
      { status: 500 }
    )
  }
}
