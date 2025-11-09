'use client'

import { motion } from 'framer-motion'
import FixedTopbar from '@/components/black-oferta/FixedTopbar'
import OpportunitiesSection from '@/components/black-oferta/OpportunitiesSection'
import FormationsDetailSection from '@/components/black-oferta/FormationsDetailSection'
import GuaranteeSection from '@/components/black-oferta/GuaranteeSection'
import TestimonialsCarousel from '@/components/black-oferta/TestimonialsCarousel'
import TeamWorkSection from '@/components/black-oferta/TeamWorkSection'
import CareerTransformationSection from '@/components/black-oferta/CareerTransformationSection'
import { Spotlight } from '@/components/ui/spotlight'

export default function BlackOfertaPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Fixed Topbar */}
      <FixedTopbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 bg-black relative overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              >
                 Black {' '}
                  <span className="text-yellow-400">Nova Era</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
              >
                Essa é a <span className="border-b-2 border-yellow-400">melhor oportunidade</span> que já liberei em toda minha história aqui na internet!
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
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
                  data-cta="main"
                  className="bg-green-500 hover:bg-green-400 text-white font-bold text-lg md:text-xl px-8 md:px-12 py-4 md:py-5 rounded-full transition-all shadow-lg shadow-green-500/50 hover:shadow-green-500/70 transform hover:scale-105"
                >
                  Garantir minha vaga agora
                </button>
              </motion.div>
            </div>

            {/* Diagonal Banner Ribbons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 h-32 -mx-4 overflow-hidden z-10 relative w-screen"
            >
              {/* First Diagonal Ribbon - GRATUITO */}
              <div className="absolute bottom-12 left-0 w-full h-16 transform -skew-y-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(100,100,100,0.6) 50%, rgba(0,0,0,0.8) 100%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white font-bold text-lg tracking-[0.2em] whitespace-nowrap uppercase drop-shadow-lg">
                    ✦ BLACK FRIDAY ✦ BLACK FRIDAY ✦ BLACK FRIDAY ✦ BLACK FRIDAY ✦ BLACK FRIDAY ✦
                  </div>
                </div>
              </div>

              {/* Second Diagonal Ribbon - INSCREVA-SE */}
              <div className="absolute bottom-2 left-0 w-full h-14 transform skew-y-3"
                style={{
                  background: 'linear-gradient(45deg, rgba(100,100,100,0.6) 0%, rgba(0,0,0,0.8) 50%, rgba(100,100,100,0.6) 100%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white font-bold text-base tracking-[0.3em] whitespace-nowrap uppercase drop-shadow-lg">
                    ✦ BLACK FRIDAY ✦ BLACK FRIDAY ✦ BLACK FRIDAY ✦ BLACK FRIDAY ✦
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Opportunities Section */}
      <OpportunitiesSection />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* Formations Detail Section */}
      <FormationsDetailSection />

      {/* Team Work Section */}
      <TeamWorkSection />

      {/* Career Transformation Section */}
      <CareerTransformationSection />

      {/* Guarantee Section */}
      <GuaranteeSection />
    </main>
  )
}

