'use client'

import { motion } from 'framer-motion'

export default function FixedTopbar() {
  const handleCTAClick = () => {
    // Scroll para a seção de pricing
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

