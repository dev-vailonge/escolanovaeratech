'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

function NorteTechContent() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: searchParams.get('source') || 'norte-tech',
          course: 'norte-tech'
        }),
      })

      if (response.ok) {
        window.location.href = '/thank-you'
      } else {
        console.error('Form submission failed')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center">
              <Image
                src="/images/norte-tech-logo.png"
                alt="Norte Tech Logo"
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-6">
            Descubra seu caminho na tecnologia.
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
          Um curso introdutório para você conhecer as principais áreas de TI e decidir onde quer atuar.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-yellow-400 text-black px-8 py-4 rounded-lg text-xl font-bold hover:bg-yellow-300 transition-colors"
          >
            Garantir acesso pré-venda
          </button>
        </div>
      </section>

      {/* Por que o Norte Tech? */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Não sabe por onde começar? A gente te mostra o caminho.
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              O Norte Tech apresenta as principais áreas da tecnologia, Mobile, Web, Backend, Inteligência Artificial e Carreira com aulas rápidas e projetos práticos. Assim você descobre onde quer atuar e decide seu próximo passo com clareza.
            </p>
          </div>

          {/* Ícones */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Encontre seu caminho</h3>
              <p className="text-gray-400">Descubra qual área da tecnologia combina mais com você</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Aprenda rápido e direto ao ponto</h3>
              <p className="text-gray-400">Conteúdo objetivo e prático para acelerar seu aprendizado</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Comece do zero</h3>
              <p className="text-gray-400">Não precisa ter conhecimento técnico para começar</p>
            </div>
          </div>
        </div>
      </section>

      {/* O que você vai aprender */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              O que você vai aprender?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-zinc-900 p-6 rounded-lg shadow-lg border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-3">Mobile</h3>
              <p className="text-gray-300">Crie um app simples.</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-lg border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-3">Web</h3>
              <p className="text-gray-300">Sua primeira página web.</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-lg border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-3">Backend</h3>
              <p className="text-gray-300">Conheça o poder das APIs.</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-lg border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-3">Carreira</h3>
              <p className="text-gray-300">Como começar a trabalhar na área de tecnologia.</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-lg border border-zinc-800 md:col-span-2 lg:col-span-1">
              <h3 className="text-xl font-bold text-white mb-3">Inteligência Artificial</h3>
              <p className="text-gray-300">Experimente criar com IA.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Oferta Reforço */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Oferta especial para membros fundadores
          </h2>
          <p className="text-yellow-400 text-lg mb-12">
            Garanta seu acesso com 50% de desconto e cashback para seu próximo curso!
          </p>

          <div className="flex justify-center max-w-4xl mx-auto">
            {/* Template + Curso */}
            <div className="bg-zinc-900 border border-yellow-400 rounded-lg p-8 relative w-full max-w-md">
              {/* Mais Popular Tag */}
              <div className="absolute -top-3 right-6 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                Mais Popular
              </div>

              <h3 className="text-2xl font-bold text-white mb-6">Curso</h3>
              
              <div className="mb-6">
                <p className="text-gray-400 line-through text-lg">R$ 297</p>
                <p className="text-3xl font-bold text-white">12x R$ 13,80</p>
                <p className="text-white text-sm">ou 147 à vista</p>
              </div>

              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Curso completo</span>
                </li>
                
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Comunidade no discord</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-300">Todas as novas atualizações</span>
                </li>
              </ul>

              <button
                onClick={() => setIsFormOpen(true)}
                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
              >
                Entrar para o grupo
              </button>
            </div>
          </div>

          <p className="text-white text-sm mt-8">
            *Entre para o grupo e fique por dentro das atualizações do lançamento
          </p>
        </div>
      </section>

      {/* Course Platform Preview */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Conheça nossa plataforma
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Uma experiência de aprendizado moderna e intuitiva, projetada para acelerar sua jornada na tecnologia.
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8">
            <div className="w-full rounded-lg overflow-hidden">
              <Image
                src="/images/norte-tech-course.png"
                alt="Plataforma do curso Norte Tech"
                width={1200}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div className="bg-zinc-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">
                Esse curso é para quem?
              </h3>
              <p className="text-gray-300">
                Para quem nunca trabalhou com TI e quer descobrir a área ideal.
              </p>
            </div>

            <div className="bg-zinc-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">
                Preciso de conhecimento prévio?
              </h3>
              <p className="text-gray-300">
                Não.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-yellow-400 text-2xl font-bold">
                Nova Era Tech
              </div>
              <p className="text-gray-400 text-sm mt-2">
                © 2024 Nova Era Tech. Todos os direitos reservados.
              </p>
            </div>
            
            <div className="flex gap-6">
              <Link href="/termos" className="text-gray-400 hover:text-white transition-colors">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="text-gray-400 hover:text-white transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-yellow-400 rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Garanta seu acesso</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
              >
                Quero meu acesso e meu crédito agora!
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NorteTechPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NorteTechContent />
    </Suspense>
  )
} 