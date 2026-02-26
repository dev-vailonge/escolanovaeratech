/**
 * Constantes e helpers para integração com Hotmart (área de membros / Club).
 * Usado para buscar módulos e aulas por curso e vincular à tecnologia do desafio.
 */

import type { CursoId } from './cursos'

/**
 * Configuração de cada curso na Hotmart (área de membros).
 * subdomain: subdomínio da área de membros (ex: formacaoandroid).
 * productId: ID do produto/curso na Hotmart.
 */
export interface HotmartCursoConfig {
  subdomain: string
  productId: string
}

/**
 * Mapeamento curso (CursoId) → config Hotmart.
 */
export const HOTMART_CURSOS: Record<NonNullable<CursoId>, HotmartCursoConfig> = {
  android: {
    subdomain: 'formacaoandroid',
    productId: '6576377',
  },
  ios: {
    subdomain: 'formacaoios',
    productId: '6578281',
  },
  backend: {
    subdomain: 'formacaobackendjs',
    productId: '6578241',
  },
  frontend: {
    subdomain: 'formacaoweb-kydagv',
    productId: '6576416',
  },
  'logica-programacao': {
    subdomain: 'logicadeprogramacao-kmwbez',
    productId: '6602740',
  },
  'analise-dados': {
    subdomain: 'formacaoanalisededados',
    productId: '6600903',
  },
  'norte-tech': {
    subdomain: 'nortetech',
    productId: '6600912',
  },
}

/**
 * Tecnologia do desafio → CursoId (curso que tem conteúdo na Hotmart).
 * Alinhado com TECNOLOGIAS_POR_CATEGORIA da página de desafios.
 */
const TECNOLOGIA_TO_CURSO: Record<string, NonNullable<CursoId>> = {
  // Frontend Web
  HTML: 'frontend',
  CSS: 'frontend',
  JavaScript: 'frontend',
  TypeScript: 'frontend',
  React: 'frontend',
  'Next.js': 'frontend',
  'Tailwind CSS': 'frontend',
  'Web Development': 'frontend',
  // Backend
  'Node.js': 'backend',
  Express: 'backend',
  'APIs REST': 'backend',
  PostgreSQL: 'backend',
  MongoDB: 'backend',
  // Mobile Android
  Kotlin: 'android',
  'Jetpack Compose': 'android',
  Android: 'android',
  // Mobile iOS
  Swift: 'ios',
  SwiftUI: 'ios',
  // Análise de Dados
  Python: 'analise-dados',
  Pandas: 'analise-dados',
  SQL: 'analise-dados',
  'Data Visualization': 'analise-dados',
  // Fundamentos → Lógica de Programação
  'Lógica de Programação': 'logica-programacao',
  Algoritmos: 'logica-programacao',
  'Estrutura de Dados': 'logica-programacao',
  Git: 'logica-programacao',
}

/**
 * Retorna a config Hotmart para um curso, ou null se não houver ou for Geral.
 */
export function getHotmartConfig(cursoId: CursoId): HotmartCursoConfig | null {
  if (!cursoId) return null
  return HOTMART_CURSOS[cursoId] ?? null
}

/**
 * Dado a tecnologia do desafio (ex: "React"), retorna o CursoId vinculado.
 * Retorna null se a tecnologia não tiver curso associado na Hotmart.
 */
export function getCursoIdByTecnologia(tecnologia: string): CursoId {
  return TECNOLOGIA_TO_CURSO[tecnologia] ?? null
}

/**
 * Dado a tecnologia do desafio, retorna a config Hotmart (subdomain + productId).
 * Retorna null se não houver curso Hotmart para essa tecnologia.
 */
export function getHotmartConfigByTecnologia(tecnologia: string): HotmartCursoConfig | null {
  const cursoId = getCursoIdByTecnologia(tecnologia)
  return getHotmartConfig(cursoId)
}
