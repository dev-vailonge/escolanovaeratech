import { MessageCircle, Bot, Zap } from 'lucide-react'

const steps = [
  {
    title: 'Conecte o WhatsApp',
    description: 'Vincule sua conta WhatsApp Business em minutos com nosso processo de configuração simples.',
    icon: MessageCircle,
  },
  {
    title: 'Treine sua IA',
    description: 'Personalize seu assistente de IA com o conhecimento do seu negócio e preferências de resposta.',
    icon: Bot,
  },
  {
    title: 'Automatize e Escale',
    description: 'Deixe a IA lidar com as consultas dos clientes 24/7 enquanto você se concentra em expandir seu negócio.',
    icon: Zap,
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Como Funciona</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Comece em Minutos
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Transforme seu WhatsApp em um assistente de negócios com IA em três etapas simples.
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {steps.map((step, stepIdx) => (
              <div key={step.title} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{step.title}</p>
                <p className="mt-2 ml-16 text-base text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 