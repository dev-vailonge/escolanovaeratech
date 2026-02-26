import { NextResponse } from 'next/server'
import { requireUserIdFromBearer, getAccessTokenFromBearer } from '@/lib/server/requestAuth'
import { getSupabaseClient } from '@/lib/server/getSupabaseClient'
import { getHotmartConfigByTecnologia } from '@/lib/constants/hotmart'
import { getAulasDoCurso } from '@/lib/hotmart'
import { sugerirAulasParaDesafio } from '@/lib/openai'

const BASE_URL_AULA = 'https://hotmart.com/en/club/escolanovaeratech/products'

/**
 * GET /api/desafios/[id]/aulas-sugeridas
 * Retorna aulas do curso Hotmart sugeridas pela IA para ajudar no desafio.
 * Requer autenticação; o desafio deve estar atribuído ao usuário.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserIdFromBearer(request)
    const { id: desafioId } = await params

    if (!desafioId) {
      return NextResponse.json({ error: 'ID do desafio é obrigatório' }, { status: 400 })
    }

    const accessToken = getAccessTokenFromBearer(request)
    const supabase = await getSupabaseClient(accessToken)

    // Verificar se o desafio está atribuído ao usuário
    const { data: atribuicao } = await supabase
      .from('user_desafio_atribuido')
      .select('desafio_id')
      .eq('user_id', userId)
      .eq('desafio_id', desafioId)
      .single()

    if (!atribuicao) {
      return NextResponse.json({ error: 'Desafio não encontrado' }, { status: 404 })
    }

    // Buscar desafio (titulo, descricao, tecnologia, requisitos)
    const { data: desafio, error: desafioError } = await supabase
      .from('desafios')
      .select('id, titulo, descricao, tecnologia, requisitos')
      .eq('id', desafioId)
      .single()

    if (desafioError || !desafio) {
      return NextResponse.json({ error: 'Desafio não encontrado' }, { status: 404 })
    }

    const tecnologia = desafio.tecnologia as string
    const config = getHotmartConfigByTecnologia(tecnologia)

    // 1) Tentar ler do cache (desafio_aulas_sugeridas)
    const { data: cacheRows } = await supabase
      .from('desafio_aulas_sugeridas')
      .select('aula_id, titulo, modulo_nome, relevancia, ordem')
      .eq('desafio_id', desafioId)
      .order('ordem', { ascending: true })

    if (cacheRows && cacheRows.length > 0) {
      const aulasComUrl = config
        ? cacheRows.map((row) => ({
            aulaId: row.aula_id,
            titulo: row.titulo,
            moduloNome: row.modulo_nome ?? undefined,
            relevancia: row.relevancia ?? undefined,
            url: `${BASE_URL_AULA}/${config.productId}/content/${row.aula_id}`,
          }))
        : cacheRows.map((row) => ({
            aulaId: row.aula_id,
            titulo: row.titulo,
            moduloNome: row.modulo_nome ?? undefined,
            relevancia: row.relevancia ?? undefined,
            url: undefined,
          }))
      return NextResponse.json({ aulas: aulasComUrl })
    }

    // 2) Cache vazio: buscar na Hotmart + IA, salvar no cache e retornar
    if (!config) {
      return NextResponse.json({ aulas: [] })
    }

    const todasAulas = await getAulasDoCurso(config.subdomain, config.productId)
    if (todasAulas.length === 0) {
      return NextResponse.json({ aulas: [] })
    }

    const sugeridas = await sugerirAulasParaDesafio({
      titulo: desafio.titulo ?? '',
      descricao: desafio.descricao ?? '',
      requisitos: Array.isArray(desafio.requisitos) ? desafio.requisitos : [],
      aulas: todasAulas.map((a) => ({ id: a.id, titulo: a.titulo })),
      maxSugestoes: 5,
    })

    const mapaAulas = new Map(todasAulas.map((a) => [a.id, a]))
    const aulasComUrl = sugeridas.map((s) => {
      const aula = mapaAulas.get(s.aulaId)
      const url = `${BASE_URL_AULA}/${config.productId}/content/${s.aulaId}`
      return {
        aulaId: s.aulaId,
        titulo: s.titulo,
        moduloNome: aula?.moduloNome ?? undefined,
        relevancia: s.relevancia,
        url,
      }
    })

    // Salvar no cache para próximas leituras
    if (aulasComUrl.length > 0) {
      const rows = aulasComUrl.map((a, idx) => ({
        desafio_id: desafioId,
        aula_id: a.aulaId,
        titulo: a.titulo,
        modulo_nome: a.moduloNome ?? null,
        relevancia: a.relevancia ?? null,
        ordem: idx,
      }))
      await supabase.from('desafio_aulas_sugeridas').insert(rows)
    }

    return NextResponse.json({ aulas: aulasComUrl })
  } catch (error: unknown) {
    console.error('[API desafios/[id]/aulas-sugeridas]', error)
    const message = error instanceof Error ? error.message : 'Erro ao buscar aulas sugeridas'
    return NextResponse.json({ error: message, aulas: [] }, { status: 500 })
  }
}
