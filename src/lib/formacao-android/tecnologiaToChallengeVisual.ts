import type { ChallengeVisual } from '@/data/formacao-android-desafios'

/** Escolhe ilustração do card a partir da tecnologia do desafio (lista de apps / desafios dinâmicos). */
export function tecnologiaToChallengeVisual(tecnologia: string): ChallengeVisual {
  const t = tecnologia.toLowerCase()
  if (t.includes('android') || t.includes('kotlin') || t.includes('jetpack')) return 'phone'
  if (t.includes('swift') || t.includes('ios')) return 'media'
  if (t.includes('react') || t.includes('next') || t.includes('vue') || t.includes('angular')) return 'wireframe'
  if (t.includes('node') || t.includes('backend') || t.includes('api')) return 'chart'
  if (t.includes('python') || t.includes('dados') || t.includes('data') || t.includes('sql')) return 'map'
  if (t.includes('javascript') || t.includes('typescript') || t.includes('web')) return 'wireframe'
  return 'crypto'
}
