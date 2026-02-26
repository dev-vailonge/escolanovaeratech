// Links de CTA para formações e comercial
export const LINK_WHATSAPP_COMERCIAL = 'https://wa.me/5534984136388'

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
