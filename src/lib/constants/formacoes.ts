// Links de CTA para formações e comercial
export const LINK_WHATSAPP_COMERCIAL = 'https://wa.me/5534984136388'

/** Cupom divulgado quando o aluno não está na lista da formação na Hotmart. */
export const CUPOM_DESCONTO_NORTE_TECH = 'NORTETECH'

/** Anexa o cupom ao link de checkout Hotmart (parâmetro comum na pay.hotmart.com). */
export function payUrlComCupomNorteTech(checkoutUrl: string): string {
  const u = checkoutUrl.trim()
  const sep = u.includes('?') ? '&' : '?'
  return `${u}${sep}couponCode=${encodeURIComponent(CUPOM_DESCONTO_NORTE_TECH)}`
}

export const LINKS_FORMACOES = {
  android: 'https://pay.hotmart.com/A102787902R?bid=1769602808367',
  web: 'https://pay.hotmart.com/U102787997Q?bid=1769602851992',
  backend: 'https://pay.hotmart.com/K102792839B?bid=1769602889517',
  ios: 'https://pay.hotmart.com/W102792939J?bid=1769602931930',
} as const

export type FormacaoKey = keyof typeof LINKS_FORMACOES

export const LABELS_FORMACOES: Record<FormacaoKey, string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  backend: 'Backend',
}

const HOTMART_SUBDOMAIN_TO_FORMACAO: Record<string, FormacaoKey> = {
  formacaoandroid: 'android',
  formacaoios: 'ios',
  formacaobackendjs: 'backend',
  'formacaoweb-kydagv': 'web',
}

/** Checkout com cupom Norte Tech a partir do subdomínio usado em `/api/formacoes/validar`. */
export function payUrlComCupomNorteTechPorSubdomainHotmart(subdomain: string): string {
  const key = HOTMART_SUBDOMAIN_TO_FORMACAO[subdomain] ?? 'android'
  return payUrlComCupomNorteTech(LINKS_FORMACOES[key])
}
