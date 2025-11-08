'use client'

import { motion } from 'framer-motion'

export default function GuaranteeSection() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0"
            >
              <div className="relative w-48 h-48 md:w-64 md:h-64">
                <img
                  src="/images/garantia-sete.png"
                  alt="Garantia 7 dias"
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>

            {/* Right Side - Content */}
            <div className="flex-1">
              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  Teste por <span className="text-yellow-400">7 dias</span>
                </h2>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-3xl">
                  O Risco é todo nosso, garantindo sua vaga agora, você receberá acesso a nossa plataforma para testar os cursos por 7 dias, se você não gostar, poderá pedir reembolso 100% do seu dinheiro, devolvemos sem fazer nenhuma pergunta, pois confiamos na nossa entrega.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

