/** Normalização de payloads da API admin de cursos / módulos (cursos_desafios). */

export class PayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PayloadError'
  }
}

export function parseJsonbLoose(input: unknown, fallback: unknown): unknown {
  if (input === undefined) return fallback
  if (input === null) return null
  if (typeof input === 'string') {
    const t = input.trim()
    if (!t) return fallback
    try {
      return JSON.parse(t)
    } catch {
      throw new PayloadError('JSON inválido')
    }
  }
  return input
}

export function asStringArrayJsonb(input: unknown, fallback: unknown[] = []): unknown[] {
  const v = parseJsonbLoose(input, fallback)
  if (!Array.isArray(v)) return fallback
  return v
}

export function slugifyCursoSlug(raw: string): string {
  const s = raw.trim().toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
    throw new PayloadError(
      'Slug inválido: use apenas letras minúsculas, números e hífens (ex: formacao-android)'
    )
  }
  return s
}

export function slugifyModuloSlug(raw: string): string {
  const s = raw.trim().toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
    throw new PayloadError(
      'Slug do módulo inválido: use apenas letras minúsculas, números e hífens (ex: c1, 10d-challenge)'
    )
  }
  return s
}
