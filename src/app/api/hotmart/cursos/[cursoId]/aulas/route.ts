import { NextResponse } from 'next/server'
import { getHotmartConfig } from '@/lib/constants/hotmart'
import { getAulasDoCurso } from '@/lib/hotmart'
import type { CursoId } from '@/lib/constants/cursos'

const CURSOS_VALIDOS: CursoId[] = [
  'android', 'frontend', 'backend', 'ios', 'analise-dados', 'norte-tech', 'logica-programacao',
]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cursoId: string }> }
) {
  try {
    const { cursoId } = await params
    if (!cursoId || !CURSOS_VALIDOS.includes(cursoId as CursoId)) {
      return NextResponse.json(
        { error: 'Curso inválido' },
        { status: 400 }
      )
    }

    const config = getHotmartConfig(cursoId as CursoId)
    if (!config) {
      return NextResponse.json(
        { error: 'Curso sem configuração Hotmart' },
        { status: 404 }
      )
    }

    const aulas = await getAulasDoCurso(config.subdomain, config.productId)
    return NextResponse.json({ aulas })
  } catch (error: unknown) {
    console.error('[API hotmart/cursos/[cursoId]/aulas]', error)
    const message = error instanceof Error ? error.message : 'Erro ao buscar aulas'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
