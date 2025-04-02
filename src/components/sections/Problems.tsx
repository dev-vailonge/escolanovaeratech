import { Clock, MessageSquare, Users } from 'lucide-react'

const features = [
  {
    name: 'Tempos de Resposta Lentos',
    description:
      'O atendimento manual não consegue acompanhar o volume crescente de mensagens, levando a clientes frustrados.',
    icon: Clock,
  },
  {
    name: 'Disponibilidade Limitada',
    description:
      'As equipes tradicionais não podem fornecer cobertura 24/7, perdendo oportunidades e consultas de clientes.',
    icon: MessageSquare,
  },
  {
    name: 'Serviço Inconsistente',
    description:
      'Diferentes membros da equipe fornecem respostas variadas, levando a uma experiência inconsistente para o cliente.',
    icon: Users,
  },
]

export function Problems() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Desafios Comuns</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Desafios do WhatsApp Business
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Ajudamos empresas a superar os desafios de comunicação do WhatsApp com automação alimentada por IA.
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.name}</h3>
                    <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 