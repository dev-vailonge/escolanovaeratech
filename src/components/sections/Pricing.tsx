'use client'

import { Check } from 'lucide-react'
import { useStripeCheckout } from '@/hooks/useStripeCheckout'
import { toast } from 'sonner'
import { useState } from 'react'

const tiers = [
  {
    name: 'Startup',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID,
    priceMonthly: 29,
    description: 'Perfeito para pequenas equipes e projetos simples.',
    features: [
      'Até 10 membros da equipe',
      '5 projetos ativos',
      'Gerenciamento básico de tarefas com IA',
      'Análise de equipe',
      'Suporte por email',
    ],
  },
  {
    name: 'Business',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    priceMonthly: 99,
    description: 'Ideal para equipes em crescimento com múltiplos projetos.',
    features: [
      'Até 50 membros da equipe',
      'Projetos ilimitados',
      'Insights avançados de IA',
      'Otimização de recursos',
      'Suporte prioritário',
      'Fluxos de trabalho personalizados',
      'Controle de tempo',
    ],
  },
  {
    name: 'Enterprise',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    priceMonthly: 'Personalizado',
    description: 'Soluções personalizadas para grandes organizações.',
    features: [
      'Membros ilimitados',
      'Projetos ilimitados',
      'Modelos de IA personalizados',
      'Segurança avançada',
      'Suporte dedicado',
      'Acesso à API',
      'Integrações personalizadas',
      'Garantia de SLA',
    ],
  },
]

export function Pricing() {
  const { handleCheckout } = useStripeCheckout()
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const handlePriceClick = async (priceId: string | undefined) => {
    if (!priceId) {
      // For Enterprise plan, redirect to contact page or show contact form
      window.location.href = '/contact'
      return
    }

    try {
      setLoadingPlanId(priceId)
      await handleCheckout(priceId)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.')
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Preços</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Planos para Todos os Tamanhos de Equipe
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Comece grátis por 30 dias. Sem necessidade de cartão de crédito.
          </p>
        </div>

        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">
                    {typeof tier.priceMonthly === 'number' ? `R$${tier.priceMonthly}` : tier.priceMonthly}
                  </span>
                  {typeof tier.priceMonthly === 'number' && (
                    <span className="ml-1 text-xl font-semibold">/mês</span>
                  )}
                </p>
                <p className="mt-6 text-gray-500">{tier.description}</p>

                <ul role="list" className="mt-6 space-y-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex">
                      <Check className="flex-shrink-0 w-6 h-6 text-green-500" aria-hidden="true" />
                      <span className="ml-3 text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handlePriceClick(tier.priceId)}
                disabled={loadingPlanId === tier.priceId}
                className={`mt-8 block w-full rounded-md py-3 px-6 text-center font-medium transition-colors duration-200
                  ${tier.priceMonthly === 'Personalizado'
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    : 'bg-green-500 text-white hover:bg-green-600'} 
                  disabled:opacity-50 disabled:cursor-not-allowed border border-transparent`}
              >
                {loadingPlanId === tier.priceId
                  ? 'Processando...' 
                  : tier.priceMonthly === 'Personalizado' 
                    ? 'Contate-nos' 
                    : 'Comece agora'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 