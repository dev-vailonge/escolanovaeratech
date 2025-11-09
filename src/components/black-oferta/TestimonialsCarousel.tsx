'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const testimonials = Array.from({ length: 17 }, (_, i) => ({
  id: i + 1,
  image: `/images/app${i + 1}.png`,
  alt: `Depoimento de aluno ${i + 1}`
}))

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section className="py-20 bg-gradient-to-b from-black via-black to-yellow-500/10 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Projetos de <span className="text-yellow-400">Alunos</span>
            </h2>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Assim como você, nossos alunos também começaram do absoluto zero e hoje conseguem desenvolver projetos de nível profissional.
            </p>
          </motion.div>

          {/* Carousel */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl px-4 md:px-16">
              <div className="flex items-center gap-2 md:gap-4">
                {/* Previous Image Preview - Hidden on mobile */}
                <div className="hidden md:block flex-shrink-0 w-1/4 opacity-50 scale-90 transition-all">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={testimonials[(currentIndex - 1 + testimonials.length) % testimonials.length].image}
                      alt={testimonials[(currentIndex - 1 + testimonials.length) % testimonials.length].alt}
                      fill
                      className="object-contain rounded-xl"
                      sizes="300px"
                    />
                  </div>
                </div>

                {/* Current Image - Centered */}
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex-shrink-0 w-full md:w-1/2"
                >
                  <div className="relative aspect-[4/3] min-h-[300px] md:min-h-0">
                    <Image
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].alt}
                      fill
                      className="object-contain rounded-xl"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                </motion.div>

                {/* Next Image Preview - Hidden on mobile */}
                <div className="hidden md:block flex-shrink-0 w-1/4 opacity-50 scale-90 transition-all">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={testimonials[(currentIndex + 1) % testimonials.length].image}
                      alt={testimonials[(currentIndex + 1) % testimonials.length].alt}
                      fill
                      className="object-contain rounded-xl"
                      sizes="300px"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all z-10"
              aria-label="Depoimento anterior"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all z-10"
              aria-label="Próximo depoimento"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-yellow-400 w-8'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  aria-label={`Ir para depoimento ${index + 1}`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="text-center mt-4">
              <span className="text-gray-400 text-sm">
                {currentIndex + 1} / {testimonials.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

