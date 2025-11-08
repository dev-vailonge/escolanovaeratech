'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import FixedTopbar from '@/components/black-oferta/FixedTopbar'
import OpportunitiesSection from '@/components/black-oferta/OpportunitiesSection'
import FormationsDetailSection from '@/components/black-oferta/FormationsDetailSection'
import GuaranteeSection from '@/components/black-oferta/GuaranteeSection'
import TestimonialsCarousel from '@/components/black-oferta/TestimonialsCarousel'
import TeamWorkSection from '@/components/black-oferta/TeamWorkSection'
import CareerTransformationSection from '@/components/black-oferta/CareerTransformationSection'
import { Spotlight } from '@/components/ui/spotlight'

// Direct Spline import with proper error handling
const SplineScene = dynamic(
  () => 
    import('@splinetool/react-spline/next')
      .then((mod) => {
        const Spline = mod.default || mod
        return Spline
      })
      .catch(() => {
        // Fallback to regular import
        return import('@splinetool/react-spline').then((mod) => mod.default || mod)
      }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
)

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
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Left Side - Content */}
              <div className="flex-1 text-center lg:text-left">
                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                >
                 Back {' '}
                  <span className="text-yellow-400">Nova Era</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto lg:mx-0 leading-relaxed"
                >
                  Uma nova era de aprendizado em programação chegou, e com ela muitos bônus exclusivos para você.
                  <span className="text-yellow-400 font-semibold"> Acesso imediato e garantia de satisfação.</span>
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
                        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    data-cta="main"
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-lg md:text-xl px-8 md:px-12 py-4 md:py-5 rounded-full transition-all shadow-lg shadow-yellow-400/50 hover:shadow-yellow-400/70 transform hover:scale-105"
                  >
                    Garantir minha vaga agora
                  </button>
                </motion.div>
              </div>

              {/* Right Side - Spline Scene */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-1 w-full lg:w-auto"
              >
                <div className="relative w-full h-[400px] lg:h-[500px]">
                  {typeof window !== 'undefined' && (
                    <SplineScene
                      scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                      className="w-full h-full"
                    />
                  )}
                </div>
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

      {/* Formations Detail Section */}
      <FormationsDetailSection />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* Team Work Section */}
      <TeamWorkSection />

      {/* Career Transformation Section */}
      <CareerTransformationSection />

      {/* Guarantee Section */}
      <GuaranteeSection />
    </main>
  )
}

