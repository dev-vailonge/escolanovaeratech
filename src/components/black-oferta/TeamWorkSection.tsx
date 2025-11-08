'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function TeamWorkSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-black via-zinc-900 to-black relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Title and Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-white">Você não estará</span>{' '}
              <span className="text-yellow-400">sozinho</span>
            </h2>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Trabalhe em projetos reais, aprenda com profissionais experientes e ganhe experiência prática enquanto estuda.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Image with Overlay */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden border-2 border-yellow-400/30 shadow-2xl shadow-yellow-400/20">
                <Image
                  src="/images/task-board.png"
                  alt="Board de projetos - Trabalho em equipe"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -top-4 -right-4 bg-yellow-400 text-black font-bold px-6 py-3 rounded-full shadow-lg z-10"
              >
                <span className="text-sm md:text-base">Projetos Reais</span>
              </motion.div>
            </motion.div>

            {/* Right Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Aprenda com Profissionais Experientes
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Trabalhe ao lado de desenvolvedores experientes que vão te guiar em cada etapa do processo. Aprenda as melhores práticas da indústria enquanto desenvolve projetos reais.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Projetos Reais desde o Início
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Não fique apenas estudando teoria. Desde o primeiro dia, você estará trabalhando em projetos reais que podem ser adicionados ao seu portfólio. Ganhe experiência prática enquanto aprende.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Aumente suas Chances de Contratação
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Com experiência prática em projetos reais e um portfólio sólido, você se destaca no mercado. Empresas valorizam profissionais que já têm experiência comprovada, mesmo durante os estudos.
                  </p>
                </div>
              </motion.div>

              {/* CTA Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 p-6 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-2 border-yellow-400/30 rounded-xl"
              >
                <p className="text-white text-lg font-semibold mb-2">
                  🚀 Ganhe experiência enquanto estuda
                </p>
                <p className="text-gray-300 text-sm">
                  Junte-se a uma comunidade de desenvolvedores que trabalham juntos, aprendem juntos e crescem juntos. Seu futuro profissional começa aqui.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

