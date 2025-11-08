'use client'

import { motion } from 'framer-motion'

export default function FixedTopbar() {
  const handleCTAClick = () => {
    // Scroll para a seção de pricing
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-yellow-400/30"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Texto à esquerda */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-xs sm:text-sm md:text-base uppercase tracking-wide truncate">
              5 FORMAÇÕES PELO PREÇO DE 1 - E COM 50% DE DESCONTO
            </p>
          </div>

          {/* Botão à direita */}
          <div className="flex-shrink-0">
            <button
              onClick={handleCTAClick}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg transition-all shadow-md shadow-yellow-400/30 hover:shadow-yellow-400/50 transform hover:scale-105 whitespace-nowrap"
            >
              GARANTIR OFERTA
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

