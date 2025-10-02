'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function FreeMaterialsPage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const materials = [
    {
      id: 'fiveerrors',
      title: 'E-book: 5 Erros Comuns',
      description: 'Descubra os 5 erros mais comuns que iniciantes cometem ao aprender programação e como evitá-los.',
      image: '/images/ebook-fireerrors-preview.png',
      link: '/fiveerrors',
      buttonText: 'Baixar Grátis',
      icon: (
        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'studyplan',
      title: 'Plano de Estudos Grátis',
      description: 'Tenha acesso a um plano de estudos 100% grátis para te guiar nos estudos de desenvolvimento de aplicativos.',
      image: '/images/plano-estudos.png',
      link: '/studyplan',
      buttonText: 'Acessar Grátis',
      icon: (
        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'android-aula',
      title: 'Aula: Por que Android?',
      description: 'Aprenda sobre as diferentes tecnologias para aprender desenvolvimento de apps e suas oportunidades',
      image: '/images/android-hero-img.png',
      link: null,
      buttonText: 'Assistir Aula',
      isVideo: true,
      icon: (
        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 18h6" />
        </svg>
      )
    }
  ]

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/50 backdrop-blur-sm border-b border-yellow-500/20 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-yellow-500">
            Nova Era
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-yellow-500">Materiais Gratuitos</span> para acelerar sua jornada
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Acesse nossos materiais 100% gratuitos e comece sua jornada no desenvolvimento de aplicativos hoje mesmo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Materials Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {materials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-zinc-900 border border-white/10 rounded-lg p-3 hover:border-yellow-400/50 transition-all group"
              >
                {/* Material Preview */}
                <div className="relative mb-2">
                  <div className="aspect-[3/4] rounded-md overflow-hidden bg-zinc-800">
                    <Image
                      src={material.image}
                      alt={material.title}
                      width={200}
                      height={250}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Icon overlay */}
                  <div className="absolute top-2 right-2 w-8 h-8 bg-yellow-500/20 rounded-md flex items-center justify-center backdrop-blur-sm">
                    {material.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors">
                    {material.title}
                  </h3>
                  
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {material.description}
                  </p>

                  {material.isVideo ? (
                    <button
                      onClick={() => setIsVideoOpen(true)}
                      className="inline-flex items-center bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-1.5 px-3 rounded-md transition-all group-hover:shadow-lg group-hover:shadow-yellow-500/25 text-xs"
                    >
                      {material.buttonText}
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={material.link}
                      className="inline-flex items-center bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-1.5 px-3 rounded-md transition-all group-hover:shadow-lg group-hover:shadow-yellow-500/25 text-xs"
                    >
                      {material.buttonText}
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-500/10 to-yellow-400/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para começar sua jornada?
            </h2>
            
            <p className="text-xl text-gray-300 mb-8">
              Acesse nossos materiais gratuitos e dê o primeiro passo para se tornar um desenvolvedor de aplicativos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/fiveerrors"
                className="inline-flex items-center bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 px-8 rounded-lg transition-all"
              >
                Baixar E-book
              </Link>
              
              <Link
                href="/studyplan"
                className="inline-flex items-center bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold py-3 px-8 rounded-lg transition-all"
              >
                Ver Plano de Estudos
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <Link
            href="/"
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </footer>

      {/* YouTube Video Dialog */}
      {isVideoOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-2xl p-6 max-w-4xl w-full border border-yellow-500/20 relative"
          >
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
              onClick={() => setIsVideoOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="aspect-video w-full">
              <iframe
                src="https://www.youtube.com/embed/h3b9kdRGRrY"
                title="Aula: Por que Android?"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg"
              ></iframe>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  )
}
