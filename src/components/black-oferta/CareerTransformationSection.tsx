'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const successStories = [
  {
    id: 'aline',
    name: 'Aline',
    previousRole: 'Roteirista',
    currentRole: 'Programadora no Itaú',
    image: '/images/aline.jpeg',
    quote: 'Estava nessa mesma página, buscando por onde começar...',
    company: 'Itaú',
    timeToJob: '9 meses'
  },
  {
    id: 'pedro',
    name: 'Pedro',
    previousRole: 'Personal Trainer',
    currentRole: 'Programador',
    image: '/images/pedro.jpeg',
    quote: 'Também estava aqui, sem saber por onde começar...',
    company: 'Shopper'
  }
]

export default function CareerTransformationSection() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 via-transparent to-yellow-400/5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Main Title - Urgency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-white">Não deixe essa página</span>{' '}
              <span className="text-yellow-400">antes de garantir sua vaga</span>
            </h2>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mt-4">
              Veja bem, pessoas que estavam na mesma situação que você hoje já estão trabalhando como programadores.
            </p>
          </motion.div>

          {/* Success Stories Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {successStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-xl p-8 border-2 border-yellow-400/30 shadow-2xl shadow-yellow-400/10 hover:shadow-yellow-400/20 transition-all hover:border-yellow-400/50">
                  {/* Before/After Badge */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                      <div className="inline-block bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold mb-2">
                        ANTES: {story.previousRole}
                      </div>
                      <div className="text-gray-400 text-sm italic">
                        "{story.quote}"
                      </div>
                    </div>
                  </div>

                  {/* Profile Image */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-yellow-400/50 overflow-hidden bg-zinc-700">
                        <Image
                          src={story.image}
                          alt={story.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback se a imagem não existir
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                      {/* Success checkmark */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black">
                        <svg
                          className="w-5 h-5 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {story.name}
                      </h3>
                      <div className="inline-block bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold mb-2">
                        AGORA: {story.currentRole}
                      </div>
                      {story.timeToJob && (
                        <div className="text-yellow-400 text-sm font-semibold mt-2">
                          ⏱️ Conseguiu emprego em {story.timeToJob}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transformation Arrow */}
                  <div className="flex items-center justify-center my-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="mx-4"
                    >
                      <svg
                        className="w-8 h-8 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </motion.div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
                  </div>

                  {/* Company Badge */}
                  {story.company && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-4 py-2 rounded-lg">
                        <svg
                          className="w-5 h-5 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span className="text-yellow-400 font-semibold">
                          {story.company}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-yellow-400/10 via-yellow-500/10 to-yellow-400/10 border-2 border-yellow-400/30 rounded-xl p-8 max-w-4xl mx-auto">
              <p className="text-white text-xl md:text-2xl font-bold mb-4">
                Assim como muitos outros...
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                A Aline que era roteirista estava nessa mesma página, buscando por onde começar e hoje é programadora no Itaú. O Pedro que era personal trainer também, assim como muitos outros que transformaram suas carreiras através da programação.
              </p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => {
                const pricingSection = document.getElementById('pricing')
                if (pricingSection) {
                  const targetPosition = pricingSection.getBoundingClientRect().top + window.pageYOffset - 100
                  const startPosition = window.pageYOffset
                  const distance = targetPosition - startPosition
                  const duration = 6000 // 6 segundos para visualizar as seções durante o scroll
                  let start: number | null = null

                  const easeInOutCubic = (t: number) => {
                    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
                  }

                  const animation = (currentTime: number) => {
                    if (start === null) start = currentTime
                    const timeElapsed = currentTime - start
                    const progress = Math.min(timeElapsed / duration, 1)
                    const ease = easeInOutCubic(progress)

                    window.scrollTo(0, startPosition + distance * ease)

                    if (timeElapsed < duration) {
                      requestAnimationFrame(animation)
                    }
                  }

                  requestAnimationFrame(animation)
                }
              }}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg md:text-xl px-12 py-5 rounded-full transition-all shadow-lg shadow-yellow-400/50 hover:shadow-yellow-400/70 transform hover:scale-105"
            >
              Garantir minha vaga agora
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

