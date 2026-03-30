import {
  asStringArrayJsonb,
  parseJsonbLoose,
  PayloadError,
  slugifyModuloSlug,
} from '@/lib/admin/formacaoCursosPayload'

export type ModuloCursosDesafioInsert = {
  curso_id: string
  ordem: number
  slug: string
  titulo: string
  hero_titulo: string
  resumo: string
  objetivo: string
  xp: number
  tags: unknown
  itens_pratica: unknown
  requisitos: unknown
  aulas_sugeridas: unknown
  imagem_capa_url: string | null
  imagem_detalhe_url: string | null
  url_repositorio_referencia: string | null
  metadata: unknown
  plano_estudos: unknown
}

export function buildModuloCursosDesafioInsert(
  curso_id: string,
  body: Record<string, unknown>
): ModuloCursosDesafioInsert {
  const slug = slugifyModuloSlug(String(body.slug ?? ''))

  const ordem = Math.floor(Number(body.ordem))
  if (!Number.isFinite(ordem)) {
    throw new PayloadError('ordem é obrigatória e deve ser um número')
  }

  const titulo = String(body.titulo ?? '').trim()
  const hero_titulo = String(body.hero_titulo ?? '').trim()
  const resumo = String(body.resumo ?? '').trim()
  const objetivo = String(body.objetivo ?? '').trim()

  if (!titulo) throw new PayloadError('titulo é obrigatório')
  if (!hero_titulo) throw new PayloadError('hero_titulo é obrigatório')

  const xp = Math.max(0, Math.floor(Number(body.xp ?? 0)))

  const imagem_capa_url =
    body.imagem_capa_url === undefined || body.imagem_capa_url === null
      ? null
      : String(body.imagem_capa_url).trim() || null
  const imagem_detalhe_url =
    body.imagem_detalhe_url === undefined || body.imagem_detalhe_url === null
      ? null
      : String(body.imagem_detalhe_url).trim() || null
  const url_repositorio_referencia =
    body.url_repositorio_referencia === undefined || body.url_repositorio_referencia === null
      ? null
      : String(body.url_repositorio_referencia).trim() || null

  return {
    curso_id,
    ordem,
    slug,
    titulo,
    hero_titulo,
    resumo,
    objetivo,
    xp,
    tags: asStringArrayJsonb(body.tags, []),
    itens_pratica: asStringArrayJsonb(body.itens_pratica, []),
    requisitos: asStringArrayJsonb(body.requisitos, []),
    aulas_sugeridas: parseJsonbLoose(body.aulas_sugeridas, []),
    imagem_capa_url,
    imagem_detalhe_url,
    url_repositorio_referencia,
    metadata: parseJsonbLoose(body.metadata, {}),
    plano_estudos:
      body.plano_estudos === undefined
        ? null
        : body.plano_estudos === null
          ? null
          : parseJsonbLoose(body.plano_estudos, null),
  }
}

export function buildModuloCursosDesafioPatch(body: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  if (body.slug !== undefined) patch.slug = slugifyModuloSlug(String(body.slug))
  if (body.ordem !== undefined) {
    const ordem = Math.floor(Number(body.ordem))
    if (!Number.isFinite(ordem)) throw new PayloadError('ordem inválida')
    patch.ordem = ordem
  }
  if (body.titulo !== undefined) {
    const t = String(body.titulo).trim()
    if (!t) throw new PayloadError('titulo não pode ser vazio')
    patch.titulo = t
  }
  if (body.hero_titulo !== undefined) {
    const t = String(body.hero_titulo).trim()
    if (!t) throw new PayloadError('hero_titulo não pode ser vazio')
    patch.hero_titulo = t
  }
  if (body.resumo !== undefined) patch.resumo = String(body.resumo).trim()
  if (body.objetivo !== undefined) patch.objetivo = String(body.objetivo).trim()
  if (body.xp !== undefined) patch.xp = Math.max(0, Math.floor(Number(body.xp)))

  if (body.tags !== undefined) patch.tags = asStringArrayJsonb(body.tags, [])
  if (body.itens_pratica !== undefined) patch.itens_pratica = asStringArrayJsonb(body.itens_pratica, [])
  if (body.requisitos !== undefined) patch.requisitos = asStringArrayJsonb(body.requisitos, [])

  if (body.aulas_sugeridas !== undefined) {
    patch.aulas_sugeridas = parseJsonbLoose(body.aulas_sugeridas, [])
  }
  if (body.metadata !== undefined) {
    patch.metadata = parseJsonbLoose(body.metadata, {})
  }
  if (body.plano_estudos !== undefined) {
    patch.plano_estudos =
      body.plano_estudos === null ? null : parseJsonbLoose(body.plano_estudos, null)
  }

  if (body.imagem_capa_url !== undefined) {
    patch.imagem_capa_url =
      body.imagem_capa_url === null ? null : String(body.imagem_capa_url).trim() || null
  }
  if (body.imagem_detalhe_url !== undefined) {
    patch.imagem_detalhe_url =
      body.imagem_detalhe_url === null ? null : String(body.imagem_detalhe_url).trim() || null
  }
  if (body.url_repositorio_referencia !== undefined) {
    patch.url_repositorio_referencia =
      body.url_repositorio_referencia === null
        ? null
        : String(body.url_repositorio_referencia).trim() || null
  }

  return patch
}
