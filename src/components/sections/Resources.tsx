import { BookOpen, PlayCircle, MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'

const resources = [
  {
    name: 'Guia Rápido',
    description: 'Configure seu assistente WhatsApp com IA em minutos com nosso guia passo a passo.',
    icon: BookOpen,
    href: '#',
  },
  {
    name: 'Tutoriais em Vídeo',
    description: 'Aprenda como personalizar seu chatbot e otimizar as interações com clientes.',
    icon: PlayCircle,
    href: '#',
  },
  {
    name: 'Galeria de Modelos',
    description: 'Fluxos de conversação e modelos de resposta prontos para uso em vários setores.',
    icon: MessageSquare,
    href: '#',
  },
  {
    name: 'Comunidade',
    description: 'Junte-se a outras empresas usando automação WhatsApp com IA e compartilhe histórias de sucesso.',
    icon: Users,
    href: '#',
  },
]

export function Resources() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Recursos</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Crie Melhores Conversas
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Tudo que você precisa para criar experiências WhatsApp envolventes com IA.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <Link
                key={resource.name}
                href={resource.href}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 hover:bg-gray-50 transition-colors duration-200 rounded-lg"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <resource.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {resource.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {resource.description}
                  </p>
                </div>
                <span
                  className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 