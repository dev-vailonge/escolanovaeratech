import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NorteTechTestRespostasData } from '@/types/database'

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
      .from('norte_tech_test_respostas')
      .select('id, respostas, resultado_ia, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar norte tech test:', error)
      return NextResponse.json(
        { error: 'Erro ao carregar respostas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      respostas: (data?.respostas as NorteTechTestRespostasData) ?? {},
      resultado_ia: data?.resultado_ia ?? null,
      updated_at: data?.updated_at ?? null,
    })
  } catch (e) {
    console.error('GET norte-tech-test/respostas:', e)
    return NextResponse.json(
      { error: 'Erro ao carregar respostas' },
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
    const { respostas } = body as { respostas: NorteTechTestRespostasData }

    if (!respostas || typeof respostas !== 'object') {
      return NextResponse.json(
        { error: 'Campo respostas inválido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('norte_tech_test_respostas')
      .upsert(
        {
          user_id: user.id,
          respostas: respostas as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select('id, updated_at')
      .single()

    if (error) {
      console.error('Erro ao salvar norte tech test:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar respostas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_at: data?.updated_at,
    })
  } catch (e) {
    console.error('PUT norte-tech-test/respostas:', e)
    return NextResponse.json(
      { error: 'Erro ao salvar respostas' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    if (body.clear_resultado) {
      const { error } = await supabase
        .from('norte_tech_test_respostas')
        .update({ resultado_ia: null, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao limpar resultado:', error)
        return NextResponse.json(
          { error: 'Erro ao limpar resultado' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (e) {
    console.error('PATCH norte-tech-test/respostas:', e)
    return NextResponse.json(
      { error: 'Erro na requisição' },
      { status: 500 }
    )
  }
}
