import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plano de estudos — plano e desafios | Nova Era Tech',
  description:
    'Acompanhe seu plano de estudos da formação Android, o desafio atual e o histórico de desafios anteriores em um único painel.',
}

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
